# Secure Deployment Guide for DevSoko

## Prerequisites
- Domain with SSL certificate (Let's Encrypt or purchased)
- Secure hosting (Render, Heroku, AWS, etc.)
- Database (PostgreSQL recommended for production)

## Environment Variables
Copy `.env.example` to `.env` and fill in secure values:

```bash
cp .env.example .env
```

Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

## Firebase Setup
1. Create Firebase project
2. Enable Authentication with Email/Password
3. Enable Email Verification
4. Create Service Account and download JSON
5. Set FIREBASE_PRIVATE_KEY from the JSON (keep quotes and \n)

## Database Migration
For production, switch to PostgreSQL:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

## Deployment Steps
1. Set DEBUG=False in environment
2. Run migrations: `python manage.py migrate`
3. Collect static files: `python manage.py collectstatic`
4. Ensure HTTPS is enforced by hosting provider
5. Set up monitoring for logs

## Security Checklist
- [ ] HTTPS enforced
- [ ] DEBUG=False
- [ ] SECRET_KEY is strong and unique
- [ ] Database not publicly accessible
- [ ] Logs monitored
- [ ] Firebase service account key secure
- [ ] M-Pesa credentials secure
- [ ] Regular security updates

## Monitoring
- Check `logs/django.log` and `logs/security.log`
- Set up alerts for authentication failures
- Monitor for unusual API usage patterns