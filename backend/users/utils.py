from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from decouple import config
import logging

logger = logging.getLogger(__name__)

def send_activation_email(user):
    """
    Centralized function to send activation emails to users.
    This eliminates redundant code across the application.
    """
    try:
        # Get the base URL from environment variable
        base_url = config('ACTIVATION_URL', default='http://localhost:8000')
        # Remove any trailing 'activate' from the base URL if present
        if base_url.endswith('/activate'):
            base_url = base_url.rsplit('/activate', 1)[0]
        
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Form the correct activation link with the api/users/activate path
        activation_link = f"{base_url}/api/users/activate/{uid}/{token}/"
        
        subject = "Activate your Uchef account"
        message = f"Hi {user.username},\n\nPlease click the link below to activate your account:\n\n{activation_link}\n\nThank you!"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]
        
        logger.info(f"Sending activation email to {user.email} with link {activation_link}")
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        logger.info(f"Activation email sent successfully to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send activation email to {user.email}: {str(e)}")
        return False


def send_password_reset_email(user):
    """
    Send a password reset email to the user with a secure token link.
    """
    try:
        # Get the base URL from environment variable
        frontend_url = config('FRONTEND_URL', default='http://localhost:5173')
        
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Form the password reset link
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}"
        
        subject = "Reset your UChef password"
        message = f"Hi {user.username},\n\nWe received a request to reset your password. If you didn't make this request, you can safely ignore this email.\n\nTo reset your password, click the link below:\n\n{reset_url}\n\nThis link will expire in 24 hours.\n\nThank you!"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]
        
        logger.info(f"Sending password reset email to {user.email} with link {reset_url}")
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        logger.info(f"Password reset email sent successfully to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return False