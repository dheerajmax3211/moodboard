# 🚀 Moodboards - Complete Setup Guide

This guide will walk you through setting up Supabase (database) and Google Drive API (storage) for the moodboard website. Follow each step carefully.

---

## 📋 Prerequisites

- A Google account (for Google Drive API)
- A web browser
- About 10-15 minutes

---

## Part 1: Supabase Setup (Database)

### Step 1.1: Create Supabase Account

1. Go to **[supabase.com](https://supabase.com)**
2. Click **"Start your project"** or **"Sign Up"**
3. Sign in with GitHub, Google, or email

### Step 1.2: Create New Project

1. After signing in, click **"New Project"**
2. Fill in the details:
   - **Organization**: Select your default org or create one
   - **Name**: `kiran-moodboards` (or any name you like)
   - **Database Password**: Generate a strong password and **save it somewhere safe**
   - **Region**: Choose the closest to your location
3. Click **"Create new project"**
4. Wait 1-2 minutes for the project to be ready

### Step 1.3: Run the Database Schema

1. Once the project is ready, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button (top right)
3. Open the file `supabase-schema.sql` from your project folder
4. Copy the **entire contents** of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
7. You should see: **"Success. No rows returned"**

### Step 1.4: Get Your API Credentials

1. Click **"Project Settings"** (gear icon in the bottom left)
2. Click **"API"** in the settings menu
3. You'll see two pieces of information you need:

   **Project URL:**
   ```
   https://xxxxxxxxxx.supabase.co
   ```
   Copy this URL

   **Anon Public Key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   Copy this long string (it's the `anon` `public` key)

### Step 1.5: Save Your Supabase Details

You now have:
- ✅ **SUPABASE_URL**: `https://xxxxxxxxxx.supabase.co`
- ✅ **SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...`

Keep these handy for the final configuration step.

---

## Part 2: Google Cloud Setup (Drive Storage)

### Step 2.1: Create Google Cloud Project

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. If prompted, accept the Terms of Service
3. Click the project dropdown (next to "Google Cloud" logo at the top)
4. Click **"New Project"**
5. Fill in:
   - **Project name**: `Kiran Moodboards`
   - **Location**: Leave as default
6. Click **"Create"**
7. Wait for the project to be created (a few seconds)
8. Make sure the new project is selected in the dropdown

### Step 2.2: Enable Required APIs

1. In the search bar at the top, type **"Google Drive API"**
2. Click on **"Google Drive API"** in the results
3. Click **"Enable"**
4. After it's enabled, search for **"Google Picker API"**
5. Click on **"Google Picker API"** in the results
6. Click **"Enable"**

### Step 2.3: Configure OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** and click **"Create"**
3. Fill in the required fields:
   - **App name**: `Kiran Moodboards`
   - **User support email**: Select your email
   - **Developer contact email**: Enter your email
4. Click **"Save and Continue"**
5. On the "Scopes" page, click **"Save and Continue"** (no changes needed)
6. On the "Test users" page, click **"Add Users"**
7. Enter your email address
8. Click **"Add"**
9. Click **"Save and Continue"**
10. Click **"Back to Dashboard"**

### Step 2.4: Create OAuth Client ID

1. In the left sidebar, click **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. For **Application type**, select **"Web application"**
5. **Name**: `Moodboard Web App`
6. Under **"Authorized JavaScript origins"**, click **"+ Add URI"**
7. Add these URIs (one at a time):
   - `http://localhost:5173` (for local development)
   - `https://YOUR-USERNAME.github.io` (for GitHub Pages - replace YOUR-USERNAME)
8. Click **"Create"**
9. A popup will show your credentials:
   - **Client ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
   
   Copy the **Client ID**

### Step 2.5: Create API Key

1. Still on the Credentials page, click **"+ Create Credentials"**
2. Select **"API key"**
3. A popup will show your new API key
4. Copy the **API Key**
5. (Optional but recommended) Click **"Edit API key"**:
   - Under "API restrictions", select **"Restrict key"**
   - Check: **Google Drive API** and **Google Picker API**
   - Click **"Save"**

### Step 2.6: Get Your Project Number (App ID)

1. In the left sidebar, click **"IAM & Admin"** → **"Settings"**
2. You'll see **"Project number"** (a number like `123456789012`)
3. Copy this number - this is your **App ID**

### Step 2.7: Save Your Google Details

You now have:
- ✅ **GOOGLE_CLIENT_ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
- ✅ **GOOGLE_API_KEY**: `AIzaSy...`
- ✅ **GOOGLE_APP_ID**: `123456789012` (your project number)

---

## Part 3: Configure Your App

### Step 3.1: Update the Config File

1. Open the file `src/config.js` in your project
2. Replace the placeholder values with your actual credentials:

```javascript
// Supabase Configuration
export const SUPABASE_URL = 'https://xxxxxxxxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Google Drive Configuration
export const GOOGLE_API_KEY = 'AIzaSy...';
export const GOOGLE_CLIENT_ID = 'xxxxxxxxxxxx.apps.googleusercontent.com';
export const GOOGLE_APP_ID = '123456789012';

// Optional: Google Drive folder ID
export const GOOGLE_DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID_OPTIONAL';
```

3. Save the file

### Step 3.2: (Optional) Create a Shared Folder

For better organization, you can create a dedicated folder in Google Drive:

1. Go to **[drive.google.com](https://drive.google.com)**
2. Click **"+ New"** → **"New Folder"**
3. Name it `Moodboard Images`
4. Right-click the folder → **"Share"**
5. Click **"Change to anyone with the link"**
6. Set to **"Viewer"**
7. Click **"Done"**
8. Open the folder
9. Copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```
10. Paste this ID into `GOOGLE_DRIVE_FOLDER_ID` in `config.js`

---

## Part 4: Test Your Setup

### Step 4.1: Run Locally

1. Open a terminal in your project folder
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173 in your browser

### Step 4.2: Test the Features

1. **Create a board**: Click "Create New Board", enter a name and password
2. **Upload images**: Click "Add Images", try drag-and-drop or Google Drive picker
3. **Select images**: Click on images to toggle selection
4. **Add labels**: Click "Labels" to create and manage labels
5. **Test password**: Open the board in an incognito window and enter the password

---

## Part 5: Deploy to GitHub Pages

### Step 5.1: Build the Project

```bash
npm run build
```

This creates a `dist/` folder with your static files.

### Step 5.2: Push to GitHub

1. Create a new repository on GitHub
2. Follow GitHub's instructions to push your code
3. Make sure the `dist/` folder is committed

### Step 5.3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** → **"Pages"**
3. Under **"Source"**, select:
   - Branch: `main`
   - Folder: `/dist` (or use a build action)
4. Click **"Save"**
5. Wait a few minutes for deployment

### Step 5.4: Update Google OAuth Origins

1. Go back to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth client ID
4. Under **"Authorized JavaScript origins"**, add your GitHub Pages URL:
   ```
   https://YOUR-USERNAME.github.io
   ```
5. Click **"Save"**

---

## 🎉 Done!

Your moodboard website is now fully configured and ready to use!

---

## ❓ Troubleshooting

### "Failed to load boards" error
- Double-check your Supabase URL and anon key in `config.js`
- Make sure you ran the SQL schema in Supabase
- Check browser console (F12) for detailed error messages

### "Failed to upload images" error
- Verify Google Drive API and Picker API are enabled
- Check your Client ID is correct
- Make sure localhost:5173 is in your authorized origins

### Google sign-in popup blocked
- Allow popups for localhost or your domain
- Try a different browser

### Images not displaying
- Make sure the images are publicly accessible
- Try refreshing the page
- Check if the Google Drive permissions are set correctly

---

## 📝 Your Credentials Checklist

Before finishing, make sure you have:

| Credential | Where to Get It | Status |
|------------|-----------------|--------|
| SUPABASE_URL | Supabase → Project Settings → API | ☐ |
| SUPABASE_ANON_KEY | Supabase → Project Settings → API | ☐ |
| GOOGLE_API_KEY | Google Cloud → Credentials | ☐ |
| GOOGLE_CLIENT_ID | Google Cloud → Credentials | ☐ |
| GOOGLE_APP_ID | Google Cloud → IAM & Admin → Settings | ☐ |

Once all checkboxes are ticked, you're ready to go! 🚀
