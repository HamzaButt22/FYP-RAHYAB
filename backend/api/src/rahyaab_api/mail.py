"""Staff emails: queued by the API or the admin command, sent by the jobs worker (SECURITY.md §5.2).

Queuing instead of sending keeps a reset request's answer and timing the same whether or not the account
exists. Only staff addresses are ever emailed; students and parents are never emailed.

Sending (jobs.py, `send_outbox`):
- MAIL_TRANSPORT=smtp (the default): SMTP_URL, for example `smtp://user:password@smtp.example.pk:587`
  (STARTTLS) or `smtps://user:password@smtp.example.pk:465` (TLS), and MAIL_FROM. Without SMTP_URL nothing is
  sent and the worker logs how many emails wait (never their content).
- MAIL_TRANSPORT=log, allowed only with APP_ENV=development or test: the email is written to the worker's
  log instead (`python tools/dev.py logs jobs`), so the invite and reset links can be tried on a computer
  with no mail server. The worker refuses to start with it anywhere else, so it can't reach a release.
"""

from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import unquote, urlsplit

from sqlalchemy import Connection, text

TEMPLATES = ("staff_invite", "staff_reset", "staff_password_changed")
_FOOTER = (
    "\n\nRahyaab\nThis email was sent to a staff account. If it wasn't you, tell your school's Rahyaab admin."
)


def queue(conn: Connection, to_address: str, template: str, link: str | None = None) -> None:
    if template not in TEMPLATES:
        raise ValueError(f"unknown email template: {template}")
    conn.execute(
        text("INSERT INTO email_outbox (to_address, template, link) VALUES (:to, :t, :l)"),
        {"to": to_address, "t": template, "l": link},
    )


def render(template: str, link: str | None) -> tuple[str, str]:
    """(subject, plain-text body)."""
    if template == "staff_invite":
        return (
            "Set up your Rahyaab account",
            "You have been given a Rahyaab staff account.\n\n"
            f"Choose your password here (the link works once, for 72 hours):\n{link}\n\n"
            "You will also need an authenticator app on your phone, such as Google Authenticator or "
            "Microsoft Authenticator. The dashboard shows you how to set it up." + _FOOTER,
        )
    if template == "staff_reset":
        return (
            "Reset your Rahyaab password",
            "Someone asked to reset the password of your Rahyaab staff account.\n\n"
            f"Choose a new password here (the link works once, for 30 minutes):\n{link}\n\n"
            "If you didn't ask for this, ignore this email; your password stays the same. You will still "
            "need the code from your authenticator app to sign in." + _FOOTER,
        )
    if template == "staff_password_changed":
        return (
            "Your Rahyaab password was changed",
            "The password of your Rahyaab staff account was just changed, "
            "and every device was signed out.\n\n"
            "If you didn't do this, tell your school's Rahyaab admin today." + _FOOTER,
        )
    raise ValueError(f"unknown email template: {template}")


def message(sender: str, to_address: str, template: str, link: str | None) -> EmailMessage:
    subject, body = render(template, link)
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = sender, to_address, subject
    msg.set_content(body)
    return msg


def smtp_send(smtp_url: str, msg: EmailMessage) -> None:
    """Sends one message. smtps:// uses TLS from the start; smtp:// must use STARTTLS (never plain)."""
    parts = urlsplit(smtp_url)
    if parts.scheme not in ("smtp", "smtps") or not parts.hostname:
        raise ValueError("SMTP_URL must look like smtp://user:password@host:587 or smtps://...:465")
    context = ssl.create_default_context()
    port = parts.port or (465 if parts.scheme == "smtps" else 587)
    if parts.scheme == "smtps":
        server: smtplib.SMTP = smtplib.SMTP_SSL(parts.hostname, port, context=context, timeout=20)
    else:
        server = smtplib.SMTP(parts.hostname, port, timeout=20)
        server.starttls(context=context)
    with server:
        if parts.username:
            server.login(unquote(parts.username), unquote(parts.password or ""))
        server.send_message(msg)
