# Installation Guide (Windows) 🪟

This guide provides step-by-step instructions for setting up the **CertAuth** monorepo on a Windows development environment.

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v20.x or higher)
- **Java Development Kit (JDK)** (v17 or higher)
- **Android Studio** (with Android SDK and Platform Tools)
- **Git**
- **Supabase Account** (for database hosting)

---

## 🛠️ Step-by-Step Setup

### 1. Clone the Repository
Open PowerShell or CMD and run:
```powershell
git clone https://github.com/Dprasad17/certauth-backend.git
cd certauth-backend
```

### 2. Backend Configuration
Navigate to the `backend` directory and install dependencies:
```powershell
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```text
PORT=3000
DATABASE_URL="your_supabase_postgresql_url"
DIRECT_URL="your_supabase_direct_url"
ENCRYPTION_KEY="your_32_character_aes_key"
JWT_SECRET="your_jwt_secret"
```

Initialize the database:
```powershell
npx prisma generate
npx prisma db push
```

### 3. Frontend Configuration (React Native)
Navigate to the `authenticate` directory and install dependencies:
```powershell
cd ../authenticate
npm install
```

Ensure your Android Emulator is running or a physical device is connected via ADB. Verify connection:
```powershell
adb devices
```

### 4. Running the Project

**Start Backend:**
```powershell
cd ../backend
npm run dev
```

**Start Mobile App:**
```powershell
cd ../authenticate
npm run android
```

---

## 🔑 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend API Port | `3000` |
| `DATABASE_URL` | Supabase Connection String | `postgresql://...` |
| `ENCRYPTION_KEY` | AES-256-GCM Key (32 chars) | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| `SUPABASE_KEY` | Supabase Anon/Service Key | `eyJhbGci...` |

---

## 📱 Android Studio & ADB Requirements

1. **SDK Platforms**: Ensure Android 14 (API 34) or higher is installed via SDK Manager.
2. **SDK Tools**: Install "Android SDK Build-Tools", "Android SDK Command-line Tools", and "Google Play Intel x86 Atom System Image".
3. **Environment Variables**: Add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator` to your System PATH.

---

## 🧪 Troubleshooting
- **Gradle Errors**: Run `./gradlew clean` in `authenticate/android`.
- **Node Mismatch**: Ensure you are using the Node version specified in `package.json`.
- **Metro Bundler**: If the app hangs, run `npm start -- --reset-cache`.
