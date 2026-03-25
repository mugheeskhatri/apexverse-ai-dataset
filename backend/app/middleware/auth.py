from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, Subscription, SubStatusEnum
from app.utils.auth import decode_access_token
from app.config import settings

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def get_current_active_subscriber(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Require active, non-expired subscription to access dashboard."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        raise HTTPException(
            status_code=402,
            detail={"code": "no_active_subscription", "message": "No subscription found. Please complete checkout."}
        )

    if sub.status == SubStatusEnum.past_due:
        raise HTTPException(
            status_code=402,
            detail={"code": "payment_past_due", "message": "Your payment is past due. Please update your payment method."}
        )

    if sub.status == SubStatusEnum.canceled:
        raise HTTPException(
            status_code=402,
            detail={"code": "subscription_canceled", "message": "Your subscription has been canceled. Please re-subscribe."}
        )

    if sub.status not in [SubStatusEnum.active, SubStatusEnum.trialing]:
        raise HTTPException(
            status_code=402,
            detail={"code": "subscription_inactive", "message": "Your subscription is not active."}
        )

    # Check if the billing period has expired
    # For Stripe-managed subs this is handled by webhooks automatically,
    # but this is a safety net for cases where the webhook was missed
    if sub.current_period_end:
        now = datetime.now(timezone.utc)
        period_end = sub.current_period_end
        # Make timezone-aware if naive
        if period_end.tzinfo is None:
            period_end = period_end.replace(tzinfo=timezone.utc)

        if now > period_end:
            # Mark as expired in DB so future calls are faster
            sub.status = SubStatusEnum.past_due
            await db.commit()
            raise HTTPException(
                status_code=402,
                detail={
                    "code": "subscription_expired",
                    "message": "Your subscription period has ended. Please renew to continue.",
                    "expired_at": period_end.isoformat(),
                }
            )

    return user
