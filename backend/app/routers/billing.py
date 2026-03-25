from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, Subscription, Invoice, Notification, SubStatusEnum, PlanEnum, CycleEnum, InvoiceStatusEnum, NotifTypeEnum
from app.middleware.auth import get_current_user
from app.services.email import send_payment_confirmed_email, send_payment_failed_email
from app.config import settings
import stripe
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY

PLAN_PRICES = {
    ("starter", "monthly"): settings.STRIPE_PRICE_STARTER_MONTHLY,
    ("starter", "annual"): settings.STRIPE_PRICE_STARTER_ANNUAL,
    ("growth", "monthly"): settings.STRIPE_PRICE_GROWTH_MONTHLY,
    ("growth", "annual"): settings.STRIPE_PRICE_GROWTH_ANNUAL,
    ("professional", "monthly"): settings.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    ("professional", "annual"): settings.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
}


class CheckoutRequest(BaseModel):
    plan: str
    cycle: str
    years: int = 1


class ChangePlanRequest(BaseModel):
    plan: str
    cycle: str


# ── Checkout Session ──────────────────────────────────────

@router.post("/create-checkout-session")
async def create_checkout_session(
    body: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    price_id = PLAN_PRICES.get((body.plan, body.cycle))
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid plan or cycle")

    # Get or create Stripe customer
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()

    customer_id = sub.stripe_customer_id if sub else None
    if not customer_id:
        customer = stripe.Customer.create(email=user.email, name=user.name, metadata={"user_id": str(user.id)})
        customer_id = customer.id

    session_params = {
        "customer": customer_id,
        "payment_method_types": ["card"],
        "line_items": [{"price": price_id, "quantity": 1}],
        "mode": "subscription",
        "success_url": f"{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{settings.FRONTEND_URL}/checkout?plan={body.plan}&cycle={body.cycle}",
        "metadata": {"user_id": str(user.id), "plan": body.plan, "cycle": body.cycle, "years": str(body.years)},
    }

    session = stripe.checkout.Session.create(**session_params)
    return {"session_url": session.url, "session_id": session.id}


# ── Stripe Webhook ────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info(f"Stripe event: {event_type}")

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data, db)

    elif event_type == "invoice.paid":
        await _handle_invoice_paid(data, db)

    elif event_type == "invoice.payment_failed":
        await _handle_invoice_failed(data, db)

    elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
        await _handle_subscription_updated(data, db, deleted=(event_type == "customer.subscription.deleted"))

    return {"ok": True}


async def _handle_checkout_completed(session: dict, db: AsyncSession):
    user_id = session.get("metadata", {}).get("user_id")
    plan = session.get("metadata", {}).get("plan", "starter")
    cycle = session.get("metadata", {}).get("cycle", "monthly")
    customer_id = session.get("customer")
    stripe_sub_id = session.get("subscription")

    if not user_id:
        return

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return

    quota = settings.PLAN_QUOTAS.get(plan, {}).get("pages", 1000)

    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    sub = sub_result.scalar_one_or_none()

    # Fetch subscription period dates from Stripe
    from datetime import datetime, timezone as tz
    period_start = None
    period_end = None
    if stripe_sub_id:
        try:
            stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
            period_start = datetime.fromtimestamp(stripe_sub["current_period_start"], tz=tz.utc)
            period_end   = datetime.fromtimestamp(stripe_sub["current_period_end"],   tz=tz.utc)
        except Exception:
            pass

    if not sub:
        sub = Subscription(
            id=uuid.uuid4(),
            user_id=user_id,
            plan=plan,
            cycle=cycle,
            status=SubStatusEnum.active,
            stripe_customer_id=customer_id,
            stripe_subscription_id=stripe_sub_id,
            page_quota=quota,
            pages_used_this_period=0,
            current_period_start=period_start,
            current_period_end=period_end,
        )
        db.add(sub)
    else:
        sub.plan = plan
        sub.cycle = cycle
        sub.status = SubStatusEnum.active
        sub.stripe_customer_id = customer_id
        sub.stripe_subscription_id = stripe_sub_id
        sub.page_quota = quota
        sub.pages_used_this_period = 0
        if period_start: sub.current_period_start = period_start
        if period_end:   sub.current_period_end   = period_end

    # Welcome notification
    notif = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        type=NotifTypeEnum.billing,
        title="Subscription activated",
        body=f"Welcome to Apexverse {plan.capitalize()}! Your workspace is ready.",
        link="/dashboard",
    )
    db.add(notif)

    await send_payment_confirmed_email(user.email, user.name or "there", plan, cycle)
    await db.commit()


