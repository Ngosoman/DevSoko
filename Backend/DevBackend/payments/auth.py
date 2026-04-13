import firebase_admin
from firebase_admin import auth, credentials
from django.conf import settings
from rest_framework import authentication, exceptions
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger('payments')

# Initialize Firebase Admin SDK
if not firebase_admin._apps and settings.FIREBASE_PRIVATE_KEY:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": settings.FIREBASE_PROJECT_ID,
        "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
        "client_email": settings.FIREBASE_CLIENT_EMAIL,
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    firebase_admin.initialize_app(cred)

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            id_token = auth_header.split(' ')[1]  # Bearer <token>
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            email = decoded_token.get('email')
            email_verified = decoded_token.get('email_verified', False)

            if not email_verified:
                logger.warning(f'Authentication failed: Email not verified for user {uid}')
                raise exceptions.AuthenticationFailed('Email not verified')

            # Get or create user
            User = get_user_model()
            user, created = User.objects.get_or_create(
                username=uid,
                defaults={'email': email}
            )
            logger.info(f'Authentication successful for user {uid}')
            return (user, None)
        except Exception as e:
            logger.warning(f'Authentication failed: {str(e)}')
            raise exceptions.AuthenticationFailed('Invalid token')