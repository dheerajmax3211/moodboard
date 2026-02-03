# Moodboards 🎨

A beautiful, modern web app for creating password-protected moodboards for models. Upload reference images to Google Drive, share boards securely, and let models select their favorites.

![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Supabase](https://img.shields.io/badge/Supabase-Database-green)

## ✨ Features

- **🎨 Create Unlimited Boards** - Each board has a unique name and password
- **🔒 Password Protection** - Only people with the password can view a board
- **📤 Bulk Image Upload** - Drag & drop or select multiple images at once
- **📁 Google Drive Storage** - Free 15GB storage, images stored in your Drive
- **✅ Selection Checkboxes** - Models can select their favorite reference images
- **📱 Mobile Optimized** - Beautiful responsive design for all devices
- **⚡ Super Fast** - Built with React + Vite for blazing performance

---

## 🚀 Quick Setup Guide

### Step 1: Supabase Setup (5 minutes)

1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up (free)

2. **Create New Project**: 
   - Click "New Project"
   - Name it something like "kiran-moodboards"
   - Set a database password (save this somewhere)
   - Choose a region close to you
   - Click "Create new project"

3. **Run the SQL Schema**: 
   - Go to **SQL Editor** in the sidebar
   - Click "New Query"
   - Copy and paste the SQL from the section below
   - Click "Run" (or Ctrl+Enter)

4. **Get Your Credentials**:
   - Go to **Project Settings** → **API**
   - Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy the **anon public** key (the long string)

### Step 2: Google Cloud Setup (5 minutes)

1. **Create Project**: Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Click "Select a project" → "New Project"
   - Name it "Kiran Moodboards"
   - Click "Create"

2. **Enable APIs**:
   - Go to **APIs & Services** → **Library**
   - Search for and enable:
     - ✅ **Google Drive API**
     - ✅ **Google Picker API**

3. **Create OAuth Credentials**:
   - Go to **APIs & Services** → **Credentials**
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the consent screen first (External, basic info only)
   - Application type: **Web application**
   - Name: "Moodboard App"
   - Authorized JavaScript origins: 
     - `http://localhost:5173` (for development)
     - `https://yourusername.github.io` (for production)
   - Click "Create"
   - Copy the **Client ID**

4. **Create API Key**:
   - Click "Create Credentials" → "API key"
   - Copy the API key
   - (Optional) Click "Edit API key" to restrict it to Drive & Picker APIs

5. **Get Project Number**:
   - Go to **IAM & Admin** → **Settings**
   - Copy the **Project number** (this is your App ID)

### Step 3: Configure the App

1. Open `src/config.js` and fill in your credentials:

```javascript
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';

export const GOOGLE_API_KEY = 'your-google-api-key';
export const GOOGLE_CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
export const GOOGLE_APP_ID = 'your-project-number';
```

### Step 4: Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser!

---

## 📦 Deploy to GitHub Pages

1. **Build the project**:
```bash
npm run build
```

2. **Push to GitHub**:
   - Create a new repository on GitHub
   - Push your code

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/dist` folder
   - Or use `gh-pages` branch with the dist contents

4. **Update Google OAuth**:
   - Go back to Google Cloud Console → Credentials
   - Add your GitHub Pages URL to Authorized JavaScript origins

---

## 🗄️ SQL Schema for Supabase

Copy and paste this entire block into the Supabase SQL Editor:

```sql
-- =============================================
-- Moodboards - DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- BOARDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_boards_name ON boards(name);

-- =============================================
-- IMAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    drive_file_id TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by board
CREATE INDEX IF NOT EXISTS idx_images_board_id ON images(board_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on both tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read board names (but not passwords directly in app)
CREATE POLICY "Allow public read on boards" ON boards
    FOR SELECT USING (true);

-- Policy: Anyone can create boards
CREATE POLICY "Allow public insert on boards" ON boards
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read images (password check happens in app)
CREATE POLICY "Allow public read on images" ON images
    FOR SELECT USING (true);

-- Policy: Anyone can insert images
CREATE POLICY "Allow public insert on images" ON images
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update images (for checkbox toggling)
CREATE POLICY "Allow public update on images" ON images
    FOR UPDATE USING (true);

-- Policy: Anyone can delete images
CREATE POLICY "Allow public delete on images" ON images
    FOR DELETE USING (true);

-- Policy: Allow deleting boards
CREATE POLICY "Allow public delete on boards" ON boards
    FOR DELETE USING (true);

-- =============================================
-- DONE! Your database is ready.
-- =============================================
```

---

## 🔧 Project Structure

```
src/
├── config.js              # API keys and configuration
├── main.jsx               # App entry point
├── App.jsx                # Router & providers
├── lib/
│   ├── supabase.js        # Database operations
│   └── googleDrive.js     # Google Drive upload
├── components/
│   ├── Toast.jsx          # Notifications
│   ├── Modal.jsx          # Reusable modal
│   ├── Loader.jsx         # Loading states
│   ├── ImageCard.jsx      # Image with checkbox
│   └── UploadModal.jsx    # Upload interface
├── pages/
│   ├── Home.jsx           # Board list & create
│   └── Board.jsx          # Moodboard view
└── styles/
    ├── global.css         # Design system
    └── pages.css          # Page styles
```

---

## 💡 How It Works

1. **Create a Board**: Enter a unique name and password
2. **Upload Images**: Drag & drop or pick from your Google Drive
3. **Share the Link**: Send the board URL and password to your model
4. **Model Selects Images**: They check the boxes on their favorites
5. **You See Selections**: Refresh to see which images they selected

---

## 🎨 Customization

### Change Colors
Edit the CSS variables in `src/styles/global.css`:

```css
:root {
  --accent-primary: #a78bfa;    /* Main purple */
  --accent-success: #34d399;    /* Selected green */
  --bg-primary: #050507;        /* Background */
}
```

### Change Brand Name
Update the title in:
- `index.html` - Page title
- `src/pages/Home.jsx` - Hero title

---

## 🐛 Troubleshooting

### "Failed to load boards"
- Check your Supabase URL and key in `config.js`
- Make sure you ran the SQL schema
- Check the browser console for detailed errors

### "Failed to upload images"
- Make sure Google Drive API and Picker API are enabled
- Check your Client ID has the correct origins
- Try in an incognito window to reset OAuth state

### Images not loading
- The image might still be processing on Google Drive
- Try the alternate URL: `https://drive.google.com/uc?export=view&id=FILE_ID`
- Make sure the file permissions are set to "Anyone with link"

---

## 📄 License

MIT License - Feel free to use and modify!

---

Made with 💜 for Kiran
