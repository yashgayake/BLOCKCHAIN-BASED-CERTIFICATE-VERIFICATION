# 🎓 Blockchain Certificate Verification System

A **Blockchain-based Certificate Verification Platform** that allows educational institutions to securely issue and verify certificates using **Ethereum blockchain technology**.

This system prevents **fake certificates**, ensures **tamper-proof records**, and enables **instant verification** of academic credentials.

---

# 👨‍💻 Developer

**Yash Gayake**
Diploma in Computer Engineering Student
Blockchain • Full Stack Development • AI/ML Enthusiast

GitHub: https://github.com/yashgayake

---

# 🚀 Features

### 🔐 Admin Portal

* MetaMask wallet authentication
* Smart contract connection
* Register new students
* Issue blockchain-based certificates
* View all student and certificate records

### 🎓 Student Portal

* Student login using enrollment number
* View issued certificates
* Secure certificate access

### 🔍 Certificate Verification

* Verify certificate authenticity
* Blockchain validation
* Prevent fake certificates

### ⛓ Blockchain Integration

* Ethereum Smart Contract
* MetaMask wallet connection
* Ganache local blockchain network
* Immutable certificate records

---

# 🛠 Tech Stack

Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

Blockchain

* Solidity
* Ethereum
* Ethers.js
* MetaMask
* Ganache

Development Tools

* VS Code
* Git & GitHub
* Remix IDE

---

# 📂 Project Structure

```
src
 ├─ components
 │   ├─ admin
 │   │   ├─ RegisterStudent.tsx
 │   │   ├─ IssueCertificate.tsx
 │   │   └─ ViewAllRecords.tsx
 │
 ├─ contexts
 │   ├─ BlockchainContext.tsx
 │   └─ AppContext.tsx
 │
 ├─ lib
 │   └─ blockchain.ts
 │
 ├─ pages
 │   ├─ AdminPortal.tsx
 │   ├─ StudentPortal.tsx
 │   └─ VerifyCertificate.tsx
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the repository

```bash
git clone https://github.com/yashgayake/blockchain-certificate-verification.git
```

## 2️⃣ Open project

```bash
cd blockchain-certificate-verification
```

## 3️⃣ Install dependencies

```bash
npm install
```

## 4️⃣ Start development server

```bash
npm run dev
```

---

# ⛓ Blockchain Setup

### 1️⃣ Start Ganache

Run Ganache and create a local blockchain network.

### 2️⃣ Deploy Smart Contract

Deploy the certificate smart contract using **Remix IDE**.

### 3️⃣ Update Contract Address

Update the deployed contract address inside:

```
src/lib/blockchain.ts
```

### 4️⃣ Connect MetaMask

Add Ganache network to MetaMask:

```
Network Name: Ganache Local
RPC URL: http://127.0.0.1:7545
Chain ID: 1337
Currency Symbol: ETH
```

---

# 🧪 System Workflow

1️⃣ Admin connects MetaMask wallet
2️⃣ Admin registers student on blockchain
3️⃣ Admin issues certificate
4️⃣ Certificate stored securely on blockchain
5️⃣ Student can view certificates
6️⃣ Anyone can verify certificate authenticity

---

# 📌 Future Improvements

* QR Code based certificate verification
* IPFS certificate storage
* Email notification system
* Mobile responsive improvements
* Multi-institution support

---

# 📜 License

This project is created for **educational and research purposes**.

---

# ⭐ Author

**Yash Gayake**

If you like this project, feel free to **star the repository ⭐**
