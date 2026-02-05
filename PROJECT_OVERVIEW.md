# 🎓 Blockchain Certificate Verification System - Project Overview

## 📋 Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Features Overview](#features-overview)
5. [Authentication System](#authentication-system)
6. [Three Portals](#three-portals)
7. [Blockchain Integration](#blockchain-integration)
8. [Database Schema](#database-schema)
9. [API & Edge Functions](#api--edge-functions)
10. [Security Features](#security-features)

---

## 🎯 Introduction

This is a **Blockchain-Based Certificate Verification System** that allows educational institutions to issue tamper-proof digital certificates on the Ethereum blockchain. The system provides:

- **Immutable Records**: Certificates stored on blockchain cannot be altered
- **Instant Verification**: Anyone can verify a certificate using its hash or QR code
- **Decentralized**: No single point of failure or control
- **Role-Based Access**: Secure access control for admins, students, and verifiers

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│              React + TypeScript + Tailwind CSS                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Admin     │  │   Student   │  │      Verifier           │  │
│  │   Portal    │  │   Portal    │  │      Portal             │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOVABLE CLOUD (BACKEND)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Authentication │  │    Database     │  │ Edge Functions  │  │
│  │  (Supabase Auth)│  │  (PostgreSQL)   │  │ (Deno Runtime)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ETHEREUM BLOCKCHAIN                            │
│                      (Ganache - Local)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              SMART CONTRACT                                │  │
│  │         CertificateVerification.sol                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI component library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Fast build tool & dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Pre-built accessible components |
| **Framer Motion** | Page transitions & animations |
| **React Router v6** | Client-side routing |
| **TanStack Query** | Server state management |

### Backend (Lovable Cloud)
| Technology | Purpose |
|------------|---------|
| **Supabase Auth** | User authentication (Email, Google OAuth) |
| **PostgreSQL** | Relational database |
| **Row Level Security** | Data access control |
| **Edge Functions** | Serverless API endpoints |

### Blockchain
| Technology | Purpose |
|------------|---------|
| **Solidity** | Smart contract language |
| **Ethereum** | Blockchain platform |
| **Ganache** | Local blockchain network |
| **MetaMask** | Wallet connection |
| **Ethers.js** | Blockchain interaction |

### Additional Libraries
| Library | Purpose |
|---------|---------|
| **QRCode.react** | QR code generation |
| **html5-qrcode** | QR code scanning |
| **Zod** | Schema validation |
| **next-themes** | Dark/light mode theming |

---

## ✨ Features Overview

### 1. Authentication Features
- ✅ Email/Password signup & login
- ✅ Google OAuth sign-in
- ✅ Forgot password / Password reset
- ✅ Email verification
- ✅ Session persistence
- ✅ Protected routes

### 2. Admin Features
- ✅ Register new students
- ✅ Issue certificates on blockchain
- ✅ AI-powered certificate data extraction (Gemini)
- ✅ View all certificates & students
- ✅ Revoke certificates
- ✅ User role management

### 3. Student Features
- ✅ View issued certificates
- ✅ Download certificate QR codes
- ✅ View certificate details & hashes

### 4. Verification Features
- ✅ Verify by certificate hash
- ✅ Verify by QR code scan
- ✅ Verify by file upload
- ✅ Public access (no login required)

---

## 🔐 Authentication System

### Role-Based Access Control (RBAC)

The system uses a custom RBAC implementation with three roles:

```typescript
type AppRole = 'admin' | 'student' | 'verifier';
```

### Database Tables

```sql
-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
);

-- User Roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
```

### Auth Hook (`useAuth`)

```typescript
const { 
  user,           // Current user object
  roles,          // User's assigned roles
  isLoading,      // Loading state
  isAdmin,        // Is user an admin?
  isStudent,      // Is user a student?
  signIn,         // Email/password login
  signUp,         // Email/password registration
  signOut,        // Logout
  resetPassword,  // Send password reset email
  updatePassword, // Update password
  hasRole         // Check specific role
} = useAuth();
```

### Protected Routes

```tsx
<ProtectedRoute requiredRole="admin">
  <AdminPortal />
</ProtectedRoute>
```

---

## 🚪 Three Portals

### 1️⃣ Admin Portal (`/admin`)

**Access**: Requires `admin` role + MetaMask wallet connection

**Features**:
| Feature | Description |
|---------|-------------|
| Register Student | Add new students to blockchain |
| Issue Certificate | Manual or AI-powered certificate issuance |
| View Records | See all students & certificates |
| Revoke Certificate | Mark certificates as invalid |
| User Management | Assign/remove user roles |

**Certificate Issuance Flow**:
```
Upload → AI Extract → Review/Edit → Issue on Blockchain → Email Notification
```

### 2️⃣ Student Portal (`/student`)

**Access**: Requires `student` role

**Features**:
- View personal certificate dashboard
- Download QR codes
- View certificate hashes & transaction details

### 3️⃣ Verify Portal (`/verify`)

**Access**: Public (no authentication required)

**Verification Methods**:
1. **Hash Input**: Enter certificate hash directly
2. **QR Scan**: Scan certificate QR code with camera
3. **File Upload**: Upload certificate image/PDF

---

## ⛓️ Blockchain Integration

### Smart Contract Details

| Property | Value |
|----------|-------|
| **Contract Name** | CertificateVerification |
| **Solidity Version** | ^0.8.19 |
| **Network** | Ganache (Local) |
| **RPC URL** | http://127.0.0.1:7545 |
| **Chain ID** | 1337 |

### Contract Functions

```solidity
// Admin Functions
function registerStudent(enrollment, name, email, course, password) onlyAdmin
function issueCertificate(hash, enrollment, name, course, institution, year, ipfs) onlyAdmin

// Public Functions
function verifyCertificate(hash) returns (bool)
function getCertificate(hash) returns (Certificate)
function getStudent(enrollment) returns (Student)
function verifyStudentLogin(enrollment, password) returns (bool)
```

### Certificate Hash Generation

```typescript
const hash = SHA256(
  studentName + 
  enrollmentNumber + 
  course + 
  institution + 
  issueYear + 
  timestamp
);
```

---

## 🗄️ Database Schema

### Tables

```sql
-- Profiles (linked to auth.users)
profiles (id, user_id, email, full_name, created_at, updated_at)

-- Role assignments
user_roles (id, user_id, role, created_at)
```

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can read their own profile
- Users can update their own profile
- Only admins can manage roles
- Service role bypasses RLS for edge functions

---

## 🔌 API & Edge Functions

### 1. Certificate Data Extraction

**Endpoint**: `/functions/v1/extract-certificate`

**Purpose**: Uses Gemini AI to extract certificate data from images

```typescript
// Request
{ imageBase64: string }

// Response
{
  success: boolean,
  data: {
    studentName: string,
    enrollmentNumber: string,
    course: string,
    institution: string,
    issueYear: string
  }
}
```

### 2. Email Notifications

**Endpoint**: `/functions/v1/send-certificate-email`

**Purpose**: Sends email to students when certificate is issued

```typescript
// Request
{
  studentEmail: string,
  studentName: string,
  enrollmentNumber: string,
  course: string,
  institution: string,
  issueYear: number,
  certificateHash: string,
  transactionHash: string
}
```

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth with JWT tokens |
| **Authorization** | Role-based access control (RBAC) |
| **Data Protection** | Row Level Security (RLS) policies |
| **Input Validation** | Zod schema validation |
| **Blockchain Security** | Admin-only contract functions |
| **Immutability** | Data stored on blockchain cannot be altered |
| **Session Management** | Secure token refresh & persistence |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/           # Admin portal components
│   ├── ui/              # shadcn/ui components
│   ├── AnimatedRoutes   # Route transitions
│   ├── Navbar           # Navigation bar
│   ├── ProtectedRoute   # Route protection
│   └── ThemeProvider    # Dark/light mode
├── contexts/
│   ├── AppContext       # App-wide state
│   └── BlockchainContext# Blockchain connection
├── hooks/
│   ├── useAuth          # Authentication hook
│   └── use-toast        # Toast notifications
├── integrations/
│   ├── lovable/         # Lovable Cloud auth
│   └── supabase/        # Supabase client & types
├── lib/
│   ├── blockchain       # Blockchain utilities
│   └── utils            # Helper functions
├── pages/
│   ├── Index            # Home page
│   ├── Auth             # Login/Signup
│   ├── ResetPassword    # Password reset
│   ├── AdminPortal      # Admin dashboard
│   ├── StudentPortal    # Student dashboard
│   └── VerifyCertificate# Public verification
└── App.tsx              # App entry point

supabase/
├── functions/
│   ├── extract-certificate/  # AI extraction
│   └── send-certificate-email/ # Email notifications
└── config.toml          # Supabase configuration

public/
└── CertificateVerification.sol  # Smart contract
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Ganache (for local blockchain)

### Setup Steps

1. **Clone & Install**
   ```bash
   npm install
   npm run dev
   ```

2. **Ganache Setup**
   - Start Ganache on `http://127.0.0.1:7545`
   - Import first account to MetaMask

3. **Deploy Smart Contract**
   - Open Remix IDE
   - Paste `CertificateVerification.sol`
   - Deploy with MetaMask

4. **Configure Contract Address**
   - Update address in `src/lib/blockchain.ts`

---

## 📝 Environment Variables

```env
VITE_SUPABASE_URL=<auto-configured>
VITE_SUPABASE_PUBLISHABLE_KEY=<auto-configured>
VITE_SUPABASE_PROJECT_ID=<auto-configured>
GEMINI_API_KEY=<for AI extraction>
RESEND_API_KEY=<for email notifications>
```

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial release with core features |
| 1.1 | Jan 2025 | Added RBAC authentication system |
| 1.2 | Feb 2025 | Added Google OAuth & password reset |
| 1.3 | Feb 2025 | Added user management for admins |

---

## 🙏 Acknowledgments

- Ethereum Foundation
- Supabase Team
- shadcn/ui
- Lovable Team

---

**Built with ❤️ using Lovable**
