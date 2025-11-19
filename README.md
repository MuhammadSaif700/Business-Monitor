<div align="center">

# 📊 Business Monitor

### AI-Powered Business Analytics & Financial Reporting Platform

*Transform your business data into actionable insights with intelligent visualizations, AI assistance, and comprehensive financial reports*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

[Features](#-features) • [Quick Start](#-quick-start) • [Financial Reports](#-financial-reporting) • [API Docs](#-api-documentation)

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
- **Smart Data Export** to CSV
- **Multi-dataset Management**

</td>
<td width="50%">

### 💰 Financial Reporting
- **Income Statement** - P&L with AI insights
- **Balance Sheet** - Assets, liabilities & equity
- **AI-Powered Analysis** - Automated recommendations
- **Date Range Filtering** - Custom period analysis
- **Export to CSV** - Financial report downloads
- **Real-time Calculations** - Live financial metrics

</td>
</tr>
<tr>
<td width="50%">

### 🤖 AI Capabilities
- **AI Chat** - Ask questions in natural language
- **Smart Insights** - Automated recommendations
- **Dashboard Designer** - AI creates custom dashboards
- **Financial Analysis** - AI-powered P&L insights
- **Multiple AI Providers** (Gemini, OpenAI, HuggingFace)
- **Intelligent Business Intelligence**

</td>
<td width="50%">

### 🔐 Enterprise Ready
- **Secure Authentication** with API keys
- **Multi-user Support** with profiles
- **Data Validation** and sanitization
- **Environment Configuration**
- **Docker Deployment**
- **Production-ready Architecture**

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Modern User Experience
- **Dark Mode** support
- **Responsive Design** (mobile-friendly)
- **Real-time Notifications**
- **User Profiles** and preferences
- **Modern UI** with Tailwind CSS
- **Intuitive Navigation**

</td>
<td width="50%">

### ⚡ Performance & Reliability
- **Fast Loading** with optimized queries
- **Real-time Updates** via WebSocket
- **Error Handling** with user-friendly messages
- **Data Caching** for better performance
- **Automatic Backups** capability
- **Health Monitoring**

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18+ and npm
- **Python** 3.9+
- **Git** for version control
- **Docker** (optional, for containerized deployment)

### 📦 Installation

<details open>
<summary><b>Method 1: Local Development (Recommended)</b></summary>

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
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate virtual environment (Linux/Mac)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Step 3: Configure Environment**

Create a `.env` file in the `backend` folder:

```env
# AI Configuration (Required for AI features)
AI_ENABLED=true
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODEL=gemini-1.5-flash

# Security (Required)
BACKEND_API_KEY=your_secret_api_key_here
BACKEND_PASSWORD=your_secure_password_here

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Generate secure keys:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Step 4: Start Backend**

```bash
# Windows
cd backend
& ..\\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload

# Linux/Mac
cd backend
uvicorn app:app --host 127.0.0.1 --port 8000 --reload

# Backend runs on http://localhost:8000
```

**Step 5: Setup Frontend**

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
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

---

## 💰 Financial Reporting

Business Monitor includes comprehensive financial reporting features powered by AI:

### Income Statement (Profit & Loss)

Track your business profitability with:
- **Revenue** - Total sales from all transactions
- **Cost of Goods Sold (COGS)** - Direct costs
- **Gross Profit** - Revenue minus COGS
- **Gross Margin %** - Profitability percentage
- **Net Income** - Bottom line profit
- **AI Insights** - Automated financial analysis

**Features:**
- Date range filtering
- Real-time calculations
- AI-powered recommendations
- CSV export
- Trend analysis

### Balance Sheet

Monitor your financial position with:
- **Assets**
  - Cash position
  - Inventory value
  - Total assets
- **Liabilities**
  - Accounts payable
  - Total liabilities
- **Equity**
  - Retained earnings
  - Total equity
- **Financial Ratios**
  - Debt-to-equity ratio
  - Balance validation
- **AI Insights** - Financial health analysis

**Features:**
- As-of-date filtering
- Balance verification
- AI-powered insights
- CSV export
- Financial health scoring

### Accessing Financial Reports

1. Navigate to **Reports** in the sidebar
2. Choose **Income Statement** or **Balance Sheet**
3. Select date range or as-of date
4. View AI-generated insights
5. Export data as CSV for further analysis

---

## 📁 Project Structure

```
Business-Monitor/
├── backend/                    # FastAPI backend
│   ├── app.py                 # Main application with all endpoints
│   ├── ai_service.py          # AI integration (Google Gemini, OpenAI, HF)
│   ├── auth.py                # Authentication & authorization
│   ├── models.py              # SQLAlchemy database models
│   ├── user_service.py        # User management service
│   ├── requirements.txt       # Python dependencies
│   ├── business.db            # SQLite database (auto-generated)
│   ├── .env                   # Environment configuration (create this)
│   ├── alembic/               # Database migrations
│   ├── scripts/               # Utility scripts
│   │   ├── demo_ai_query.py  # AI query testing
│   │   ├── reset_db.py       # Database reset utility
│   │   └── smoke_http.py     # API smoke tests
│   └── tests/                 # Backend unit tests
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.jsx            # Main application component
│   │   ├── main.jsx           # React entry point
│   │   ├── index.css          # Global styles
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.jsx          # Main dashboard
│   │   │   ├── Upload.jsx             # Data upload
│   │   │   ├── AIChat.jsx             # AI chat interface
│   │   │   ├── AIDashboardDesigner.jsx # AI dashboard builder
│   │   │   ├── CustomDashboard.jsx    # Custom views
│   │   │   ├── IncomeStatement.jsx    # P&L report
│   │   │   ├── BalanceSheet.jsx       # Balance sheet
│   │   │   ├── TransactionsTable.jsx  # Data table
│   │   │   └── ...
│   │   └── lib/
│   │       ├── api.js         # API client configuration
│   │       └── history.js     # Data history management
│   ├── package.json           # Node dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── tailwind.config.cjs    # Tailwind CSS config
│   └── index.html             # HTML entry point
│
├── docker-compose.yml          # Docker orchestration
├── DEPLOYMENT-CHECKLIST.md     # Production deployment guide
├── PRODUCTION.md              # Production setup instructions
├── SECURITY.md                # Security guidelines
└── README.md                  # This file
```

---

## 📖 Usage Guide

### 1️⃣ Upload Your Data

1. Click **Upload** in the sidebar
2. Select CSV or Excel file
3. **Required columns:** `date`, `product`, `quantity`, `price`
4. **Optional columns:** `category`, `region`, `customer`, `type`
5. Click **Upload** and wait for processing
6. View upload summary and any errors

**Supported Formats:**
- CSV (`.csv`)
- Excel (`.xlsx`, `.xls`)

**Data Requirements:**
- Date format: `YYYY-MM-DD` or `MM/DD/YYYY`
- Numeric values for `quantity` and `price`
- Valid column names (case-insensitive)

### 2️⃣ View Analytics

**Dashboard**
- Overview with key metrics
- Interactive charts (pie, bar, line)
- AI-powered insights
- Date range filtering

**Transactions**
- Detailed data table
- Search and filter
- Sort by any column
- Export to CSV

**Custom Dashboard**
- AI-designed personalized views
- Drag-and-drop widgets
- Save custom layouts

### 3️⃣ Financial Reports

**Income Statement**
- Navigate to Reports → Income Statement
- Select date range
- View revenue, costs, and profit
- Read AI analysis
- Export as CSV

**Balance Sheet**
- Navigate to Reports → Balance Sheet
- Select as-of date
- View assets, liabilities, equity
- Check balance validation
- Read AI financial health insights
- Export as CSV

### 4️⃣ Use AI Features

**AI Chat:** Ask questions like:
- *"What were my top 5 products last quarter?"*
- *"Show me sales trends for Electronics"*
- *"Which region has the highest profit margin?"*
- *"Analyze my financial performance"*
- *"What recommendations do you have?"*

**AI Insights:** Automatic analysis with:
- Profit recommendations
- Trend analysis
- Performance highlights
- Financial health assessment

**Dashboard Designer:** Tell AI what you want:
- *"Create a dashboard showing monthly revenue trends"*
- *"I need a view comparing product categories"*
- *"Show me regional performance analysis"*

### 5️⃣ Manage Data

- **View Datasets** → See all uploaded files
- **Switch Dataset** → Analyze different data
- **Delete Dataset** → Remove old data
- **Export** → Download reports as CSV
- **User Profile** → Manage preferences

---

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
| `GET` | `/reports/income-statement` | Get P&L report |
| `GET` | `/reports/balance-sheet` | Get balance sheet |
| `GET` | `/template/csv` | Download CSV template |
| `GET` | `/health` | Health check |

### Authentication

All API endpoints require authentication via API key:

```bash
# Example API call
curl -X GET "http://localhost:8000/dashboard" \
  -H "X-API-Key: your_api_key_here"
```

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend

# All tests
pytest

# Specific test file
pytest tests/test_upload_and_report.py

# With coverage
pytest --cov=. --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Run Smoke Tests

```bash
cd backend
python scripts/smoke_http.py
```

### Frontend Linting

```bash
cd frontend

# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

---

## 🛡️ Security

- ✅ API key authentication for all endpoints
- ✅ Password protection for sensitive operations
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ CORS configuration for production
- ✅ Environment-based configuration
- ✅ No hardcoded credentials
- ✅ Secure password hashing
- ✅ Rate limiting (optional)

See [SECURITY.md](SECURITY.md) for detailed security guidelines.

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Review [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- [ ] Generate secure API keys and passwords
- [ ] Set `ENVIRONMENT=production` and `DEBUG=false`
- [ ] Configure proper `ALLOWED_ORIGINS` (no wildcards)
- [ ] Setup SSL/TLS certificates
- [ ] Configure database backups
- [ ] Test all features thoroughly
- [ ] Setup monitoring and logging
- [ ] Configure error tracking (Sentry)
- [ ] Setup health checks
- [ ] Document deployment process

### Generate Secure Credentials

```bash
# Generate API key (32 characters)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate password (16 characters)
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

### Deployment Options

| Platform | Best For | Difficulty | Cost |
|----------|----------|------------|------|
| **Docker** | Any server with Docker | Medium | Variable |
| **Heroku** | Quick deployment | Easy | Free tier available |
| **AWS/GCP/Azure** | Enterprise scale | Hard | Pay-as-you-go |
| **Netlify/Vercel** | Frontend only | Easy | Free tier available |
| **Railway/Render** | Simple full-stack | Easy | Free tier available |
| **DigitalOcean** | Droplets/App Platform | Medium | $5/mo+ |

See [PRODUCTION.md](PRODUCTION.md) for detailed platform-specific deployment guides.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and meaningful
- Write clear PR descriptions

---

## 💬 Support & Contact

- 🐛 **Issues:** [GitHub Issues](https://github.com/MuhammadSaif700/Business-Monitor/issues)
- 📧 **Email:** muhammadsaif700@example.com
- 💼 **LinkedIn:** [Connect with me](https://linkedin.com/in/muhammadsaif700)
- 🌐 **GitHub:** [@MuhammadSaif700](https://github.com/MuhammadSaif700)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with these amazing open-source technologies:

- [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast Python web framework
- [React](https://reactjs.org/) - UI library for building interfaces
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Chart.js](https://www.chartjs.org/) - Beautiful, responsive charts
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI capabilities
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL toolkit
- [Pandas](https://pandas.pydata.org/) - Data analysis library
- [Axios](https://axios-http.com/) - HTTP client
- [React Query](https://tanstack.com/query) - Data fetching library

Special thanks to the open-source community for making this possible!

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] Multi-currency support
- [ ] Advanced filtering and search
- [ ] Email reports and notifications
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Advanced permissions system
- [ ] Integration with accounting software
- [ ] Cash flow statement
- [ ] Budget vs Actual comparison
- [ ] Forecasting and predictions
- [ ] Multi-language support
- [ ] API webhooks
- [ ] Audit trail logging

---

<div align="center">

**Made with ❤️ by [MuhammadSaif700](https://github.com/MuhammadSaif700)**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/MuhammadSaif700/Business-Monitor/issues) • [Request Feature](https://github.com/MuhammadSaif700/Business-Monitor/issues)

</div>
