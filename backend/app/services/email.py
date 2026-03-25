import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def _send(to: str, subject: str, html: str):
    """Send email via SendGrid. Falls back to logging if not configured."""
    if not settings.SENDGRID_API_KEY or settings.SENDGRID_API_KEY.startswith("SG.YOUR"):
        logger.info(f"[EMAIL MOCK] To: {to} | Subject: {subject}")
        return

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        message = Mail(
            from_email=(settings.FROM_EMAIL, settings.FROM_NAME),
            to_emails=to,
            subject=subject,
            html_content=html,
        )
        sg.send(message)
    except Exception as e:
        logger.error(f"Email send failed: {e}")


async def send_verification_email(to: str, name: str, token: str):
    link = f"{settings.BACKEND_URL}/auth/verify-email?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#18170F">Verify your Apexverse account</h2>
      <p>Hi {name},</p>
      <p>Click below to verify your email address:</p>
      <a href="{link}" style="background:#D4622A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Verify Email</a>
      <p style="color:#888;font-size:13px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    </div>
    """
    await _send(to, "Verify your Apexverse email", html)


async def send_password_reset_email(to: str, name: str, token: str):
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#18170F">Reset your password</h2>
      <p>Hi {name},</p>
      <p>Click below to set a new password:</p>
      <a href="{link}" style="background:#18170F;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Reset Password</a>
      <p style="color:#888;font-size:13px">Link expires in 24 hours. If you didn't request this, ignore this email.</p>
    </div>
    """
    await _send(to, "Reset your Apexverse password", html)


async def send_payment_confirmed_email(to: str, name: str, plan: str, cycle: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#18170F">Payment confirmed</h2>
      <p>Hi {name},</p>
      <p>Your <strong>Apexverse {plan.capitalize()}</strong> subscription is now active ({cycle} billing).</p>
      <a href="{settings.FRONTEND_URL}/dashboard" style="background:#D4622A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Go to Dashboard</a>
      <p style="color:#888;font-size:13px">Questions? Email billing@apexverse.ai</p>
    </div>
    """
    await _send(to, "Your Apexverse subscription is active", html)


async def send_payment_failed_email(to: str, name: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#C0392B">Payment failed</h2>
      <p>Hi {name},</p>
      <p>We couldn't process your payment. Please update your payment method to keep your workspace active.</p>
      <a href="{settings.FRONTEND_URL}/billing" style="background:#18170F;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Update Payment Method</a>
    </div>
    """
    await _send(to, "Action required: Payment failed", html)


async def send_team_invite_email(to: str, inviter_name: str, token: str):
    link = f"{settings.BACKEND_URL}/team/accept/{token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#18170F">You've been invited to Apexverse</h2>
      <p>{inviter_name} has invited you to join their Apexverse workspace.</p>
      <a href="{link}" style="background:#D4622A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Accept Invitation</a>
      <p style="color:#888;font-size:13px">Link expires in 48 hours.</p>
    </div>
    """
    await _send(to, f"{inviter_name} invited you to Apexverse", html)
