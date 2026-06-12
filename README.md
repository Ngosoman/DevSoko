# DevSoko

DevSoko is a developer marketplace for publishing projects, managing buyer and seller accounts, and handling checkout flows with Supabase-backed frontend auth and a Django REST backend for payments and admin operations.

## Overview

The app is split into two parts:

- A React + Vite frontend in the repository root
- A Django + Django REST Framework backend in `Backend/DevBackend`

The frontend includes buyer and seller dashboards, project browsing, project uploads, token purchase flows, a Hire Developers page, and a contact page. The backend provides M-Pesa payment endpoints, Firebase authentication hooks, rate limiting, and API support for the marketplace flows.

## Features

- Seller and buyer onboarding
- Project upload and browsing flows
- Buyer, seller, and admin dashboards
- Checkout and M-Pesa STK push integration
- Dev token purchase screens
- Hire Developers page with curated developer profiles
- Contact inquiry form for hiring requests
- Supabase auth and data access from the frontend
- Firebase-backed backend authentication support
- Theme persistence with light and dark modes

## Hire Developers

The Hire Developers page is the main entry point for clients who want to bring in talent from DevSoko.

- Visitors can browse a curated set of top developers with specialties, experience, and starting rates.
- Each developer card points users to the contact flow instead of direct booking.
- The page includes a `ContactInquiryForm` where users submit their name, email, company, and hiring requirements.
- The form performs basic validation before submitting the request.
- The expected workflow is to collect the inquiry first, then follow up through the contact system to match the client with the right developer.

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

## Key User Flow

1. A visitor opens the Hire Developers page from the navbar.
2. They review the featured developers and choose the best fit.
3. They submit the inquiry form with project details and hiring requirements.
4. DevSoko follows up through the contact system to continue the hiring process.




