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


## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ or compatible version for Django
- A Supabase project
- Firebase service account details for backend auth
- M-Pesa API credentials for payment testing or production



## Deployment Notes

- The repository includes Vercel configuration for the frontend.
- The backend includes a `Procfile` and deployment guidance in `Backend/DEPLOYMENT.md`.
- Production deployment should use secure environment variables and a public callback URL for M-Pesa.




