# 🔐 Authentication & Portal System - Complete Guide
# प्रमाणीकरण और पोर्टल सिस्टम - संपूर्ण गाइड

---

## 📋 Table of Contents / विषय सूची

1. [Current System Overview / वर्तमान सिस्टम](#current-system-overview)
2. [Authentication Flow / प्रमाणीकरण प्रक्रिया](#authentication-flow)
3. [Role-Based Access Control / भूमिका-आधारित पहुंच](#role-based-access-control)
4. [How Each Portal Works / प्रत्येक पोर्टल कैसे काम करता है](#how-each-portal-works)
5. [Common Issues & Solutions / सामान्य समस्याएं और समाधान](#common-issues--solutions)
6. [Admin Setup Guide / एडमिन सेटअप गाइड](#admin-setup-guide)
7. [Future Improvements / भविष्य में सुधार](#future-improvements)

---

## 🎯 Current System Overview
## वर्तमान सिस्टम का अवलोकन

### How Authentication Works / प्रमाणीकरण कैसे काम करता है

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION SYSTEM                         │
│                    (Lovable Cloud / Supabase Auth)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐         ┌─────────────┐         ┌───────────┐  │
│   │   Sign Up   │ ──────▶ │   Email     │ ──────▶ │  Verify   │  │
│   │   (Register)│         │   Sent      │         │   Email   │  │
│   └─────────────┘         └─────────────┘         └───────────┘  │
│                                                         │        │
│                                                         ▼        │
│   ┌─────────────┐         ┌─────────────┐         ┌───────────┐  │
│   │   Login     │ ◀────── │   Check     │ ◀────── │  Email    │  │
│   │   Success   │         │   Role      │         │  Verified │  │
│   └─────────────┘         └─────────────┘         └───────────┘  │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   ROLE CHECK                             │   │
│   │   ┌─────────┐     ┌─────────┐     ┌─────────────────┐   │   │
│   │   │ admin   │     │ student │     │    verifier     │   │   │
│   │   │   ▼     │     │   ▼     │     │       ▼         │   │   │
│   │   │ /admin  │     │/student │     │    /verify      │   │   │
│   │   └─────────┘     └─────────┘     └─────────────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Points / मुख्य बिंदु

| Feature | Hindi | English |
|---------|-------|---------|
| **Email Verification** | साइनअप के बाद ईमेल वेरिफिकेशन जरूरी है | Email must be verified after signup |
| **Role Assignment** | एडमिन द्वारा रोल असाइन करना जरूरी है | Admin must assign roles to users |
| **Protected Routes** | बिना रोल के पोर्टल एक्सेस नहीं होगा | No portal access without role |

---

## 🔄 Authentication Flow
## प्रमाणीकरण प्रक्रिया

### Step 1: Sign Up (साइनअप)

```
User fills form:
├── Email
├── Password (min 6 characters)
└── Full Name (optional)
         │
         ▼
┌─────────────────────────────────┐
│  Account Created in Database    │
│  (auth.users table)             │
│                                 │
│  Profile Created Automatically  │
│  (profiles table - trigger)     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Verification Email Sent        │
│  "Please verify your email"     │
└─────────────────────────────────┘
```

**Important / महत्वपूर्ण:**
- ✅ Account बन जाता है database में
- ✅ Profile automatically create होती है
- ❌ Role assign नहीं होता automatically
- ❌ बिना email verify किए login नहीं होगा

### Step 2: Email Verification (ईमेल वेरिफिकेशन)

```
User receives email:
├── Click verification link
├── Redirected to app
└── Email marked as verified
         │
         ▼
┌─────────────────────────────────┐
│  NOW user can login             │
│  BUT still no role assigned!    │
└─────────────────────────────────┘
```

### Step 3: Login (लॉगिन)

```
User logs in:
├── Email + Password
│   OR
└── Google Sign-In
         │
         ▼
┌─────────────────────────────────┐
│  System checks:                 │
│  1. Is email verified? ✓       │
│  2. What roles does user have? │
└─────────────────────────────────┘
         │
         ▼
    ┌────┴────┐
    │         │
No Role    Has Role
    │         │
    ▼         ▼
┌────────┐  ┌────────────────┐
│ Can    │  │ Can access     │
│ only   │  │ assigned       │
│ access │  │ portal(s)      │
│ Home & │  │ Admin/Student/ │
│ Verify │  │ Verify         │
└────────┘  └────────────────┘
```

---

## 🎭 Role-Based Access Control
## भूमिका-आधारित पहुंच नियंत्रण

### Three Roles / तीन भूमिकाएं

| Role | Portal Access | Hindi Description |
|------|---------------|-------------------|
| `admin` | /admin, /verify | एडमिन - सभी कार्य कर सकता है |
| `student` | /student, /verify | छात्र - अपने प्रमाणपत्र देख सकता है |
| `verifier` | /verify | सत्यापनकर्ता - प्रमाणपत्र verify कर सकता है |

### Database Tables / डेटाबेस टेबल्स

```sql
-- user_roles table structure
┌─────────────────────────────────────────┐
│           user_roles table              │
├─────────────────────────────────────────┤
│ id        │ UUID (Primary Key)          │
│ user_id   │ UUID (references auth.users)│
│ role      │ app_role (admin/student/    │
│           │          verifier)          │
│ created_at│ timestamp                   │
└─────────────────────────────────────────┘
```

### How Role Check Works / रोल चेक कैसे होता है

```javascript
// In ProtectedRoute component:
if (requiredRole === "admin" && !hasRole("admin")) {
  // Redirect to /unauthorized
  // "Access Denied" page shown
}
```

---

## 🚪 How Each Portal Works
## प्रत्येक पोर्टल कैसे काम करता है

### 1️⃣ Admin Portal (/admin)

**Access Requirements / पहुंच आवश्यकताएं:**
```
┌─────────────────────────────────────────┐
│  To access Admin Portal:                │
│                                         │
│  1. ✅ Must be logged in                │
│  2. ✅ Email must be verified           │
│  3. ✅ Must have 'admin' role           │
│  4. ✅ Must connect MetaMask wallet     │
│     (for blockchain operations)         │
└─────────────────────────────────────────┘
```

**What Admin Can Do / एडमिन क्या कर सकता है:**
- 📝 Register new students (blockchain पर)
- 📜 Issue certificates (blockchain पर)
- 👥 View all students and certificates
- 🚫 Revoke certificates
- 👤 Manage user roles (assign/remove roles)

### 2️⃣ Student Portal (/student)

**Access Requirements / पहुंच आवश्यकताएं:**
```
┌─────────────────────────────────────────┐
│  To access Student Portal:              │
│                                         │
│  1. ✅ Must be logged in                │
│  2. ✅ Email must be verified           │
│  3. ✅ Must have 'student' role         │
└─────────────────────────────────────────┘
```

**What Student Can Do / छात्र क्या कर सकता है:**
- 📄 View their issued certificates
- 📱 Download QR codes
- 🔐 View certificate & transaction hashes

### 3️⃣ Verify Portal (/verify)

**Access Requirements / पहुंच आवश्यकताएं:**
```
┌─────────────────────────────────────────┐
│  To access Verify Portal:               │
│                                         │
│  ✅ PUBLIC ACCESS - No login required   │
│  Anyone can verify certificates!        │
└─────────────────────────────────────────┘
```

**What Anyone Can Do / कोई भी क्या कर सकता है:**
- 🔍 Verify certificate by hash
- 📱 Scan QR code
- 📄 Upload certificate image

---

## ⚠️ Common Issues & Solutions
## सामान्य समस्याएं और समाधान

### Issue 1: "Access Denied" after Login
### समस्या 1: लॉगिन के बाद "Access Denied"

**Reason / कारण:**
```
User logged in successfully BUT
does not have required role assigned!

User ──▶ Login ──▶ Success ──▶ /admin ──▶ ❌ Access Denied
                                          (no 'admin' role)
```

**Solution / समाधान:**
- Admin को user_roles table में role add करना होगा
- Admin Portal > User Management > Assign Role

### Issue 2: Verification Email Not Received
### समस्या 2: वेरिफिकेशन ईमेल नहीं मिला

**Possible Reasons / संभावित कारण:**
1. Check spam/junk folder
2. Email address typo
3. Email service delay (wait 5-10 minutes)

**Solution / समाधान:**
- Try "Resend verification email" option
- Check spam folder
- Use different email

### Issue 3: Can't Access Admin Portal
### समस्या 3: एडमिन पोर्टल एक्सेस नहीं हो रहा

**Checklist / चेकलिस्ट:**
```
□ Are you logged in?
□ Is your email verified?
□ Do you have 'admin' role in database?
□ Is MetaMask installed?
□ Is MetaMask connected to correct network?
```

### Issue 4: External User Login
### समस्या 4: बाहरी यूजर लॉगिन

**Current Behavior / वर्तमान व्यवहार:**
```
External User Signs Up:
├── ✅ Account created
├── ✅ Email verification sent
├── ✅ Can login after verification
├── ❌ No role assigned
└── ❌ Can only access Home & Verify pages
```

**This is CORRECT behavior!**
- External users SHOULD NOT automatically get admin/student access
- Admin must manually assign appropriate roles

---

## 👑 Admin Setup Guide
## एडमिन सेटअप गाइड

### How to Create First Admin / पहला एडमिन कैसे बनाएं

**Method 1: Direct Database Insert (Recommended for first admin)**

```sql
-- Step 1: Find user's UUID from auth.users
-- (Check Lovable Cloud > View Backend)

-- Step 2: Insert admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

**Method 2: Using Lovable Cloud UI**

```
1. Go to Lovable Cloud > View Backend
2. Open SQL Editor or Table Editor
3. Find user_roles table
4. Add new row:
   - user_id: (copy from auth.users)
   - role: admin
```

### After First Admin is Created / पहला एडमिन बनने के बाद

```
First Admin can now:
├── Login to /admin
├── Go to User Management
└── Assign roles to other users through UI
```

---

## 🔮 Future Improvements
## भविष्य में सुधार

### High Priority / उच्च प्राथमिकता

| Feature | Description (Hindi) | Description (English) |
|---------|---------------------|----------------------|
| **Auto Role Request** | नया यूजर sign up करते समय role request कर सके | Users can request specific role during signup |
| **Admin Approval Flow** | एडमिन को नए यूजर approve करने का notification | Admin gets notifications for new user approvals |
| **Student Self-Registration** | छात्र enrollment number से खुद register कर सके | Students can self-register with enrollment number |

### Medium Priority / मध्यम प्राथमिकता

| Feature | Description (Hindi) | Description (English) |
|---------|---------------------|----------------------|
| **Forgot Password** | ✅ Already implemented | ✅ Already implemented |
| **Google Sign-In** | ✅ Already implemented | ✅ Already implemented |
| **Email Notifications** | Certificate issue होने पर email | Email when certificate is issued |
| **Dashboard Analytics** | Statistics और charts | Statistics and charts |

### Low Priority / कम प्राथमिकता

| Feature | Description (Hindi) | Description (English) |
|---------|---------------------|----------------------|
| **Multi-language UI** | हिंदी/English toggle | Hindi/English toggle |
| **Mobile App** | Android/iOS app | Android/iOS app |
| **Bulk Upload** | Multiple certificates एक साथ | Issue multiple certificates at once |
| **IPFS Storage** | Certificate files को IPFS पर store | Store certificate files on IPFS |

---

## 📊 Current System Status
## वर्तमान सिस्टम स्थिति

### ✅ What's Working / क्या काम कर रहा है

| Feature | Status |
|---------|--------|
| Email/Password Sign Up | ✅ Working |
| Email Verification | ✅ Working |
| Google Sign-In | ✅ Working |
| Password Reset | ✅ Working |
| Role-Based Access | ✅ Working |
| Admin Portal | ✅ Working (needs role) |
| Student Portal | ✅ Working (needs role) |
| Verify Portal | ✅ Working (public) |
| Blockchain Integration | ✅ Working (needs Ganache + MetaMask) |
| AI Certificate Extraction | ✅ Working (needs GEMINI_API_KEY) |
| Email Notifications | ✅ Working (needs RESEND_API_KEY) |

### ⚙️ Required Setup / आवश्यक सेटअप

```
For Full Functionality:
├── Lovable Cloud ✅ (Already connected)
├── First Admin User (Manual database insert needed)
├── Ganache (Local blockchain)
├── MetaMask (Browser wallet)
├── GEMINI_API_KEY (For AI extraction - optional)
└── RESEND_API_KEY (For email notifications - optional)
```

---

## 🎯 Quick Start Checklist
## त्वरित शुरुआत चेकलिस्ट

### For Developers / डेवलपर्स के लिए

```
□ 1. Clone project
□ 2. npm install
□ 3. npm run dev
□ 4. Sign up with email
□ 5. Verify email (check inbox)
□ 6. Add admin role in database (see Admin Setup Guide)
□ 7. Login and access /admin
□ 8. Install & configure Ganache
□ 9. Install & configure MetaMask
□ 10. Deploy smart contract (see PROJECT_DOCUMENTATION.md)
□ 11. Connect MetaMask to Ganache
□ 12. Start using the system!
```

### For End Users / अंतिम उपयोगकर्ताओं के लिए

```
□ 1. Go to app URL
□ 2. Sign up with email
□ 3. Verify email
□ 4. Wait for admin to assign role
□ 5. Login and access your portal
```

---

## 📞 Summary / सारांश

### The Main Flow / मुख्य प्रक्रिया

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPLETE FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. SIGNUP ──▶ 2. VERIFY EMAIL ──▶ 3. WAIT FOR ROLE             │
│                                          │                       │
│                                          ▼                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    ADMIN ASSIGNS ROLE                    │    │
│  │         (user_roles table में entry करता है)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                          │                       │
│                                          ▼                       │
│  4. LOGIN ──▶ 5. ACCESS PORTAL (based on role)                  │
│                                                                   │
│     admin  ──▶ /admin  ──▶ Register Students, Issue Certs       │
│     student──▶ /student──▶ View Own Certificates                │
│     anyone ──▶ /verify ──▶ Verify Any Certificate               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Takeaways / मुख्य बातें

1. **Email verification जरूरी है** - Without it, login won't work
2. **Role assignment जरूरी है** - Without it, portal access denied
3. **First admin manually बनाना होगा** - Database में directly insert करें
4. **Verify portal public है** - Anyone can use without login
5. **MetaMask जरूरी है** - Only for admin blockchain operations

---

**📅 Last Updated:** February 2025

**✅ Document Status:** Complete

---

> "समझ में आया तो काम आसान है!"
> "Once you understand, everything is easy!"
