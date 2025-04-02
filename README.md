# MediPlus

MediPlus is a digital prescription management system that enables doctors to upload prescriptions, patients to view them, and pharmacists to process and manage orders efficiently. It also includes an admin dashboard for inventory oversight and analytics.

## Features

- Secure user authentication (JWT-based)
- Role-based access for Doctor, Patient, Pharmacist, and Admin
- Prescription upload and PDF handling
- Table extraction from PDFs using AI for inventory validation
- Pharmacy module with OTP-based pickup confirmation
- Real-time inventory tracking and analytics
- Admin dashboard for managing medicine stock

## Tech Stack

### Frontend
- React.js (Vite)

### Backend
- FastAPI
- OAuth2 + JWT for authentication
- Tesseract for PDF table extraction

### Database
- MySQL

