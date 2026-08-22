# MailHog - Email Trap for Development

## Overview

MailHog is an email testing tool for developers. It runs an SMTP server that captures all outgoing emails, allowing you to view them in a web interface without actually sending them.

## Access

**MailHog Web UI:** http://localhost:8025

### What You Can Do

1. **View All Emails** - See every email sent by the application
2. **Inspect Email Details** - View HTML, plain text, headers, etc.
3. **Download Emails** - Download emails as .eml files for testing
4. **Test Email Rendering** - Check how emails look in different formats
5. **No Real Email Sending** - Emails don't leave your machine

## Configuration

### Environment Variables

The application uses these environment variables to connect to MailHog:

```env
# Email (MAILHOG - Development)
SMTP_SERVER=mailhog
SMTP_PORT=1025
SMTP_USER=test@example.com
SMTP_PASSWORD=test
SMTP_FROM=noreply@sextant.local
SMTP_USE_TLS=false
```

### Connection Details

- **SMTP Host:** `mailhog` (inside container) or `localhost` (from host)
- **SMTP Port:** `1025`
- **Web UI Port:** `8025`
- **No TLS/SSL:** Not needed for local development
- **No Authentication:** Optional (can be any values)

## Usage Examples

### Python (FastAPI Backend)

```python
import smtplib
from email.mime.text import MIMEText
from app.core.config import settings

def send_email(to_email: str, subject: str, body: str):
    """Send email via MailHog."""
    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = settings.SMTP_FROM
        msg['To'] = to_email
        
        server.send_message(msg)
        server.quit()
        
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")
```

### Using with Keycloak

You can configure Keycloak to send emails through MailHog:

1. Go to Keycloak Admin Console → Realm Settings → Email
2. Configure SMTP:
   - **Host:** `mailhog`
   - **Port:** `1025`
   - **From:** `noreply@sextant.local`
   - **Enable SSL/TLS:** No
   - **Test Connection:** Click to verify

## Viewing Emails

### In MailHog Web UI

1. Open http://localhost:8025
2. All sent emails appear in the inbox
3. Click an email to view full details
4. Switch between HTML, Plain Text, and Raw views

### Email Structure

Each email shows:
- **From/To:** Sender and recipient addresses
- **Subject:** Email subject line
- **Received Time:** When the email was sent
- **Headers:** All email headers
- **Body:** HTML and plain text versions
- **Attachments:** Any attachments (if supported)

## Clearing Emails

### Delete All Emails

```bash
# Open MailHog API in browser
curl -X DELETE http://localhost:8025/api/v1/messages
```

Or manually delete in the web UI by selecting emails and clicking delete.

## Troubleshooting

### MailHog Not Running

```bash
# Check if container is running
docker-compose ps mailhog

# View logs
docker-compose logs mailhog

# Restart MailHog
docker-compose restart mailhog
```

### Can't Connect to MailHog

**From inside container:**
```bash
# Test connection from API container
docker-compose exec api telnet mailhog 1025
```

**From host machine:**
```bash
# Test connection from localhost
telnet localhost 1025
```

### Emails Not Appearing

1. Verify SMTP host is set to `mailhog` (inside container)
2. Check SMTP port is `1025`
3. Verify no TLS/SSL is configured
4. Check application logs for errors
5. Restart application: `docker-compose restart api`

## Best Practices

1. **Use MailHog for all local development** - Never use production email addresses
2. **Test email templates** - View how emails render in different formats
3. **Check encoding** - Verify special characters and non-ASCII text
4. **Test error cases** - Send emails with invalid content
5. **Inspect headers** - Verify email headers are correct

## Production Considerations

For production, you would configure a real email service:

```env
# Production Email Configuration
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
SMTP_USE_TLS=true
```

Supported email services:
- SendGrid
- Mailgun
- AWS SES
- Gmail (with app password)
- Custom SMTP servers

## MailHog Specifications

- **Version:** v1.0.1 (included in docker-compose)
- **Memory Usage:** ~30-50 MB
- **Disk Usage:** Minimal (in-memory storage)
- **Network:** Only accessible on internal Docker network + localhost
- **Persistence:** Emails cleared on container restart

## Web UI Features

### Dashboard
- Email count
- Latest emails list
- Quick search

### Email Viewer
- Source view (raw SMTP)
- HTML view
- Plain text view
- Headers view
- Download as .eml

### API
- REST API for programmatic access
- View emails: `GET /api/v1/messages`
- Delete emails: `DELETE /api/v1/messages`
- Get email: `GET /api/v1/messages/:id`

## Integration with Application

The FastAPI backend can be extended to send emails:

```python
# app/services/email_service.py
from app.core.config import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailService:
    """Service for sending emails via SMTP."""
    
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str = None
    ) -> bool:
        """Send email."""
        try:
            server = smtplib.SMTP(
                settings.SMTP_SERVER,
                settings.SMTP_PORT
            )
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.SMTP_FROM
            msg['To'] = to_email
            
            if text_body:
                msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            
            server.send_message(msg)
            server.quit()
            
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

# Usage in routes
@router.post("/send-verification-email")
async def send_verification_email(email: str):
    subject = "Email Verification"
    html_body = "<h1>Verify Your Email</h1><p>Click the link below...</p>"
    
    if EmailService.send_email(email, subject, html_body):
        return {"status": "email sent"}
    else:
        return {"status": "error sending email"}
```

## Additional Resources

- [MailHog GitHub](https://github.com/mailhog/MailHog)
- [MailHog Documentation](https://github.com/mailhog/MailHog/blob/master/README.md)
- [SMTP Protocol](https://tools.ietf.org/html/rfc5321)
- [Email Standards](https://tools.ietf.org/html/rfc5322)
