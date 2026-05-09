# CertAuth 🔐
### Secure Certificate Management System | Full-Stack Digital Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Success-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue.svg)]()

CertAuth is a comprehensive, enterprise-grade digital vault designed to secure and manage sensitive certificates with end-to-end encryption. Built by **Durga Prasad A**, this full-stack project demonstrates a robust monorepo architecture combining a high-performance React Native mobile application with a secure Express.js backend.

---

## 🚀 Key Features

- **🛡️ Encrypted Vault**: Every certificate is encrypted using **AES-256-CBC** before storage, ensuring data remains unreadable even in the event of a database compromise.
- **📸 VisionCamera Integration**: High-performance QR scanning for rapid certificate entry and identity verification.
- **🔐 2FA & TOTP Support**: Integrated Time-based One-Time Password support for an extra layer of security.
- **🔄 Real-Time Sync**: Seamless synchronization between the mobile client and the Supabase-backed cloud storage via a secure REST API.
- **🔔 Advanced Notifications**: Local and push notification system to alert users of certificate updates or security events.
- **📊 Monorepo Architecture**: Clean, scalable directory structure separating `backend` and `authenticate` (mobile) logic for streamlined development.

---

## 🛠️ Technical Stack

### Frontend (Mobile App)
- **Framework**: React Native (JSX/TSX)
- **Engine**: Hermes (Optimized for performance)
- **Native Modules**: VisionCamera, Keychain, Biometrics
- **UI/UX**: Custom "Luxury Gold" design system with glassmorphism effects.

### Backend (API)
- **Runtime**: Node.js & Express.js
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Security**: AES-256 encryption, JWT-based authentication
- **Hosting**: Render (Live Environment)
- **Monitoring**: Automated uptime tracking via UptimeRobot

---

## 🏗️ Architecture Overview

CertAuth follows a client-server architecture designed for high availability and security:

1. **Client Layer**: The React Native app handles local encryption/decryption using a master secret stored in the secure keychain.
2. **Transport Layer**: Secure HTTPS requests communicate with the Express API, never transmitting raw, unencrypted secrets.
3. **Storage Layer**: The backend serves as a stateless bridge to the Supabase database, where only fully encrypted payloads are persisted.

---

## 📂 Repository Structure

```text
CertAuth/
├── backend/            # Express.js API & Prisma Schema
├── authenticate/       # React Native Mobile Application
└── README.md           # Documentation
```

---

## 🌐 Project Links

- **Backend API**: [https://certauth-backend.onrender.com](https://certauth-backend.onrender.com) (Placeholder)
- **GitHub Repository**: [https://github.com/Dprasad17/certauth-backend](https://github.com/Dprasad17/certauth-backend)

---

## 👨‍💻 About the Developer

**Durga Prasad A** is a 20-year-old Full-Stack Developer specializing in **React Native** and **Machine Learning**. With a passion for building secure, outcome-driven engineering solutions, Durga focuses on creating applications that bridge the gap between complex cryptography and intuitive user experiences.

- **Focus Areas**: Mobile Security, Edge Computing, Synthetic Fraud Detection.
- **Contact**: [Insert LinkedIn/Email Link Here]

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
