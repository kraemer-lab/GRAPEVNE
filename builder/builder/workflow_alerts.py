from dataclasses import dataclass


@dataclass
class EmailSettings:
    """EmailSettings class for the WorkflowAlert"""
    smtp_address: str = ""
    smtp_port: int = 0
    sender: str = ""
    username: str = ""
    password: str = ""


@dataclass
class Message:
    """Message class for the WorkflowAlert"""
    subject: str = ""
    body: str = ""
    recipients: str = ""


@dataclass
class WorkflowAlerts:
    """Initialise the WorkflowAlert"""
    email_settings = EmailSettings()
    onsuccess = Message()
    onerror = Message()


def ProcessWorkflowAlerts(config: dict) -> WorkflowAlerts:
    alert = WorkflowAlerts()

    # Email settings
    email_settings = config.get("email_settings", {})
    alert.email_settings.smtp_address = email_settings.get("smtp_server", "")
    alert.email_settings.smtp_port = email_settings.get("smtp_port", 0)
    alert.email_settings.sender = email_settings.get("sender", "")
    alert.email_settings.username = email_settings.get("username", "")
    alert.email_settings.password = email_settings.get("password", "")

    # On success
    onsuccess = config.get("onsuccess", {})
    if onsuccess:
        message = onsuccess.get("message", {})
        alert.onsuccess.subject = message.get("subject", "")
        alert.onsuccess.body = message.get("body", "")
        alert.onsuccess.recipients = message.get("recipients", "")

    # On Error
    onerror = config.get("onerror", {})
    if onerror:
        message = onerror.get("message", {})
        alert.onerror.subject = message.get("subject", "")
        alert.onerror.body = message.get("body", "")
        alert.onerror.recipients = message.get("recipients", "")

    return alert
