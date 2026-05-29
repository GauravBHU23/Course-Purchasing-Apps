import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings


def _password_reset_html(full_name: str, reset_url: str, minutes: int) -> str:
    safe_name = full_name or "there"
    return f"""\
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your CourseStack password</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f8f7;font-family:Arial,Helvetica,sans-serif;color:#13201c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f7;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dce5e1;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#0e7c70,#075e55);padding:28px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">📚 CourseStack</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;color:#13201c;">Reset your password</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#62716b;">
                  Hi {safe_name}, we received a request to reset the password for your CourseStack
                  account. Click the button below to choose a new password. This link is valid for
                  <strong>{minutes} minutes</strong>.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td align="center" style="border-radius:10px;background:#0e7c70;">
                      <a href="{reset_url}" target="_blank"
                         style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#62716b;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 20px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="{reset_url}" style="color:#075e55;">{reset_url}</a>
                </p>
                <hr style="border:none;border-top:1px solid #dce5e1;margin:24px 0;" />
                <p style="margin:0;font-size:13px;line-height:1.6;color:#62716b;">
                  Didn't request this? You can safely ignore this email — your password will stay the
                  same and your account is secure.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#eef7f5;padding:18px 32px;">
                <p style="margin:0;font-size:12px;color:#62716b;">
                  © CourseStack · Secure learning marketplace
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _password_reset_text(full_name: str, reset_url: str, minutes: int) -> str:
    safe_name = full_name or "there"
    return (
        f"Hi {safe_name},\n\n"
        "We received a request to reset your CourseStack password.\n"
        f"Use this link to set a new password (valid for {minutes} minutes):\n\n"
        f"{reset_url}\n\n"
        "If you didn't request this, you can safely ignore this email.\n\n"
        "— CourseStack"
    )


def _verify_html(full_name: str, verify_url: str, hours: int) -> str:
    safe_name = full_name or "there"
    return f"""\
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your CourseStack email</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f8f7;font-family:Arial,Helvetica,sans-serif;color:#13201c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f7;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dce5e1;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#0e7c70,#075e55);padding:28px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">📚 CourseStack</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;color:#13201c;">Welcome, {safe_name}! 🎉</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#62716b;">
                  Thanks for signing up for CourseStack. Please confirm your email address to activate
                  your account and start learning. This link is valid for <strong>{hours} hours</strong>.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td align="center" style="border-radius:10px;background:#0e7c70;">
                      <a href="{verify_url}" target="_blank"
                         style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Verify My Email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#62716b;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 20px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="{verify_url}" style="color:#075e55;">{verify_url}</a>
                </p>
                <hr style="border:none;border-top:1px solid #dce5e1;margin:24px 0;" />
                <p style="margin:0;font-size:13px;line-height:1.6;color:#62716b;">
                  Didn't create this account? You can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#eef7f5;padding:18px 32px;">
                <p style="margin:0;font-size:12px;color:#62716b;">
                  © CourseStack · Secure learning marketplace
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _verify_text(full_name: str, verify_url: str, hours: int) -> str:
    safe_name = full_name or "there"
    return (
        f"Hi {safe_name},\n\n"
        "Welcome to CourseStack! Please verify your email to activate your account.\n"
        f"Use this link (valid for {hours} hours):\n\n"
        f"{verify_url}\n\n"
        "If you didn't sign up, you can ignore this email.\n\n"
        "— CourseStack"
    )


def _send(to_email: str, subject: str, text: str, html: str, dev_label: str, dev_url: str) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        print("=" * 70)
        print(f"[DEV EMAIL] {dev_label} (SMTP not configured)")
        print(f"  To: {to_email}")
        print(f"  Link: {dev_url}")
        print("=" * 70)
        return

    from_email = settings.smtp_from_email or settings.smtp_user
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{from_email}>"
    message["To"] = to_email
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        if settings.smtp_use_tls:
            server.starttls(context=context)
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(from_email, [to_email], message.as_string())


