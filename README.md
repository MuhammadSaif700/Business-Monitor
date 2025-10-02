<div align="center">

# 📊 Business Monitor

### AI-Powered Business Analytics Platform

*Transform your sales data into actionable insights with intelligent visualizations and AI assistance*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-api-documentation) • [Demo](#-usage-guide)

</div>

---

## 🌟 Features

<table>
<tr>
<td width="50%">

### 📊 Analytics & Visualization
- **Interactive Dashboards** with real-time data
- **Multiple Chart Types** (Bar, Line, Pie)
- **Profit Analysis** by product and region
- **Time-series Trends** visualization
- **Data Export** to CSV

</td>
<td width="50%">

### 🤖 AI Capabilities
- **AI Chat** - Ask questions in natural language
- **Smart Insights** - Automated recommendations
- **Dashboard Designer** - AI creates custom dashboards
- **Multiple AI Providers** (Gemini, OpenAI, HuggingFace)
- **Intelligent Analysis** of business metrics

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Enterprise Ready
- **Secure Authentication** with API keys
- **Multi-dataset Support**
- **Data Validation** and sanitization
- **Environment Configuration**
- **Docker Deployment**

</td>
<td width="50%">

### 🎨 User Experience
- **Dark Mode** support
- **Responsive Design** (mobile-friendly)
- **Real-time Notifications**
- **User Profiles**
- **Modern UI** with Tailwind CSS

</td>
</tr>
</table>

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18+ and npm
- **Python** 3.9+
- **Docker** (optional, for containerized deployment)

### 📦 Installation

<details open>
<summary><b>Method 1: Local Development (Recommended for Development)</b></summary>

<br>

**Step 1: Clone the Repository**

```bash
git clone https://github.com/MuhammadSaif700/Business-Monitor.git
cd Business-Monitor
```

**Step 2: Setup Backend**

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

**Step 3: Configure Environment**

Create a `.env` file in the `backend` folder:

```env
# AI Configuration
AI_ENABLED=true
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODEL=gemini-1.5-flash

# Security
BACKEND_API_KEY=your_secret_api_key_here
BACKEND_PASSWORD=your_secure_password_here

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Step 4: Start Backend**

```bash
python app.py
# Backend runs on http://localhost:8000
```

**Step 5: Setup Frontend**

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

✅ **Done!** Open http://localhost:5173 in your browser

</details>

<details>
<summary><b>Method 2: Docker (Recommended for Production)</b></summary>

<br>

```bash
# Clone repository
git clone https://github.com/MuhammadSaif700/Business-Monitor.git
cd Business-Monitor

# Configure backend/.env file (see above)

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Stop services:**
```bash
docker-compose down
```

</details>

## 📁 Project Structure

```
Business-Monitor/
├── backend/                    # FastAPI backend
│   ├── app.py                 # Main FastAPI application
│   ├── ai_service.py          # AI integration (Google Gemini, OpenAI, HF)
│   ├── auth.py                # Authentication logic
│   ├── models.py              # SQLAlchemy models
│   ├── user_service.py        # User management
│   ├── requirements.txt       # Python dependencies
│   ├── business.db            # SQLite database (auto-generated)
│   ├── alembic/               # Database migrations
│   ├── scripts/               # Utility scripts
│   │   ├── demo_ai_query.py  # AI query testing
│   │   ├── reset_db.py       # Database reset
│   │   └── smoke_http.py     # API smoke tests
│   └── tests/                 # Backend tests
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.jsx            # Main application component
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── AIChat.jsx
│   │   │   ├── AIDashboardDesigner.jsx
│   │   │   ├── CustomDashboard.jsx
│   │   │   └── ...
│   │   └── lib/
│   │       ├── api.js         # API client
│   │       └── history.js     # Data history
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
│
├── docker-compose.yml          # Docker orchestration
├── DEPLOYMENT-CHECKLIST.md     # Production deployment guide
├── PRODUCTION.md              # Production setup instructions
├── SECURITY.md                # Security guidelines
└── README.md                  # This file
```

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AI_ENABLED` | Enable AI features | No | `true` |
| `GOOGLE_API_KEY` | Google Gemini API key | For AI* | - |
| `GOOGLE_MODEL` | Google model name | No | `gemini-1.5-flash` |
| `OPENAI_API_KEY` | OpenAI API key | For AI* | - |
| `HUGGINGFACE_API_KEY` | Hugging Face key | For AI* | - |
| `BACKEND_API_KEY` | API authentication | **Yes** | - |
| `BACKEND_PASSWORD` | Admin password | **Yes** | - |
| `ENVIRONMENT` | Environment mode | No | `development` |
| `DEBUG` | Debug mode | No | `false` |
| `ALLOWED_ORIGINS` | CORS origins | Production | `*` |

\* At least one AI provider key is needed for AI features

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

### Generate Secure Keys

```bash
# Generate API key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 🔑 Getting API Keys

> **Note:** You only need ONE AI provider. Choose based on your preference.

### Option 1: Google Gemini (Recommended - Free Tier Available)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key to `.env` as `GOOGLE_API_KEY`

### Option 2: OpenAI (Paid)

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create account and add payment method
3. Generate new API key
4. Copy to `.env` as `OPENAI_API_KEY`

### Option 3: Hugging Face (Free)

1. Visit [Hugging Face](https://huggingface.co/settings/tokens)
2. Create free account
3. Generate access token
4. Copy to `.env` as `HUGGINGFACE_API_KEY`

## 📖 Usage Guide

### 1️⃣ Upload Your Data

1. Click **Upload** in the sidebar
2. Select CSV or Excel file
3. Required columns: `Date`, `Product`, `Sales`, `Cost`
4. Optional: `Category`, `Region`, `Customer`
5. Click Upload and wait for processing

### 2️⃣ View Analytics

- **Dashboard** → Overview with charts and AI insights
- **Transactions** → Detailed data table
- **Custom Dashboard** → AI-designed personalized views

### 3️⃣ Use AI Features

**AI Chat:** Ask questions like:
- "What were my top 5 products last quarter?"
- "Show me sales trends for Electronics"
- "Which region has the highest profit margin?"

**AI Insights:** Automatic analysis on dashboard with:
- Profit recommendations
- Trend analysis
- Performance highlights

**Dashboard Designer:** Tell AI what you want:
- "Create a dashboard showing monthly revenue trends"
- "I need a view comparing product categories"

### 4️⃣ Manage Data

- **View Datasets** → See all uploaded files
- **Switch Dataset** → Analyze different data
- **Delete Dataset** → Remove old data
- **Export** → Download reports as CSV

## 📚 API Documentation

When backend is running, interactive API documentation is available:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload CSV/Excel files |
| `GET` | `/dashboard` | Get dashboard data |
| `GET` | `/transactions` | Get transaction list |
| `POST` | `/ai/chat` | Chat with AI about data |
| `POST` | `/ai/design-dashboard` | Generate custom dashboard |
| `GET` | `/datasets` | List all datasets |
| `DELETE` | `/datasets/{id}` | Delete a dataset |
| `GET` | `/template/csv` | Download CSV template |

## 🧪 Testing

### Run Backend Tests

```bash
cd backend

# All tests
pytest

# Specific test file
pytest tests/test_upload_and_report.py

# With coverage
pytest --cov=.
```

### Run Smoke Tests

```bash
cd backend
python scripts/smoke_http.py
```

### Frontend Linting

```bash
cd frontend
npm run lint
```

## 🛡️ Security

- ✅ API key authentication for all endpoints
- ✅ Password protection for sensitive operations
- ✅ Input validation and sanitization
- ✅ CORS configuration for production
- ✅ Environment-based configuration
- ✅ No hardcoded credentials

See [SECURITY.md](SECURITY.md) for detailed security guidelines.

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Review [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- [ ] Generate secure credentials (see command below)
- [ ] Set `ENVIRONMENT=production` and `DEBUG=false`
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Test all features thoroughly
- [ ] Setup monitoring and logging

```bash
# Generate secure API key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Deployment Options

| Platform | Best For | Docs |
|----------|----------|------|
| **Docker** | Any server with Docker | [docker-compose.yml](docker-compose.yml) |
| **Heroku** | Quick deployment | [PRODUCTION.md](PRODUCTION.md) |
| **AWS/GCP/Azure** | Enterprise scale | Container services |
| **Netlify/Vercel** | Frontend only | Static deployment |
| **Railway/Render** | Simple full-stack | One-click deploy |

See [PRODUCTION.md](PRODUCTION.md) for detailed platform-specific guides.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

<details>
<summary><b>Backend won't start</b></summary>

- Check Python version: `python --version` (need 3.9+)
- Reinstall dependencies: `pip install -r requirements.txt`
- Check if port 8000 is in use
- Delete `business.db` and restart

</details>

<details>
<summary><b>Frontend won't start</b></summary>

- Check Node version: `node --version` (need 18+)
- Delete `node_modules` and run `npm install`
- Clear cache: `npm cache clean --force`
- Check if port 5173 is in use

</details>

<details>
<summary><b>AI features not working</b></summary>

- Verify `AI_ENABLED=true` in `.env`
- Check API key is valid
- Ensure API has remaining quota
- Review backend logs for errors
- Try different AI provider

</details>

<details>
<summary><b>CORS errors</b></summary>

- Add frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart backend after changing `.env`
- Clear browser cache
- Check browser console for specific error

</details>

<details>
<summary><b>Database errors</b></summary>

- Delete `business.db` to reset
- Run migrations: `alembic upgrade head`
- Check file permissions
- Ensure SQLite is installed

</details>

## 💬 Support

- 📧 Email: muhammadsaif700@example.com
- 🐙 GitHub Issues: [Create an issue](https://github.com/MuhammadSaif700/Business-Monitor/issues)
- 📖 Documentation: See `docs/` folder

## 🙏 Acknowledgments
## ?? Support & Contact

- ?? **Issues:** [GitHub Issues](https://github.com/MuhammadSaif700/Business-Monitor/issues)
- ?? **Email:** muhammadsaif700@example.com  
- ?? **GitHub:** [@MuhammadSaif700](https://github.com/MuhammadSaif700)

## ?? Acknowledgments

Built with these amazing technologies:

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - UI library  
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI capabilities

---

<div align="center">

**Made with ?? by [MuhammadSaif700](https://github.com/MuhammadSaif700)**

? Star this repo if you find it helpful!

</div>
