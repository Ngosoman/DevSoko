# DevSoko

DevSoko is a developer marketplace for publishing projects, managing buyer and seller accounts, and handling checkout flows with Supabase-backed frontend auth and a Django REST backend for payments and admin operations.

## Overview

The app is split into two parts:

- A React + Vite frontend in the repository root
- A Django + Django REST Framework backend in `Backend/DevBackend`

The frontend includes buyer and seller dashboards, project browsing, project uploads, token purchase flows, and a contact page. The backend provides M-Pesa payment endpoints, Firebase authentication hooks, rate limiting, and API support for the marketplace flows.

## Features

- Seller and buyer onboarding
- Project upload and browsing flows
- Buyer, seller, and admin dashboards
- Checkout and M-Pesa STK push integration
- Dev token purchase screens
- Supabase auth and data access from the frontend
- Firebase-backed backend authentication support
- Theme persistence with light and dark modes

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS |
| State/Auth | Supabase JavaScript client |
| Backend | Django 5, Django REST Framework |
| Payments | Safaricom M-Pesa Daraja API |
| Auth on backend | Firebase Admin SDK |
| Tooling | ESLint, Jest, Framer Motion, React Router |

## Repository Layout

```text
.
├── src/                    # Frontend application code
├── Backend/DevBackend/     # Django project and payments app
├── public/                 # Static frontend assets
├── server/                 # Node server entry point
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ or compatible version for Django
- A Supabase project
- Firebase service account details for backend auth
- M-Pesa API credentials for payment testing or production

## Environment Variables

Create a frontend `.env` file in the repository root with:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Create a backend `.env` file in `Backend/DevBackend` or `Backend` with the values expected by `Backend/DevBackend/DevBackend/settings.py`:

```bash
SECRET_KEY=your_secret_key
DEBUG=true_or_false
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_ENVIRONMENT=sandbox_or_production
MPESA_CALLBACK_URL=https://your-public-url/api/mpesa/callback/
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

## Local Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd Backend/DevBackend
pip install -r ../requirements.txt
```

3. Run Django migrations:

```bash
python manage.py migrate
```

4. Start the backend server:

```bash
python manage.py runserver
```

5. In a second terminal, start the frontend:

```bash
npm run dev
```

## Available Scripts

From the repository root:

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm test
```

## Backend API

The Django project exposes routes under `/api/`, including:

- `POST /api/mpesa/stk-push/` for M-Pesa checkout initiation
- `POST /api/mpesa/callback/` for payment callbacks
- `GET /api/mpesa/get-ngrok-url/` for the current callback URL state
- `POST /api/mpesa/set-callback-url/` to override the callback URL at runtime
- `GET /api/orders/` for authenticated order lookup
- `POST /api/register/` for the frontend registration hook

## Deployment Notes

- The repository includes Vercel configuration for the frontend.
- The backend includes a `Procfile` and deployment guidance in `Backend/DEPLOYMENT.md`.
- Production deployment should use secure environment variables and a public callback URL for M-Pesa.

## Contributing

Keep changes small and focused. Update the README whenever the app structure, scripts, or environment variables change.

## License

ISC