# ---------------------------------------------------------------------------
# Generic notification email (security alerts, welcome, etc.)
# ---------------------------------------------------------------------------
def _notice_html(full_name: str, heading: str, body_html: str, button_label: str | None, button_url: str | None) -> str:
    safe_name = full_name or "there"
    button_block = ""
    if button_label and button_url:
        button_block = f"""\
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td align="center" style="border-radius:10px;background:#0e7c70;">
                      <a href="{button_url}" target="_blank"
                         style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                        {button_label}
                      </a>
                    </td>
                  </tr>
                </table>"""
    return f"""\
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{heading}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f8f7;font-family:Arial,Helvetica,sans-serif;color:#13201c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f7;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dce5e1;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#0e7c70,#075e55);padding:28px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">📚 CourseStack</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;color:#13201c;">{heading}</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#62716b;">Hi {safe_name},</p>
                <div style="font-size:15px;line-height:1.6;color:#62716b;">{body_html}</div>
{button_block}
                <hr style="border:none;border-top:1px solid #dce5e1;margin:24px 0;" />
                <p style="margin:0;font-size:13px;line-height:1.6;color:#62716b;">
                  If this wasn't you, your account may be at risk — reset your password immediately and
                  contact support.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#eef7f5;padding:18px 32px;">
                <p style="margin:0;font-size:12px;color:#62716b;">© CourseStack · Secure learning marketplace</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _send_notice(
    to_email: str,
    subject: str,
    full_name: str,
    heading: str,
    body_html: str,
    body_text: str,
    button_label: str | None = None,
    button_url: str | None = None,
) -> None:
    safe_name = full_name or "there"
    text = f"Hi {safe_name},\n\n{body_text}\n\n— CourseStack"
    html = _notice_html(full_name, heading, body_html, button_label, button_url)
    _send(to_email, subject, text, html, heading, button_url or "(no link)")


def send_welcome_email(to_email: str, full_name: str, login_url: str) -> None:
    _send_notice(
        to_email,
        "Welcome to CourseStack 🎉",
        full_name,
        "Your email is verified!",
        "<p>Your account is now active. You can sign in and start exploring project-first courses.</p>",
        "Your account is now active. Sign in and start learning at " + login_url,
        "Go to Login",
        login_url,
    )


def send_password_changed_email(to_email: str, full_name: str) -> None:
    _send_notice(
        to_email,
        "Your CourseStack password was changed",
        full_name,
        "Password changed",
        "<p>This is a confirmation that the password for your CourseStack account was just changed. "
        "All other sessions have been signed out for your security.</p>",
        "Your CourseStack password was just changed and all other sessions were signed out.",
    )


def send_email_changed_email(to_email: str, full_name: str, new_email: str) -> None:
    _send_notice(
        to_email,
        "Your CourseStack email was changed",
        full_name,
        "Email address updated",
        f"<p>The email address on your CourseStack account was just changed to "
        f"<strong>{new_email}</strong>. We're sending this notice to your previous address so you "
        f"know about the change.</p>",
        f"The email on your CourseStack account was changed to {new_email}.",
    )


def send_verification_email(to_email: str, full_name: str, verify_url: str) -> None:
    settings = get_settings()
    hours = settings.verify_token_hours
    _send(
        to_email,
        "Verify your CourseStack email",
        _verify_text(full_name, verify_url, hours),
        _verify_html(full_name, verify_url, hours),
        "Email verification",
        verify_url,
    )


def send_password_reset_email(to_email: str, full_name: str, reset_url: str) -> None:
    """Send the reset email via SMTP, or print to console in dev mode."""
    settings = get_settings()
    minutes = settings.reset_token_minutes
    html = _password_reset_html(full_name, reset_url, minutes)
    text = _password_reset_text(full_name, reset_url, minutes)

    if not settings.smtp_host:
        # Dev fallback: no SMTP configured — log link to the console.
        print("=" * 70)
        print("[DEV EMAIL] Password reset (SMTP not configured)")
        print(f"  To: {to_email}")
        print(f"  Reset link: {reset_url}")
        print("=" * 70)
        return

    from_email = settings.smtp_from_email or settings.smtp_user
    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset your CourseStack password"
    message["From"] = f"{settings.smtp_from_name} <{from_email}>"
    message["To"] = to_email
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        if settings.smtp_use_tls:
            server.starttls(context=context)
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(from_email, [to_email], message.as_string())
