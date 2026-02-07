# 🏗️ Production Architecture — Multi-Institute Blockchain Certificate Verification System

## Written for: Senior Engineers & Production Deployment Teams
## Version: 2.0 (Final Architecture)
## Date: February 2026

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What is RIGHT in Current System](#2-what-is-right)
3. [What is WRONG & Must Be Fixed](#3-what-is-wrong)
4. [What Must Be AVOIDED](#4-what-must-be-avoided)
5. [Final Architecture Diagram](#5-final-architecture-diagram)
6. [Role Hierarchy & Permissions Matrix](#6-role-hierarchy)
7. [Authentication Flows (All Users)](#7-authentication-flows)
8. [Database Schema Design](#8-database-schema)
9. [Row Level Security (RLS) Design](#9-rls-design)
10. [Edge Functions & API Design](#10-edge-functions)
11. [Blockchain Architecture](#11-blockchain-architecture)
12. [Security Checklist](#12-security-checklist)
13. [Implementation Phases](#13-implementation-phases)
14. [Common Mistakes & Anti-Patterns](#14-anti-patterns)

---

## 1. Executive Summary

This system enables **multiple educational institutes** to issue **tamper-proof digital certificates** on the Ethereum blockchain. Every certificate's hash is stored on-chain, making it **immutable and publicly verifiable**.

### Core Principles:
- **Zero Trust**: Every request is authenticated and authorized server-side
- **Institute Isolation**: Students and admins can ONLY access their own institute's data
- **Immutable Records**: Blockchain ensures certificates cannot be forged
- **Public Verification**: Anyone can verify a certificate without logging in

---

## 2. What is RIGHT ✅

### Currently Correct in the System:

| # | What's Right | Why It's Correct |
|---|-------------|-----------------|
| 1 | Supabase Auth for authentication | Industry-standard, handles JWT, refresh tokens, email verification |
| 2 | `user_roles` table separate from `profiles` | Prevents privilege escalation attacks |
| 3 | `has_role()` SECURITY DEFINER function | Prevents infinite RLS recursion |
| 4 | RLS enabled on all tables | Data access controlled at database level |
| 5 | Edge Functions for sensitive operations | Server-side logic, secrets never exposed |
| 6 | Email verification required | Prevents fake account creation |
| 7 | Password reset via Supabase Auth | Secure, token-based password recovery |
| 8 | Certificate hash on blockchain | Immutable proof of issuance |
| 9 | Public verification portal (no login) | Anyone can verify, increases trust |
| 10 | `app_role` enum type | Database-enforced role values |

---

## 3. What is WRONG ❌ & Must Be Fixed

### Critical Issues in Current Design:

| # | What's Wrong | Why It's Wrong | Correct Approach |
|---|-------------|---------------|-----------------|
| 1 | **No `institutes` table** | System cannot support multiple colleges | Create `institutes` table with RLS |
| 2 | **No `institute_id` linking** | Students/admins not tied to any institute | Add `institute_id` to `profiles` table |
| 3 | **Shared institute password (0777)** discussed for login | Shared passwords = zero accountability, anyone can login | Use as ONE-TIME signup validation only, NEVER for login |
| 4 | **Single admin role** | Cannot distinguish Super Admin from College Admin | Add `super_admin` and `institute_admin` to `app_role` enum |
| 5 | **No institute-level data isolation** | Admin of MIT can see IIT's data | RLS policies must filter by `institute_id` |
| 6 | **Manual DB edits for role assignment** | Not scalable, error-prone, security risk | Edge Function for role management (except first super admin) |
| 7 | **Smart contract is single-institute** | Cannot track which institute issued which certificate | Update contract to include `instituteId` parameter |
| 8 | **No admin approval workflow** | Institute admins have no onboarding process | Super Admin approves institute registrations |
| 9 | **Enrollment number treated as credential** | Enrollment number is public info, not a secret | It's an identifier only, NOT for authentication |

---

## 4. What Must Be AVOIDED 🚫

### Anti-Patterns That Will BREAK Production:

#### ❌ NEVER DO: Shared Password Login
```
// WRONG - Institute password for daily login
if (password === institute.password) { allowLogin(); }
```
**Why**: 500 students sharing "0777" = zero audit trail, zero accountability. If one student leaks it, everyone is compromised. This is a **demo-level** pattern.

#### ❌ NEVER DO: Role Selection During Signup
```
// WRONG - User picks their own role
<select name="role">
  <option>admin</option>
  <option>student</option>
</select>
```
**Why**: Any attacker can select "admin" and gain full access. Roles must ONLY be assigned by authorized users through secure server-side functions.

#### ❌ NEVER DO: Client-Side Role Checking for Security
```
// WRONG - Only checking role in React
if (localStorage.getItem('role') === 'admin') { showAdminPanel(); }
```
**Why**: localStorage can be edited in browser DevTools in 2 seconds. Security MUST be enforced at the database level (RLS) and server level (Edge Functions).

#### ❌ NEVER DO: Store Passwords in Your Database
```
// WRONG - Storing password in profiles table
INSERT INTO profiles (name, password_hash) VALUES ('John', hash('password'));
```
**Why**: Supabase Auth already handles password hashing (bcrypt), token management, and session handling. Duplicating this creates security holes.

#### ❌ NEVER DO: Direct SQL from Frontend for Role Changes
```
// WRONG - Frontend directly updating roles
await supabase.from('user_roles').insert({ role: 'admin', user_id: '...' });
```
**Why**: Even with RLS, role management should go through Edge Functions that validate the requester's authority and log the action.

#### ❌ NEVER DO: Remove Supabase Auth
**Why**: Building custom auth means handling JWT generation, token refresh, password hashing, email verification, brute-force protection, session management — all solved problems. Re-inventing this is a security disaster.

#### ❌ NEVER DO: Use Enrollment Number as Password
```
// WRONG
if (enrollment === "CS2024001" && password === "CS2024001") { login(); }
```
**Why**: Enrollment numbers are printed on ID cards, displayed on notice boards, and shared publicly. They are **identifiers**, not **secrets**.

---

## 5. Final Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                          │
│                                                                             │
│  👑 Super Admin    🏫 Institute Admin    🎓 Student    🔍 Public Verifier   │
│  (1-2 people)     (Per Institute)       (Per Institute)  (Anyone)          │
└──────┬──────────────────┬───────────────────┬──────────────┬────────────────┘
       │                  │                   │              │
       ▼                  ▼                   ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                       │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Super Admin  │  │  Institute   │  │   Student    │  │   Public     │    │
│  │  Dashboard   │  │   Admin      │  │   Portal     │  │   Verify     │    │
│  │              │  │   Portal     │  │              │  │   Portal     │    │
│  │ • Manage     │  │ • Register   │  │ • View own   │  │ • Enter hash │    │
│  │   Institutes │  │   Students   │  │   certs      │  │ • Scan QR    │    │
│  │ • Assign     │  │ • Issue      │  │ • Download   │  │ • Upload     │    │
│  │   Admins     │  │   Certs      │  │   QR codes   │  │   file       │    │
│  │ • Master     │  │ • Revoke     │  │ • View hash  │  │ • See result │    │
│  │   Control    │  │   Certs      │  │   details    │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │                 │            │
│         ▼                 ▼                  ▼                 ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              PROTECTED ROUTES (ProtectedRoute Component)            │    │
│  │         Role Check: super_admin | institute_admin | student         │    │
│  │              Institute Check: institute_id matching                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Lovable Cloud)                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    AUTHENTICATION LAYER                             │    │
│  │                    (Supabase Auth)                                   │    │
│  │                                                                     │    │
│  │  • Email/Password signup & login                                    │    │
│  │  • Google OAuth (optional)                                          │    │
│  │  • Email verification (MANDATORY)                                   │    │
│  │  • Password reset via email                                         │    │
│  │  • JWT token management                                             │    │
│  │  • Session persistence & refresh                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    AUTHORIZATION LAYER                              │    │
│  │                    (RLS + Edge Functions)                            │    │
│  │                                                                     │    │
│  │  Database Level (RLS):                                              │    │
│  │  • Students see ONLY their institute's data                         │    │
│  │  • Institute admins manage ONLY their institute                     │    │
│  │  • Super admin has global access                                    │    │
│  │                                                                     │    │
│  │  API Level (Edge Functions):                                        │    │
│  │  • assign-role        → Super/Institute Admin only                  │    │
│  │  • register-student   → Institute Admin only                        │    │
│  │  • approve-institute  → Super Admin only                            │    │
│  │  • extract-certificate→ Institute Admin only                        │    │
│  │  • send-email         → System triggered                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    DATABASE (PostgreSQL)                             │    │
│  │                                                                     │    │
│  │  institutes ──┐                                                     │    │
│  │               ├── profiles (user_id, institute_id)                  │    │
│  │               ├── user_roles (user_id, role)                        │    │
│  │               └── certificates (institute_id, student_id, hash)     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ETHEREUM BLOCKCHAIN                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              CertificateVerification.sol (v2)                       │    │
│  │                                                                     │    │
│  │  Stored On-Chain (Minimal):                                         │    │
│  │  • Certificate hash (SHA256)                                        │    │
│  │  • Institute ID                                                     │    │
│  │  • Issuer wallet address                                            │    │
│  │  • Timestamp                                                        │    │
│  │  • isRevoked flag                                                   │    │
│  │                                                                     │    │
│  │  NOT Stored On-Chain:                                               │    │
│  │  • Student name, email, grades (privacy)                            │    │
│  │  • Certificate PDF/images (too expensive)                           │    │
│  │  • Institute details (in database)                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Role Hierarchy & Permissions Matrix

### Role Definitions

```
👑 SUPER ADMIN (super_admin)
├── Can create/deactivate institutes
├── Can assign institute_admin role to users
├── Can view ALL data across ALL institutes
├── Has master blockchain wallet control
├── Can override any institute-level decision
│
├── 🏫 INSTITUTE ADMIN (institute_admin)
│   ├── Bound to ONE specific institute
│   ├── Can register students for THEIR institute only
│   ├── Can issue certificates for THEIR institute only
│   ├── Can revoke certificates for THEIR institute only
│   ├── Can view THEIR institute's data only
│   │
│   ├── 🎓 STUDENT (student)
│   │   ├── Bound to ONE specific institute
│   │   ├── Can view ONLY their own certificates
│   │   ├── Can download their QR codes
│   │   ├── CANNOT view other students' data
│   │   └── CANNOT modify any data
│   │
│   └── (No direct control over other institutes)
│
└── 🔍 VERIFIER (public - no role needed)
    ├── No authentication required
    ├── Can verify any certificate by hash
    ├── Can scan QR codes
    └── CANNOT view student personal details
```

### Permissions Matrix

| Action | Super Admin | Institute Admin | Student | Public |
|--------|:-----------:|:---------------:|:-------:|:------:|
| Create Institute | ✅ | ❌ | ❌ | ❌ |
| Deactivate Institute | ✅ | ❌ | ❌ | ❌ |
| Assign Institute Admin | ✅ | ❌ | ❌ | ❌ |
| Register Student | ✅ | ✅ (own institute) | ❌ | ❌ |
| Issue Certificate | ✅ | ✅ (own institute) | ❌ | ❌ |
| Revoke Certificate | ✅ | ✅ (own institute) | ❌ | ❌ |
| View All Institutes | ✅ | ❌ | ❌ | ❌ |
| View Own Institute Data | ✅ | ✅ | ❌ | ❌ |
| View Own Certificates | ✅ | ✅ | ✅ | ❌ |
| Download QR Code | ✅ | ✅ | ✅ | ❌ |
| Verify Certificate | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ (own institute) | ❌ | ❌ |
| Blockchain Master Control | ✅ | ❌ | ❌ | ❌ |

---

## 7. Authentication Flows

### 7.1 Super Admin — First Time Setup (ONE TIME ONLY)

```
┌─────────────────────────────────────────────────────────┐
│              SUPER ADMIN BOOTSTRAP (One Time)            │
│                                                          │
│  Step 1: Super Admin signs up via /auth page             │
│          (normal email/password signup)                   │
│                                                          │
│  Step 2: Verify email (click link in email)              │
│                                                          │
│  Step 3: MANUALLY insert role in database:               │
│          INSERT INTO user_roles (user_id, role)           │
│          VALUES ('<user-uuid>', 'super_admin');           │
│                                                          │
│  Step 4: Login → Redirected to Super Admin Dashboard     │
│                                                          │
│  ⚠️ This is the ONLY manual DB edit ever needed!         │
│  All future roles are assigned through the UI.           │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Super Admin — Daily Login

```
Super Admin opens app
    │
    ▼
Enters email + password on /auth
    │
    ▼
Supabase Auth validates credentials
    │
    ▼
JWT token issued with user_id
    │
    ▼
Frontend fetches roles from user_roles table
    │
    ▼
Role = super_admin → Redirect to /super-admin
    │
    ▼
Dashboard shows: Institute Management, Admin Assignment, Global View
```

### 7.3 Institute Admin — Onboarding

```
Super Admin creates institute (e.g., "MIT Pune")
    │
    ▼
Super Admin invites user as institute_admin
    │
    ▼
User receives email → Signs up at /auth
    │
    ▼
Email verified → Account created
    │
    ▼
Edge Function assigns role: institute_admin
Edge Function links user to institute_id
    │
    ▼
Institute Admin logs in → Sees ONLY their institute
```

### 7.4 Institute Admin — Daily Login

```
Institute Admin opens app
    │
    ▼
Enters email + password on /auth
    │
    ▼
Supabase Auth validates
    │
    ▼
Frontend fetches roles → institute_admin
Frontend fetches institute_id from profiles
    │
    ▼
Redirect to /admin (filtered to their institute)
    │
    ▼
Can ONLY see/manage their institute's students & certificates
```

### 7.5 Student — Registration & Login

```
┌─────────────────────────────────────────────────────────────┐
│                 STUDENT REGISTRATION FLOW                     │
│                                                               │
│  Option A: Admin-Initiated (Recommended for Production)       │
│  ──────────────────────────────────────────────────────────   │
│  1. Institute Admin registers student in system               │
│  2. System creates Supabase Auth account for student          │
│  3. Student receives email with temporary password            │
│  4. Student logs in → Forced to change password               │
│  5. Student can now access their portal                       │
│                                                               │
│  Option B: Self-Registration with Validation                  │
│  ──────────────────────────────────────────────────────────   │
│  1. Student visits /auth → Signup tab                         │
│  2. Selects institute from dropdown                           │
│  3. Enters enrollment number + email + password               │
│  4. (Optional) Enters institute invite code for validation    │
│  5. Email verification sent                                   │
│  6. After verification → Institute Admin approves student     │
│  7. Only after approval → Student gets 'student' role         │
│  8. Student can now access portal                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 Student — Daily Login

```
Student opens app
    │
    ▼
Enters email + password on /auth
(NOT enrollment number, NOT institute password)
    │
    ▼
Supabase Auth validates credentials
    │
    ▼
JWT issued → Frontend fetches role (student)
    │
    ▼
Frontend fetches profile (enrollment_number, institute_id)
    │
    ▼
Redirect to /student
    │
    ▼
Dashboard shows ONLY this student's certificates
(RLS enforces: WHERE profiles.user_id = auth.uid())
```

### 7.7 Public Verifier — No Login Required

```
Anyone opens /verify
    │
    ▼
No authentication needed
    │
    ▼
Three options:
├── Enter certificate hash manually
├── Scan QR code with camera
└── Upload certificate file
    │
    ▼
System queries blockchain directly
    │
    ▼
Shows: Valid ✅ / Invalid ❌ / Revoked ⚠️
(No personal student data exposed)
```

---

## 8. Database Schema Design

### 8.1 Updated `app_role` Enum

```sql
-- Drop old enum and recreate with new roles
-- (Migration must handle existing data)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'institute_admin';
-- Existing values: 'admin', 'student', 'verifier'
-- 'admin' will be deprecated in favor of 'super_admin' and 'institute_admin'
```

### 8.2 `institutes` Table

```sql
CREATE TABLE public.institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Institute Identity
    name TEXT NOT NULL,                          -- "MIT Pune"
    code TEXT NOT NULL UNIQUE,                   -- "MIT-PUNE" (unique identifier)
    
    -- Optional: One-time signup validation code
    -- NOT used for login! Only for student self-registration validation
    invite_code TEXT,                            -- "MIT2024" (optional)
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,     -- Super admin can deactivate
    
    -- Metadata
    address TEXT,                                -- Physical address
    website TEXT,                                -- Institute website
    logo_url TEXT,                               -- Institute logo
    
    -- Blockchain
    wallet_address TEXT,                         -- Institute's blockchain wallet
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)    -- Which super admin created it
);

-- Enable RLS
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
```

### 8.3 Updated `profiles` Table

```sql
-- Add institute_id to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN institute_id UUID REFERENCES public.institutes(id);

-- Now profiles schema becomes:
-- profiles (
--   id UUID PK,
--   user_id UUID (from auth.users),
--   email TEXT,
--   full_name TEXT,
--   enrollment_number TEXT,      -- Already exists
--   course TEXT,                 -- Already exists
--   institute_id UUID FK,       -- NEW: Links user to institute
--   avatar_url TEXT,
--   created_at TIMESTAMPTZ,
--   updated_at TIMESTAMPTZ
-- )
```

### 8.4 `user_roles` Table (Already Exists — No Changes)

```sql
-- Current schema is correct:
-- user_roles (
--   id UUID PK,
--   user_id UUID,
--   role app_role,              -- Will include new enum values
--   created_at TIMESTAMPTZ,
--   UNIQUE(user_id, role)
-- )
```

### 8.5 `certificates` Table (NEW — For Off-Chain Metadata)

```sql
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Certificate Identity
    certificate_hash TEXT NOT NULL UNIQUE,       -- SHA256 hash (also on blockchain)
    transaction_hash TEXT,                        -- Blockchain transaction hash
    
    -- Relationships
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    institute_id UUID REFERENCES public.institutes(id) NOT NULL,
    issued_by UUID REFERENCES auth.users(id) NOT NULL,  -- Which admin issued it
    
    -- Certificate Data (stored off-chain for privacy)
    student_name TEXT NOT NULL,
    enrollment_number TEXT NOT NULL,
    course TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    issue_year INTEGER NOT NULL,
    
    -- Status
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    revocation_reason TEXT,
    
    -- Metadata
    ipfs_hash TEXT,                              -- Optional IPFS storage
    certificate_file_url TEXT,                   -- Optional file storage
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
```

### 8.6 `audit_logs` Table (Production Requirement)

```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who did it
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_role TEXT,
    
    -- What happened
    action TEXT NOT NULL,                        -- 'certificate_issued', 'role_assigned', etc.
    resource_type TEXT NOT NULL,                  -- 'certificate', 'user_role', 'institute'
    resource_id TEXT,                             -- ID of affected resource
    
    -- Context
    institute_id UUID REFERENCES public.institutes(id),
    details JSONB,                               -- Additional context
    ip_address TEXT,
    
    -- When
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   auth.users │       │   institutes │       │  certificates│
│──────────────│       │──────────────│       │──────────────│
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ email        │  │    │ name         │  │    │ cert_hash    │
│ password     │  │    │ code         │  │    │ tx_hash      │
│ (managed by  │  │    │ invite_code  │  │    │ student_id ──│──► auth.users
│  Supabase)   │  │    │ is_active    │  │    │ institute_id │──► institutes
└──────────────┘  │    │ wallet_addr  │  │    │ issued_by  ──│──► auth.users
                  │    └──────────────┘  │    │ student_name │
                  │                      │    │ course       │
                  ▼                      │    │ is_revoked   │
┌──────────────┐  │                      │    └──────────────┘
│   profiles   │  │                      │
│──────────────│  │                      │
│ id (PK)      │  │                      │
│ user_id ─────│──┘                      │
│ email        │                         │
│ full_name    │                         │
│ enrollment   │                         │
│ course       │                         │
│ institute_id │─────────────────────────┘
└──────────────┘

┌──────────────┐       ┌──────────────┐
│  user_roles  │       │  audit_logs  │
│──────────────│       │──────────────│
│ id (PK)      │       │ id (PK)      │
│ user_id ─────│──►    │ user_id      │
│ role (enum)  │       │ action       │
│ UNIQUE(user, │       │ resource     │
│        role) │       │ institute_id │
└──────────────┘       │ details      │
                       └──────────────┘
```

---

## 9. Row Level Security (RLS) Design

### 9.1 Helper Functions (SECURITY DEFINER)

```sql
-- Already exists: has_role(user_id, role)
-- Already exists: get_user_roles(user_id)

-- NEW: Get user's institute_id
CREATE OR REPLACE FUNCTION public.get_user_institute_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT institute_id 
    FROM public.profiles 
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- NEW: Check if user belongs to specific institute
CREATE OR REPLACE FUNCTION public.belongs_to_institute(_user_id UUID, _institute_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = _user_id
        AND institute_id = _institute_id
    )
$$;
```

### 9.2 RLS Policies — `institutes` Table

```sql
-- Super Admin can do everything
CREATE POLICY "Super admins can manage institutes"
ON public.institutes FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Institute admins can view their own institute
CREATE POLICY "Institute admins can view their institute"
ON public.institutes FOR SELECT
USING (
    has_role(auth.uid(), 'institute_admin') 
    AND id = get_user_institute_id(auth.uid())
);

-- Students can view their institute name (for display)
CREATE POLICY "Students can view their institute"
ON public.institutes FOR SELECT
USING (
    has_role(auth.uid(), 'student')
    AND id = get_user_institute_id(auth.uid())
);
```

### 9.3 RLS Policies — `profiles` Table (Updated)

```sql
-- Keep existing policies, ADD these:

-- Institute admins can view profiles in their institute
CREATE POLICY "Institute admins can view institute profiles"
ON public.profiles FOR SELECT
USING (
    has_role(auth.uid(), 'institute_admin')
    AND institute_id = get_user_institute_id(auth.uid())
);

-- Institute admins can create profiles for their institute
CREATE POLICY "Institute admins can create institute profiles"
ON public.profiles FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'institute_admin')
    AND institute_id = get_user_institute_id(auth.uid())
);
```

### 9.4 RLS Policies — `certificates` Table

```sql
-- Super admin sees everything
CREATE POLICY "Super admin full access"
ON public.certificates FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Institute admin manages their institute's certificates
CREATE POLICY "Institute admin manages own institute certs"
ON public.certificates FOR ALL
USING (
    has_role(auth.uid(), 'institute_admin')
    AND institute_id = get_user_institute_id(auth.uid())
);

-- Students view only their own certificates
CREATE POLICY "Students view own certificates"
ON public.certificates FOR SELECT
USING (
    has_role(auth.uid(), 'student')
    AND student_id = auth.uid()
);

-- Public verification (by hash only, no personal data exposed)
-- This is handled via blockchain queries, not database
```

### 9.5 RLS Policies — `audit_logs` Table

```sql
-- Only super admin can read audit logs
CREATE POLICY "Super admin reads audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Insert allowed for authenticated users (via edge functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 10. Edge Functions & API Design

### 10.1 Required Edge Functions

| Function | Purpose | Who Can Call |
|----------|---------|-------------|
| `assign-role` | Assign role to a user | Super Admin, Institute Admin (own institute only) |
| `remove-role` | Remove role from a user | Super Admin, Institute Admin (own institute only) |
| `create-institute` | Create new institute | Super Admin only |
| `register-student` | Create student account | Institute Admin (own institute only) |
| `issue-certificate` | Record cert in database | Institute Admin (own institute only) |
| `revoke-certificate` | Mark cert as revoked | Institute Admin (own institute only) |
| `extract-certificate` | AI-powered data extraction | Institute Admin only |
| `send-certificate-email` | Email notification | System triggered |

### 10.2 Edge Function Security Pattern

Every Edge Function MUST follow this pattern:

```typescript
// TEMPLATE: Secure Edge Function
serve(async (req) => {
    // 1. CORS
    if (req.method === 'OPTIONS') return corsResponse();
    
    // 2. Authentication
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error } = await supabase.auth.getUser(
        authHeader?.replace('Bearer ', '')
    );
    if (!user) return unauthorized();
    
    // 3. Authorization (Role Check)
    const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
    
    if (!roles?.some(r => r.role === 'required_role')) {
        return forbidden();
    }
    
    // 4. Institute Isolation Check (for institute-level operations)
    const { data: profile } = await supabase
        .from('profiles')
        .select('institute_id')
        .eq('user_id', user.id)
        .single();
    
    if (profile?.institute_id !== requestedInstituteId) {
        return forbidden("Cannot access other institute's data");
    }
    
    // 5. Business Logic
    // ... actual operation here ...
    
    // 6. Audit Log
    await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'action_name',
        resource_type: 'resource',
        institute_id: profile.institute_id,
        details: { /* ... */ }
    });
    
    return success();
});
```

---

## 11. Blockchain Architecture

### 11.1 Smart Contract v2 (Multi-Institute)

```solidity
// CertificateVerification.sol v2 - Multi-Institute Support

struct Certificate {
    string certificateHash;      // SHA256 hash
    string instituteId;          // Institute identifier
    address issuedBy;            // Issuer wallet address
    uint256 issuedAt;            // Timestamp
    bool isRevoked;              // Revocation status
    address revokedBy;           // Who revoked (if applicable)
    uint256 revokedAt;           // When revoked
}

// Key Changes from v1:
// 1. instituteId field in Certificate struct
// 2. Institute-level admin mapping
// 3. Multi-institute issuance support
// 4. Institute-scoped queries
```

### 11.2 What Goes On-Chain vs Off-Chain

| Data | On-Chain | Off-Chain (Database) | Reason |
|------|:--------:|:-------------------:|--------|
| Certificate Hash | ✅ | ✅ | Immutability + queryability |
| Institute ID | ✅ | ✅ | Blockchain proof of origin |
| Issuer Wallet | ✅ | ❌ | Blockchain accountability |
| Timestamp | ✅ | ✅ | Immutable timing |
| isRevoked | ✅ | ✅ | Blockchain-enforced status |
| Student Name | ❌ | ✅ | Privacy (GDPR) |
| Student Email | ❌ | ✅ | Privacy |
| Course Details | ❌ | ✅ | Can change, not immutable |
| Certificate File | ❌ | ✅ (Storage) | Too expensive on-chain |
| Transaction Hash | ❌ | ✅ | Reference to blockchain tx |

### 11.3 Blockchain Wallet Management

```
👑 Super Admin Wallet (Master)
│
├── Has deployer privileges on smart contract
├── Can add/remove institute wallets
├── Can override any certificate decision
│
├── 🏫 Institute Wallet (Per Institute)
│   ├── Registered by Super Admin on contract
│   ├── Can issue certificates with their institute ID
│   ├── Can revoke certificates they issued
│   └── CANNOT affect other institutes' certificates
│
└── 🎓 Students & 🔍 Verifiers
    └── Read-only access (verifyCertificate is public)
```

---

## 12. Security Checklist

### Authentication Security
- [x] Supabase Auth for ALL user authentication
- [x] Email verification mandatory before access
- [x] Password reset via secure email flow
- [x] JWT tokens with automatic refresh
- [ ] Rate limiting on login attempts (Edge Function)
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication (future)

### Authorization Security
- [x] Roles stored in separate `user_roles` table
- [x] `has_role()` as SECURITY DEFINER function
- [x] RLS enabled on ALL tables
- [ ] Institute isolation in RLS policies
- [ ] Edge Functions for all role management
- [ ] Audit logging for sensitive operations

### Data Security
- [x] Passwords managed by Supabase Auth (bcrypt)
- [x] No passwords stored in application tables
- [ ] Student data isolated by institute
- [ ] Personal data NOT stored on blockchain
- [ ] Certificate files in secure storage buckets

### Blockchain Security
- [x] Admin-only functions on smart contract
- [ ] Multi-institute wallet management
- [ ] Institute-scoped certificate issuance
- [x] Certificate hashes are immutable
- [x] Revocation is permanent and recorded

---

## 13. Implementation Phases

### Phase 1: Multi-Institute Foundation 🏗️
**Priority: CRITICAL | Effort: 2-3 days**

```
Tasks:
├── 1.1 Update app_role enum (add super_admin, institute_admin)
├── 1.2 Create institutes table with RLS
├── 1.3 Add institute_id to profiles table
├── 1.4 Create get_user_institute_id() function
├── 1.5 Create belongs_to_institute() function
├── 1.6 Update RLS policies for institute isolation
└── 1.7 Create first super admin manually
```

### Phase 2: Super Admin Dashboard 👑
**Priority: HIGH | Effort: 2-3 days**

```
Tasks:
├── 2.1 Create /super-admin route (protected)
├── 2.2 Institute management page (create, activate, deactivate)
├── 2.3 Admin assignment page (assign institute_admin to institute)
├── 2.4 Global view of all certificates across institutes
├── 2.5 Edge Function: create-institute
└── 2.6 Edge Function: assign-institute-admin
```

### Phase 3: Institute Admin Portal 🏫
**Priority: HIGH | Effort: 2-3 days**

```
Tasks:
├── 3.1 Update /admin route for institute_admin role
├── 3.2 Institute-scoped student registration
├── 3.3 Institute-scoped certificate issuance
├── 3.4 Institute-scoped revocation
├── 3.5 Institute-level user management
└── 3.6 Update edge functions for institute isolation
```

### Phase 4: Student Portal Update 🎓
**Priority: HIGH | Effort: 1-2 days**

```
Tasks:
├── 4.1 Update student portal with institute branding
├── 4.2 Show institute name on certificate cards
├── 4.3 Ensure RLS filters by student + institute
└── 4.4 Update QR code to include institute info
```

### Phase 5: Certificates Table & Off-Chain Storage 📜
**Priority: HIGH | Effort: 2-3 days**

```
Tasks:
├── 5.1 Create certificates table with RLS
├── 5.2 Store certificate metadata in database
├── 5.3 Link blockchain hash to database record
├── 5.4 Update issuance flow to save in both places
└── 5.5 Update verification to check both sources
```

### Phase 6: Smart Contract v2 ⛓️
**Priority: MEDIUM | Effort: 3-4 days**

```
Tasks:
├── 6.1 Update Solidity contract for multi-institute
├── 6.2 Add institute wallet registration
├── 6.3 Update certificate struct with institute_id
├── 6.4 Deploy and test on Ganache
├── 6.5 Update frontend blockchain integration
└── 6.6 Migration plan for existing certificates
```

### Phase 7: Audit & Security Hardening 🔒
**Priority: MEDIUM | Effort: 2-3 days**

```
Tasks:
├── 7.1 Create audit_logs table
├── 7.2 Add audit logging to all edge functions
├── 7.3 Security review of all RLS policies
├── 7.4 Rate limiting on sensitive endpoints
├── 7.5 Input validation with Zod on all forms
└── 7.6 Penetration testing checklist
```

### Phase 8: Production Polish ✨
**Priority: LOW | Effort: 3-5 days**

```
Tasks:
├── 8.1 Responsive design for all portals
├── 8.2 Error handling & user-friendly messages
├── 8.3 Loading states & skeletons
├── 8.4 Email templates (certificate issued, account created)
├── 8.5 Mainnet deployment guide (Ethereum → Polygon for lower gas)
├── 8.6 IPFS integration for certificate storage
├── 8.7 Bulk certificate issuance
└── 8.8 Analytics dashboard for super admin
```

---

## 14. Common Mistakes & Anti-Patterns

### ❌ Mistake 1: "Institute Password = Login Password"
```
WRONG: Student logs in with enrollment + "0777"
RIGHT: Student logs in with their personal email + personal password
       "0777" is ONLY used once during self-registration to validate
       that the student knows they're registering for the right institute
```

### ❌ Mistake 2: "Check roles on frontend only"
```
WRONG: if (user.role === 'admin') { showAdminButton(); }
       // But no RLS policy prevents data access!

RIGHT: Frontend checks role for UI rendering
       + RLS policies enforce data access at database level
       + Edge Functions validate role before sensitive operations
       = THREE layers of security
```

### ❌ Mistake 3: "One admin for all institutes"
```
WRONG: Admin can see all institutes' data
RIGHT: institute_admin role is SCOPED to one institute_id
       RLS policy: WHERE institute_id = get_user_institute_id(auth.uid())
```

### ❌ Mistake 4: "Store everything on blockchain"
```
WRONG: Storing student name, email, grades on-chain
       (Expensive: ~$5-50 per certificate on Ethereum mainnet)
       (Privacy violation: Cannot delete under GDPR)

RIGHT: Store ONLY the hash, institute ID, issuer, and timestamp
       (Cheap: ~$0.50 per certificate)
       (Private: Personal data stays in database)
```

### ❌ Mistake 5: "Let users pick their role during signup"
```
WRONG: Signup form has dropdown: [Admin, Student, Verifier]
RIGHT: Normal signup → No role → Admin assigns role after verification
       OR: Admin-initiated registration → Role assigned automatically
```

---

## 📊 Summary: Current State vs Target State

| Aspect | Current State | Target State |
|--------|:------------:|:------------:|
| Multi-Institute | ❌ Single | ✅ Multiple |
| Super Admin | ❌ No concept | ✅ Full dashboard |
| Institute Admin | ❌ Single "admin" | ✅ Scoped to institute |
| Student Login | ⚠️ Confusing | ✅ Email/Password |
| Data Isolation | ❌ None | ✅ RLS by institute |
| Certificates DB | ❌ Blockchain only | ✅ Both DB + Chain |
| Audit Logs | ❌ None | ✅ Full audit trail |
| Smart Contract | ⚠️ Single institute | ✅ Multi-institute |
| Role Management | ⚠️ Manual DB | ✅ UI + Edge Functions |

---

## 🎯 Next Step Recommendation

**Start with Phase 1** — Create the database foundation. Everything else depends on:
1. `institutes` table existing
2. `institute_id` being linked to profiles
3. New role types being available

Once Phase 1 is approved and migrated, the rest can be built incrementally.

---

**Document prepared by: AI Architect**
**Architecture Level: Enterprise / Production-Ready**
**Last Updated: February 2026**
