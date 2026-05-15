# CertAuth 🔐
### Secure Certificate Management System | Full-Stack Digital Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Success-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue.svg)]()

> **Vision with Velocity**: Empowering users to securely store, verify, and manage sensitive credentials with millisecond-speed synchronization and enterprise-grade encryption.

CertAuth is a comprehensive, enterprise-grade digital vault designed to secure and manage sensitive certificates with end-to-end encryption. Built by **Durga Prasad A**, this full-stack project demonstrates a robust monorepo architecture combining a high-performance React Native mobile application with a secure Express.js backend.

---

## ✨ Core Features

| Feature | Description | Technology |
|---------|-------------|------------|
| **AES-256-GCM** | Military-grade authenticated encryption for all certificate content. | Node.js Crypto / Forge |
| **TOTP 2FA** | Time-based One-Time Password support for multi-factor authentication. | OTPAuth / Keychain |
| **VisionCamera** | High-performance, low-latency QR and document scanning. | react-native-vision-camera |
| **ScreenGuard** | Prevents screenshots and screen recordings in sensitive vault areas. | react-native-screenshot-prevent |
| **Real-Time Sync** | Instant background data synchronization across devices. | Supabase / Express |

---

## 🛠️ Technical Stack

**Frontend (Mobile App)**
- **Framework**: React Native (JSX/TSX)
- **Engine**: Hermes (Optimized for performance)
- **Native Modules**: VisionCamera, Biometrics, Screenshot Prevent
- **UI/UX**: Custom "Luxury Gold" design system with glassmorphism effects.

**Backend (API)**
- **Runtime**: Node.js & Express.js
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Security**: AES-256-GCM encryption, JWT-based authentication
- **Hosting**: Render (Live Environment)

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
├── README.md           # Documentation
└── INSTALLATION.md      # Setup Guide
```

---

## 🌐 Live Deployment

**Live Backend API**
- URL: [https://certauth-backend.onrender.com](https://certauth-backend.onrender.com)
- Status: ![Uptime](https://img.shields.io/uptime-robot/status/m792683930-6b6f7f6f6f6f6f6f6f6f6f6f) (Placeholder)

**Production Android APK**
- Latest Release: [Download CertAuth APK](https://github.com/Dprasad17/certauth-backend/releases/latest)
- Build Version: `v1.0.1-stable`

---

## 👨‍💻 About the Developer

**Durga Prasad A** is a 20-year-old Full-Stack Developer specializing in **React Native** and **Machine Learning**. With a passion for building secure, outcome-driven engineering solutions, Durga focuses on creating applications that bridge the gap between complex cryptography and intuitive user experiences.

- **Focus Areas**: Mobile app developement, Machine learning, AI, Data Analytics
- **Contact**: durgacit1704@gmail.com
- **GitHub**: [github.com/Dprasad17](https://github.com/Dprasad17)

---

## 👨‍💻 About the Developer

**Durga Prasad A** is a 20-year-old Full-Stack Developer specializing in **React Native** and **Machine Learning**. With a passion for building secure, outcome-driven engineering solutions, Durga focuses on creating applications that bridge the gap between complex cryptography and intuitive user experiences.

- **Focus Areas**: Mobile app developement , Machine learning , AI , Data Analytics
- **Contact**: durgacit1704@gmail.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
