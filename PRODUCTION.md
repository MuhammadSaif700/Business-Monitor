# Business Monitor - Production Deployment Guide

## 🚀 Production Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google AI API Key (for AI features)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `BACKEND_PASSWORD` - Strong password for admin access
   - `BACKEND_API_KEY` - Generate a secure random key
   - `GOOGLE_API_KEY` - Your Google AI API key (get from https://makersuite.google.com/app/apikey)

5. **Start backend server:**
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Serve production build:**
   ```bash
   npm run preview
   ```

## 🔐 Security Checklist

- [ ] Changed `BACKEND_PASSWORD` from default
- [ ] Changed `BACKEND_API_KEY` from `demoapikey`
- [ ] Added your own `GOOGLE_API_KEY`
- [ ] Updated `ALLOWED_ORIGINS` for your domain
- [ ] Enabled HTTPS in production
- [ ] Set `DEBUG=false` in production

## 📦 Deployment Options

### Option 1: VPS/Cloud Server (Recommended)
- Deploy backend using Gunicorn/Uvicorn with systemd
- Deploy frontend using Nginx/Apache
- Use reverse proxy for API

### Option 2: Docker
- Use provided `docker-compose.yml`
- Update environment variables
- Run: `docker-compose up -d`

### Option 3: Platform as a Service
- **Backend:** Render, Railway, Fly.io
- **Frontend:** Vercel, Netlify, Cloudflare Pages

## 🔑 API Key Generation

Generate a secure API key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 📊 Database

- Default: SQLite (`business.db`)
- For production: Consider PostgreSQL or MySQL
- Backup regularly

## 🤖 AI Features

The app uses Google's Gemini AI. To enable:
1. Get API key from: https://makersuite.google.com/app/apikey
2. Add to `.env`: `GOOGLE_API_KEY=your_key_here`
3. Set `AI_ENABLED=true`

## 📝 License

All rights reserved.
