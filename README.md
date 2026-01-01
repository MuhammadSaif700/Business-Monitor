# Business Monitor

## Overview

Business Monitor is a platform designed to help you track
your business activities through comprehensive reporting and
dashboard analytics features. It provides a user-friendly dashboard
to monitor your business operations and offers predictions and
support using advanced AI technology.Business Monitor assists you
in preparing your income statement and balance sheet, while
also displaying your transactions for better financial
clarity.

## Features

- Dashboards for your business activities
- Multiple Chart of data
- Profit Analysis using AI technology
- Smart Data Export
- Multi-dataset Management
- Income Statement for your business
- Balance Sheet of your business

## Getting Started

### Prerequisites

Ensure you have:

- Node.js & npm
- Python
- Docker

### Installation & Startup

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


# Activate virtual environment (Linux/Mac)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Step 3: Start Backend**

```bash
# Windows
cd backend
& ..\\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload

# Linux/Mac
cd backend
uvicorn app:app --host 127.0.0.1 --port 8000 --reload

# Backend runs on http://localhost:8000
```

**Step 4: Setup Frontend**

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend runs on http://localhost:5173
```

Open http://localhost:5173 in your browser

## Tech stack

- HTML
- CSS
- JS
- Node
- React
- python

## Contributing

Feel free to contribute

## License

This project is licensed under the MIT License.

**Track your Business.**