async def _handle_invoice_paid(invoice: dict, db: AsyncSession):
    customer_id = invoice.get("customer")
    sub_result = await db.execute(select(Subscription).where(Subscription.stripe_customer_id == customer_id))
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return

    # Reset usage and update billing period from Stripe invoice data
    sub.pages_used_this_period = 0
    sub.status = SubStatusEnum.active

    # Update period dates from Stripe — this is what keeps access alive
    period_start = invoice.get("period_start")
    period_end   = invoice.get("period_end")
    if period_start:
        from datetime import datetime, timezone
        sub.current_period_start = datetime.fromtimestamp(period_start, tz=timezone.utc)
    if period_end:
        from datetime import datetime, timezone
        sub.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)

    # Create invoice record
    receipt = f"APX-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
    inv = Invoice(
        id=uuid.uuid4(),
        user_id=sub.user_id,
        subscription_id=sub.id,
        stripe_invoice_id=invoice.get("id"),
        receipt_number=receipt,
        amount_paid=invoice.get("amount_paid", 0),
        currency=invoice.get("currency", "usd"),
        status=InvoiceStatusEnum.paid,
        paid_at=datetime.now(timezone.utc),
    )
    db.add(inv)

    notif = Notification(
        id=uuid.uuid4(),
        user_id=sub.user_id,
        type=NotifTypeEnum.billing,
        title="Payment confirmed",
        body=f"Invoice {receipt} — ${invoice.get('amount_paid', 0) / 100:.2f} charged",
        link="/billing",
    )
    db.add(notif)

    user_result = await db.execute(select(User).where(User.id == sub.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        await send_payment_confirmed_email(user.email, user.name or "there", sub.plan, sub.cycle)

    await db.commit()


async def _handle_invoice_failed(invoice: dict, db: AsyncSession):
    customer_id = invoice.get("customer")
    sub_result = await db.execute(select(Subscription).where(Subscription.stripe_customer_id == customer_id))
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return

    sub.status = SubStatusEnum.past_due

    notif = Notification(
        id=uuid.uuid4(),
        user_id=sub.user_id,
        type=NotifTypeEnum.billing,
        title="Payment failed",
        body="Your payment could not be processed. Please update your payment method.",
        link="/billing",
    )
    db.add(notif)

    user_result = await db.execute(select(User).where(User.id == sub.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        await send_payment_failed_email(user.email, user.name or "there")

    await db.commit()


async def _handle_subscription_updated(stripe_sub: dict, db: AsyncSession, deleted: bool = False):
    stripe_sub_id = stripe_sub.get("id")
    sub_result = await db.execute(select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id))
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return

    if deleted:
        sub.status = SubStatusEnum.canceled
        sub.canceled_at = datetime.now(timezone.utc)
    else:
        stripe_status = stripe_sub.get("status")
        status_map = {
            "active": SubStatusEnum.active,
            "past_due": SubStatusEnum.past_due,
            "canceled": SubStatusEnum.canceled,
            "trialing": SubStatusEnum.trialing,
        }
        sub.status = status_map.get(stripe_status, sub.status)

    await db.commit()


# ── Subscription Info ─────────────────────────────────────

@router.get("/subscription")
async def get_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return {"has_subscription": False}

    return {
        "has_subscription": True,
        "plan": sub.plan,
        "cycle": sub.cycle,
        "status": sub.status,
        "page_quota": sub.page_quota,
        "pages_used": sub.pages_used_this_period,
        "pages_remaining": max(0, sub.page_quota - sub.pages_used_this_period),
        "usage_pct": round((sub.pages_used_this_period / sub.page_quota) * 100, 1) if sub.page_quota else 0,
        "current_period_end": sub.current_period_end,
        "canceled_at": sub.canceled_at,
    }


@router.post("/cancel")
async def cancel_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    if not sub or not sub.stripe_subscription_id:
        raise HTTPException(status_code=404, detail="No active subscription")

    stripe.Subscription.modify(sub.stripe_subscription_id, cancel_at_period_end=True)
    sub.canceled_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True, "message": "Subscription will cancel at end of billing period"}


@router.get("/invoices")
async def list_invoices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.user_id == user.id).order_by(Invoice.created_at.desc())
    )
    invoices = result.scalars().all()
    return [
        {
            "id": str(inv.id),
            "receipt_number": inv.receipt_number,
            "amount": inv.amount_paid / 100,
            "currency": inv.currency,
            "status": inv.status,
            "paid_at": inv.paid_at,
            "pdf_url": inv.pdf_url,
        }
        for inv in invoices
    ]


@router.get("/portal")
async def billing_portal(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No Stripe customer found")

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/billing",
    )
    return {"url": session.url}


@router.post("/request-refund")
async def request_refund(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")

    usage_pct = (sub.pages_used_this_period / sub.page_quota) if sub.page_quota else 0
    if usage_pct >= 0.20:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "refund_quota_exceeded",
                "message": "Refund not available. More than 20% of your page quota has been used.",
                "pages_used_pct": round(usage_pct * 100, 1),
            }
        )

    # Get latest invoice
    inv_result = await db.execute(
        select(Invoice).where(Invoice.user_id == user.id, Invoice.status == InvoiceStatusEnum.paid)
        .order_by(Invoice.created_at.desc())
    )
    invoice = inv_result.scalars().first()
    if not invoice or not invoice.stripe_invoice_id:
        raise HTTPException(status_code=400, detail="No eligible invoice found")

    # Get payment intent from Stripe invoice
    stripe_invoice = stripe.Invoice.retrieve(invoice.stripe_invoice_id)
    payment_intent = stripe_invoice.get("payment_intent")
    if payment_intent:
        stripe.Refund.create(payment_intent=payment_intent)

    sub.status = SubStatusEnum.canceled
    sub.canceled_at = datetime.now(timezone.utc)
    invoice.status = InvoiceStatusEnum.void
    await db.commit()

    return {"ok": True, "message": "Refund processed. Your subscription has been canceled."}
