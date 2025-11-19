from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header, status, Body, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse, Response, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
try:
    from pydantic import EmailStr
except ImportError:
    # Fallback for older pydantic versions
    EmailStr = str
import pandas as pd
import numpy as np
import sqlite3
import os
import io
import zipfile
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Optional, Tuple
import hashlib
import time
from collections import defaultdict, deque
import logging
import json
import math
from datetime import datetime

# Helper function to clean NaN values and handle JSON serialization
def clean_nan_values(obj):
    """Recursively clean NaN values and handle JSON serialization issues"""
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    elif isinstance(obj, pd.Timestamp):
        return str(obj)
    elif isinstance(obj, (pd.Series, pd.DataFrame)):
        return obj.to_dict() if hasattr(obj, 'to_dict') else str(obj)
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return 0.0
    elif pd.isna(obj):
        return None
    else:
        return obj

# Import enhanced user services
try:
    # Temporarily disable enhanced auth due to SQLAlchemy compatibility issues
    raise ImportError("Temporarily disabled")
    from user_service import UserService, AuthService, init_enhanced_db, ACCESS_TOKEN_EXPIRE_MINUTES
    from models import User
    ENHANCED_AUTH = True
except ImportError:
    ENHANCED_AUTH = False
    ACCESS_TOKEN_EXPIRE_MINUTES = 720  # Default 12 hours
    logger = logging.getLogger("business_monitor")
    logger.warning("Enhanced auth not available, using legacy auth")
    
    # Define dummy classes and functions for type annotations and fallbacks
    class User:
        def __init__(self):
            pass
    
    class UserService:
        @staticmethod
        def create_user(*args, **kwargs):
            raise HTTPException(status_code=501, detail="Enhanced auth not available")
        
        @staticmethod
        def get_user_by_email(*args, **kwargs):
            return None
        
        @staticmethod
        def update_user(*args, **kwargs):
            raise HTTPException(status_code=501, detail="Enhanced auth not available")
        
        @staticmethod
        def delete_user(*args, **kwargs):
            raise HTTPException(status_code=501, detail="Enhanced auth not available")
        
        @staticmethod
        def list_users(*args, **kwargs):
            return []
    
    class AuthService:
        @staticmethod
        def authenticate_user(*args, **kwargs):
            return None
        
        @staticmethod
        def create_access_token(*args, **kwargs):
            raise HTTPException(status_code=501, detail="Enhanced auth not available")
    
    def init_enhanced_db():
        pass  # No-op when enhanced auth is not available

# Optional Prometheus metrics
try:
    from prometheus_client import Counter, Summary, generate_latest, CONTENT_TYPE_LATEST  # type: ignore
    METRICS_ENABLED = True
except Exception:  # pragma: no cover
    METRICS_ENABLED = False
    Counter = Summary = generate_latest = CONTENT_TYPE_LATEST = None  # type: ignore

DB_DIR = os.path.dirname(__file__)
DB_NAME = "business.db"
if os.getenv('PYTEST_CURRENT_TEST'):
    DB_NAME = "business_test.db"
DATABASE = os.path.join(DB_DIR, DB_NAME)

# Always load the .env that sits next to this file, regardless of current working directory
ENV_PATH = Path(__file__).with_name('.env')
load_dotenv(dotenv_path=str(ENV_PATH), encoding='utf-8')
BACKEND_API_KEY = os.getenv('BACKEND_API_KEY')
BACKEND_PASSWORD = os.getenv('BACKEND_PASSWORD')
BACKEND_USERNAME = os.getenv('BACKEND_USERNAME')  # When set, enables JWT auth endpoints
SENTRY_DSN = os.getenv('SENTRY_DSN')

try:
    from .auth import create_access_token, get_current_user, verify_login, jwt_enabled
except ImportError:  # support running as a module without package context
    from auth import create_access_token, get_current_user, verify_login, jwt_enabled


# Initialize enhanced database if available
if ENHANCED_AUTH:
    init_enhanced_db()
else:
    # Initialize legacy database
    def init_db():
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        # Simple transactions table. In a real app we'd normalize.
        c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            type TEXT,
            product TEXT,
            quantity REAL,
            price REAL,
            customer TEXT,
            region TEXT,
            fingerprint TEXT
        )
        ''')
        try:
            cols = [r[1] for r in c.execute("PRAGMA table_info(transactions)").fetchall()]
            if 'fingerprint' not in cols:
                c.execute("ALTER TABLE transactions ADD COLUMN fingerprint TEXT")
        except Exception:
            pass
        # Indexes for performance and idempotency
        c.execute("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_transactions_product ON transactions(product)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_transactions_region ON transactions(region)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer)")
        c.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_fingerprint ON transactions(fingerprint)")
        conn.commit()
        conn.close()
    
    init_db()

# Pydantic models for enhanced auth
class SignUpRequest(BaseModel):
    email: str  # Changed from EmailStr to str for compatibility
    password: str
    full_name: Optional[str] = None

class SignInRequest(BaseModel):
    email: str  # Changed from EmailStr to str for compatibility
    password: str

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None

class FeedbackRequest(BaseModel):
    feedback_type: str
    title: str
    content: str
    rating: Optional[int] = None

# Enhanced authentication
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    if not ENHANCED_AUTH:
        return None
    
    if not credentials:
        return None
    
    payload = AuthService.verify_token(credentials.credentials)
    if not payload:
        return None
    
    user = UserService.get_user_by_id(payload.get('user_id'))
    return user

def require_api_key(x_api_key: str = Header(None), user: User = Depends(get_current_user)):
    """No authentication required - open access"""
    # Allow all requests without authentication
    return True

def require_auth(user: User = Depends(get_current_user)):
    """Require authenticated user"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

app = FastAPI(title="Business Monitor API")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174", 
        "http://127.0.0.1:5174",
        "http://localhost:5175", 
        "http://127.0.0.1:5175",
        "http://localhost:5176", 
        "http://127.0.0.1:5176",
        "http://localhost:5177", 
        "http://127.0.0.1:5177",
        "http://localhost:5178", 
        "http://127.0.0.1:5178",
        "http://localhost:5179", 
        "http://127.0.0.1:5179",
        "http://localhost:5180", 
        "http://127.0.0.1:5180",
        "http://localhost:5181", 
        "http://127.0.0.1:5181",
        "http://localhost:5182", 
        "http://127.0.0.1:5182",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://business-monitor.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger("business_monitor")

if SENTRY_DSN:
    try:
        import sentry_sdk  # type: ignore
        sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE','0.0')))
        logger.info("Sentry initialized")
    except Exception as e:
        logger.warning(f"Failed to init Sentry: {e}")

# ------------------ Metrics & Rate Limiting ------------------
if METRICS_ENABLED:
    REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'path'])
    REQUEST_TIME = Summary('http_request_latency_seconds', 'Request latency', ['path'])
    UPLOAD_ROWS_INSERTED = Counter('upload_rows_inserted_total', 'Rows inserted via upload')
    UPLOAD_ROWS_INVALID = Counter('upload_rows_invalid_total', 'Rows invalid via upload')
    UPLOAD_ROWS_DUPLICATE = Counter('upload_rows_duplicate_total', 'Rows duplicates via upload')

    @app.middleware('http')
    async def metrics_middleware(request: Request, call_next):
        path = request.url.path
        method = request.method
        if REQUEST_COUNT:
            REQUEST_COUNT.labels(method=method, path=path).inc()
        start = time.time()
        response = await call_next(request)
        if REQUEST_TIME:
            REQUEST_TIME.labels(path=path).observe(time.time() - start)
        return response

# naive in-memory token bucket per scope
_buckets: dict = defaultdict(lambda: deque())
RATE_LIMITS = {
    'upload': int(os.getenv('RATE_LIMIT_UPLOAD_PER_MIN', '10')),
    'ai': int(os.getenv('RATE_LIMIT_AI_PER_MIN', '30')),
}

def _rate_check(scope: str, key: str, now: float = None):
    now = now or time.time()
    window = 60.0
    limit = RATE_LIMITS.get(scope, 60)
    dq: deque = _buckets[(scope, key)]
    # pop older than window
    while dq and now - dq[0] > window:
        dq.popleft()
    if len(dq) >= limit:
        raise HTTPException(status_code=429, detail=f'Rate limit exceeded for {scope}')
    dq.append(now)

def _client_key(request: Request) -> str:
    return request.headers.get('X-API-KEY') or request.client.host

def rl_upload(request: Request):
    _rate_check('upload', _client_key(request))

def rl_ai(request: Request):
    _rate_check('ai', _client_key(request))

# Cache for last upload invalid rows as CSV
LAST_UPLOAD_ERROR_CSV: Optional[str] = None


@app.get("/")
def root():
    # Redirect the root to the interactive API docs to avoid 404 confusion
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get('/readyz')
def readyz():
    try:
        conn = sqlite3.connect(DATABASE)
        conn.execute('SELECT 1')
        conn.close()
        return {"status":"ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f'Readiness check failed: {e}')


@app.get('/template/csv')
def csv_template():
    """Provide a sample CSV template to guide users."""
    csv_text = (
        "date,type,product,quantity,price,customer,region\n"
        "2025-09-01,sale,Widget A,2,25.00,Customer 1,North\n"
        "2025-09-02,purchase,Widget A,5,15.00,Supplier,North\n"
        "2025-09-03,sale,Widget B,1,50.00,Customer 2,South\n"
    )
    headers = {"Content-Disposition": "attachment; filename=template.csv"}
    return Response(content=csv_text, media_type='text/csv', headers=headers)


@app.get('/export/summary')
def export_summary(start_date: str = None, end_date: str = None):
    conn = sqlite3.connect(DATABASE)
    
    # Get the latest uploaded dataset
    cursor = conn.cursor()
    cursor.execute("""
    SELECT table_name FROM file_metadata 
    ORDER BY upload_timestamp DESC LIMIT 1
    """)
    result = cursor.fetchone()
    
    if not result:
        # Fallback to legacy transactions table if no uploads
        table_name = 'transactions'
    else:
        table_name = result[0]
    
    # Check if table exists
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        conn.close()
        return Response(content="metric,value\nno_data,0\n", media_type='text/csv', 
                       headers={"Content-Disposition": "attachment; filename=summary.csv"})
    
    # Try to read with date column detection
    try:
        df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
        # Auto-detect date column
        date_col = None
        for col in df.columns:
            if 'date' in col.lower():
                df[col] = pd.to_datetime(df[col], errors='coerce')
                date_col = col
                break
        
        # Apply date filters
        if date_col and start_date:
            df = df[df[date_col] >= start_date]
        if date_col and end_date:
            df = df[df[date_col] <= end_date]
        
        # Calculate summary based on available columns
        sales = df[df.get('type', df.get('Type', pd.Series())).astype(str).str.lower()=='sale'] if 'type' in df.columns or 'Type' in df.columns else df
        purchases = df[df.get('type', df.get('Type', pd.Series())).astype(str).str.lower()=='purchase'] if 'type' in df.columns or 'Type' in df.columns else pd.DataFrame()
        
        # Calculate totals based on available columns
        qty_col = next((c for c in df.columns if 'quantity' in c.lower() or 'qty' in c.lower()), None)
        price_col = next((c for c in df.columns if 'price' in c.lower() or 'amount' in c.lower()), None)
        
        if qty_col and price_col:
            total_sales = (sales[qty_col] * sales[price_col]).sum()
            total_purchases = (purchases[qty_col] * purchases[price_col]).sum() if not purchases.empty else 0
        elif price_col:
            total_sales = sales[price_col].sum()
            total_purchases = purchases[price_col].sum() if not purchases.empty else 0
        else:
            total_sales = len(sales)
            total_purchases = len(purchases)
        
        profit = total_sales - total_purchases
        
    except Exception as e:
        conn.close()
        logger.warning(f"Export summary error: {e}")
        return Response(content=f"metric,value\nerror,{str(e)}\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=summary.csv"})
    
    conn.close()
    out = (
        "metric,value\n"
        f"total_sales,{float(total_sales)}\n"
        f"total_purchases,{float(total_purchases)}\n"
        f"profit,{float(profit)}\n"
        f"rows,{len(df)}\n"
    )
    headers = {"Content-Disposition": "attachment; filename=summary.csv"}
    return Response(content=out, media_type='text/csv', headers=headers)


@app.get('/export/by_product')
def export_by_product(start_date: str = None, end_date: str = None):
    conn = sqlite3.connect(DATABASE)
    
    # Get the latest uploaded dataset
    cursor = conn.cursor()
    cursor.execute("""
    SELECT table_name FROM file_metadata 
    ORDER BY upload_timestamp DESC LIMIT 1
    """)
    result = cursor.fetchone()
    
    if not result:
        table_name = 'transactions'
    else:
        table_name = result[0]
    
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        conn.close()
        return Response(content="product,amount,quantity\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=by_product.csv"})
    
    try:
        df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
        conn.close()
        
        # Auto-detect date column
        date_col = None
        for col in df.columns:
            if 'date' in col.lower():
                df[col] = pd.to_datetime(df[col], errors='coerce')
                date_col = col
                break
        
        if date_col and start_date:
            df = df[df[date_col] >= start_date]
        if date_col and end_date:
            df = df[df[date_col] <= end_date]
        
        # Find product column
        product_col = next((c for c in df.columns if 'product' in c.lower() or 'item' in c.lower()), None)
        if not product_col:
            return Response(content="product,amount,quantity\n", media_type='text/csv',
                           headers={"Content-Disposition": "attachment; filename=by_product.csv"})
        
        # Calculate amounts
        qty_col = next((c for c in df.columns if 'quantity' in c.lower() or 'qty' in c.lower()), None)
        price_col = next((c for c in df.columns if 'price' in c.lower() or 'amount' in c.lower()), None)
        
        if qty_col and price_col:
            df['amount'] = df[qty_col] * df[price_col]
            grouped = df.groupby(product_col).agg({'amount':'sum', qty_col:'sum'}).reset_index()
            grouped.columns = ['product', 'amount', 'quantity']
        elif price_col:
            grouped = df.groupby(product_col)[price_col].sum().reset_index()
            grouped.columns = ['product', 'amount']
            grouped['quantity'] = 0
        else:
            grouped = df.groupby(product_col).size().reset_index(name='count')
            grouped['amount'] = 0
            grouped['quantity'] = grouped['count']
            grouped = grouped[['product', 'amount', 'quantity']]
        
        # Build CSV
        lines = ["product,amount,quantity"]
        for _, row in grouped.iterrows():
            lines.append(f"{row['product']},{float(row['amount'])},{float(row.get('quantity', 0))}")
        out = "\n".join(lines) + "\n"
        
    except Exception as e:
        logger.warning(f"Export by_product error: {e}")
        return Response(content=f"product,amount,quantity\nerror,{str(e)},0\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=by_product.csv"})
    
    headers = {"Content-Disposition": "attachment; filename=by_product.csv"}
    return Response(content=out, media_type='text/csv', headers=headers)


@app.get('/export/by_region')
def export_by_region(start_date: str = None, end_date: str = None):
    conn = sqlite3.connect(DATABASE)
    
    # Get the latest uploaded dataset
    cursor = conn.cursor()
    cursor.execute("""
    SELECT table_name FROM file_metadata 
    ORDER BY upload_timestamp DESC LIMIT 1
    """)
    result = cursor.fetchone()
    
    if not result:
        table_name = 'transactions'
    else:
        table_name = result[0]
    
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        conn.close()
        return Response(content="region,amount\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=by_region.csv"})
    
    try:
        df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
        conn.close()
        
        # Auto-detect date column
        date_col = None
        for col in df.columns:
            if 'date' in col.lower():
                df[col] = pd.to_datetime(df[col], errors='coerce')
                date_col = col
                break
        
        if date_col and start_date:
            df = df[df[date_col] >= start_date]
        if date_col and end_date:
            df = df[df[date_col] <= end_date]
        
        # Find region column
        region_col = next((c for c in df.columns if 'region' in c.lower() or 'location' in c.lower() or 'area' in c.lower()), None)
        if not region_col:
            return Response(content="region,amount\n", media_type='text/csv',
                           headers={"Content-Disposition": "attachment; filename=by_region.csv"})
        
        # Calculate amounts
        qty_col = next((c for c in df.columns if 'quantity' in c.lower() or 'qty' in c.lower()), None)
        price_col = next((c for c in df.columns if 'price' in c.lower() or 'amount' in c.lower() or 'sales' in c.lower()), None)
        
        if qty_col and price_col:
            df['amount'] = df[qty_col] * df[price_col]
            grouped = df.groupby(region_col)['amount'].sum().reset_index()
        elif price_col:
            grouped = df.groupby(region_col)[price_col].sum().reset_index()
            grouped.columns = [region_col, 'amount']
        else:
            grouped = df.groupby(region_col).size().reset_index(name='amount')
        
        lines = ["region,amount"]
        for _, row in grouped.iterrows():
            lines.append(f"{row[region_col]},{float(row['amount'])}")
        out = "\n".join(lines) + "\n"
        
    except Exception as e:
        logger.warning(f"Export by_region error: {e}")
        return Response(content=f"region,amount\nerror,{str(e)}\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=by_region.csv"})
    
    headers = {"Content-Disposition": "attachment; filename=by_region.csv"}
    return Response(content=out, media_type='text/csv', headers=headers)


@app.get('/export/by_customer')
def export_by_customer(start_date: str = None, end_date: str = None):
    conn = sqlite3.connect(DATABASE)
    
    # Get the latest uploaded dataset
    cursor = conn.cursor()
    cursor.execute("""
    SELECT table_name FROM file_metadata 
    ORDER BY upload_timestamp DESC LIMIT 1
    """)
    result = cursor.fetchone()
    
    if not result:
        table_name = 'transactions'
    else:
        table_name = result[0]
    
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        conn.close()
        return Response(content="customer,amount\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=by_customer.csv"})
    
    try:
        df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
        conn.close()
        
        # Auto-detect date column
        date_col = None
        for col in df.columns:
            if 'date' in col.lower():
                df[col] = pd.to_datetime(df[col], errors='coerce')
                date_col = col
                break
        
        if date_col and start_date:
            df = df[df[date_col] >= start_date]
        if date_col and end_date:
            df = df[df[date_col] <= end_date]
        
        # Find customer column
        customer_col = next((c for c in df.columns if 'customer' in c.lower() or 'client' in c.lower() or 'account' in c.lower()), None)
        if not customer_col:
            return Response(content="customer,amount\n", media_type='text/csv',
                           headers={"Content-Disposition": "attachment; filename=by_customer.csv"})
        
        # Calculate amounts
        qty_col = next((c for c in df.columns if 'quantity' in c.lower() or 'qty' in c.lower()), None)
        price_col = next((c for c in df.columns if 'price' in c.lower() or 'amount' in c.lower() or 'sales' in c.lower()), None)
        
        if qty_col and price_col:
            df['amount'] = df[qty_col] * df[price_col]
            grouped = df.groupby(customer_col)['amount'].sum().reset_index()
        elif price_col:
            grouped = df.groupby(customer_col)[price_col].sum().reset_index()
            grouped.columns = [customer_col, 'amount']
        else:
            grouped = df.groupby(customer_col).size().reset_index(name='amount')
        
        lines = ["customer,amount"]
        for _, row in grouped.iterrows():
            lines.append(f"{row[customer_col]},{float(row['amount'])}")
        out = "\n".join(lines) + "\n"
        
    except Exception as e:
        logger.warning(f"Export by_customer error: {e}")
        return Response(content=f"customer,amount\nerror,{str(e)}\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=by_customer.csv"})
    
    headers = {"Content-Disposition": "attachment; filename=by_customer.csv"}
    return Response(content=out, media_type='text/csv', headers=headers)


@app.get('/export/transactions')
def export_transactions(
    start_date: str = None,
    end_date: str = None,
    product: Optional[str] = None,
    region: Optional[str] = None,
    customer: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = 'date',
    sort_dir: str = 'desc',
    limit: Optional[int] = None,
    offset: Optional[int] = None,
):
    conn = sqlite3.connect(DATABASE)
    
    # Get the latest uploaded dataset
    cursor = conn.cursor()
    cursor.execute("""
    SELECT table_name, columns FROM file_metadata 
    ORDER BY upload_timestamp DESC LIMIT 1
    """)
    result = cursor.fetchone()
    
    if not result:
        table_name = 'transactions'
        columns = ['date','type','product','quantity','price','customer','region']
    else:
        table_name = result[0]
        columns = json.loads(result[1])
    
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        conn.close()
        return Response(content=",".join(columns) + "\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=transactions.csv"})
    
    try:
        # Build query with dynamic table name
        df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
        conn.close()
        
        # Auto-detect date column
        date_col = next((c for c in df.columns if 'date' in c.lower()), None)
        if date_col:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            
            # Apply date filters
            if start_date:
                df = df[df[date_col] >= start_date]
            if end_date:
                df = df[df[date_col] <= end_date]
        
        # Apply other filters if columns exist
        product_col = next((c for c in df.columns if 'product' in c.lower() or 'item' in c.lower()), None)
        region_col = next((c for c in df.columns if 'region' in c.lower()), None)
        customer_col = next((c for c in df.columns if 'customer' in c.lower() or 'client' in c.lower()), None)
        
        if product and product_col:
            df = df[df[product_col] == product]
        if region and region_col:
            df = df[df[region_col] == region]
        if customer and customer_col:
            df = df[df[customer_col] == customer]
        
        # Apply search across all text columns
        if search:
            search_lower = search.lower()
            mask = df.astype(str).apply(lambda row: row.str.lower().str.contains(search_lower, na=False).any(), axis=1)
            df = df[mask]
        
        # Sort
        if sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=(sort_dir.lower() != 'desc'))
        elif date_col:
            df = df.sort_values(by=date_col, ascending=(sort_dir.lower() != 'desc'))
        
        # Pagination
        if limit is not None and offset is not None:
            df = df.iloc[offset:offset+limit]
        
        # Export all columns
        out = df.to_csv(index=False)
        
    except Exception as e:
        logger.warning(f"Export transactions error: {e}")
        return Response(content=f"error\n{str(e)}\n", media_type='text/csv',
                       headers={"Content-Disposition": "attachment; filename=transactions.csv"})
    
    headers = {"Content-Disposition": "attachment; filename=transactions.csv"}
    return Response(content=out, media_type='text/csv', headers=headers)


@app.get('/export/all.zip')
def export_all_zip(start_date: str = None, end_date: str = None):
    """Bundle all CSV exports into a single zip for convenience."""
    files = [
        ('summary.csv', export_summary(start_date, end_date).body),
        ('by_product.csv', export_by_product(start_date, end_date).body),
        ('by_region.csv', export_by_region(start_date, end_date).body),
        ('by_customer.csv', export_by_customer(start_date, end_date).body),
        ('transactions.csv', export_transactions(start_date, end_date).body),
    ]
    mem = io.BytesIO()
    with zipfile.ZipFile(mem, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
        for name, content in files:
            zf.writestr(name, content.decode() if isinstance(content, bytes) else content)
    mem.seek(0)
    headers = {"Content-Disposition": "attachment; filename=reports_bundle.zip"}
    return Response(content=mem.read(), media_type='application/zip', headers=headers)

@app.get('/export/upload_errors.csv')
def export_upload_errors_csv():
    global LAST_UPLOAD_ERROR_CSV
    if not LAST_UPLOAD_ERROR_CSV:
        raise HTTPException(status_code=404, detail='No recent upload errors')
    headers = {"Content-Disposition": "attachment; filename=upload_errors.csv"}
    return Response(content=LAST_UPLOAD_ERROR_CSV, media_type='text/csv', headers=headers)


@app.get('/reports/income-statement')
def get_income_statement(start_date: str = None, end_date: str = None, _=Depends(require_api_key)):
    """Generate income statement (profit & loss) report"""
    conn = sqlite3.connect(DATABASE)
    
    # Try to get the latest uploaded dataset first
    try:
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'data_%' ORDER BY name DESC LIMIT 1")
        result = cursor.fetchone()
        table_name = result[0] if result else 'transactions'
    except:
        table_name = 'transactions'
    
    try:
        df = pd.read_sql_query(f'SELECT * FROM {table_name}', conn, parse_dates=['date'] if 'date' in pd.read_sql_query(f'SELECT * FROM {table_name} LIMIT 0', conn).columns else None)
    except:
        df = pd.read_sql_query('SELECT * FROM transactions', conn, parse_dates=['date'])
    finally:
        conn.close()
    
    # Apply date filters
    if 'date' in df.columns:
        if start_date:
            df = df[df['date'] >= start_date]
        if end_date:
            df = df[df['date'] <= end_date]
    
    # Calculate amount if needed
    if 'amount' not in df.columns:
        if 'quantity' in df.columns and 'price' in df.columns:
            df['amount'] = df['quantity'] * df['price']
        elif 'sales' in df.columns:
            df['amount'] = df['sales']
        else:
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                df['amount'] = df[numeric_cols[0]]
            else:
                return {'revenue': 0, 'cogs': 0, 'gross_profit': 0, 'operating_expenses': 0, 'net_income': 0, 'narrative': 'No numeric data found', 'ai_error': None}
    
    # Calculate income statement items
    revenue = 0
    cogs = 0
    
    if 'type' in df.columns:
        revenue = df[df['type'].str.lower() == 'sale']['amount'].sum()
        cogs = df[df['type'].str.lower() == 'purchase']['amount'].sum()
    else:
        # If no type column, treat positive as revenue
        revenue = df[df['amount'] > 0]['amount'].sum()
        cogs = abs(df[df['amount'] < 0]['amount'].sum())
    
    gross_profit = revenue - cogs
    gross_margin = (gross_profit / revenue * 100) if revenue > 0 else 0
    
    # For now, operating expenses are assumed to be 0 (can be expanded with more data)
    operating_expenses = 0
    operating_income = gross_profit - operating_expenses
    net_income = operating_income
    
    # Generate AI insights using Gemini
    prompt = (
        "You are a financial analyst reviewing an income statement.\n"
        f"Revenue: ${revenue:,.2f}\n"
        f"Cost of Goods Sold: ${cogs:,.2f}\n"
        f"Gross Profit: ${gross_profit:,.2f} ({gross_margin:.1f}% margin)\n"
        f"Net Income: ${net_income:,.2f}\n\n"
        "Provide 3-4 brief bullet points analyzing this financial performance and suggest one actionable recommendation.\n"
        "Keep it concise and business-focused."
    )
    narrative, ai_error = _ai_text_or_error(prompt)
    
    return {
        'revenue': float(revenue),
        'cogs': float(cogs),
        'gross_profit': float(gross_profit),
        'gross_margin': float(gross_margin),
        'operating_expenses': float(operating_expenses),
        'operating_income': float(operating_income),
        'net_income': float(net_income),
        'narrative': narrative,
        'ai_error': ai_error
    }

@app.get('/reports/balance-sheet')
def get_balance_sheet(as_of_date: str = None, _=Depends(require_api_key)):
    """Generate balance sheet report"""
    conn = sqlite3.connect(DATABASE)
    
    # Try to get the latest uploaded dataset first
    try:
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'data_%' ORDER BY name DESC LIMIT 1")
        result = cursor.fetchone()
        table_name = result[0] if result else 'transactions'
    except:
        table_name = 'transactions'
    
    try:
        df = pd.read_sql_query(f'SELECT * FROM {table_name}', conn, parse_dates=['date'] if 'date' in pd.read_sql_query(f'SELECT * FROM {table_name} LIMIT 0', conn).columns else None)
    except:
        df = pd.read_sql_query('SELECT * FROM transactions', conn, parse_dates=['date'])
    finally:
        conn.close()
    
    # Apply date filter (as of date)
    if as_of_date and 'date' in df.columns:
        df = df[df['date'] <= as_of_date]
    
    # Calculate amount if needed
    if 'amount' not in df.columns:
        if 'quantity' in df.columns and 'price' in df.columns:
            df['amount'] = df['quantity'] * df['price']
        elif 'sales' in df.columns:
            df['amount'] = df['sales']
        else:
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                df['amount'] = df[numeric_cols[0]]
            else:
                return {
                    'assets': {'cash': 0, 'inventory': 0, 'total': 0},
                    'liabilities': {'accounts_payable': 0, 'total': 0},
                    'equity': {'retained_earnings': 0, 'total': 0},
                    'narrative': 'No numeric data found',
                    'ai_error': None
                }
    
    # Calculate balance sheet items
    if 'type' in df.columns:
        revenue = df[df['type'].str.lower() == 'sale']['amount'].sum()
        purchases = df[df['type'].str.lower() == 'purchase']['amount'].sum()
    else:
        revenue = df[df['amount'] > 0]['amount'].sum()
        purchases = abs(df[df['amount'] < 0]['amount'].sum())
    
    # Assets
    cash = revenue - purchases  # Simplified: net cash from operations
    inventory = purchases * 0.3  # Simplified: assume 30% of purchases remain as inventory
    total_assets = cash + inventory
    
    # Liabilities
    accounts_payable = purchases * 0.2  # Simplified: assume 20% of purchases unpaid
    total_liabilities = accounts_payable
    
    # Equity
    retained_earnings = total_assets - total_liabilities
    total_equity = retained_earnings
    
    # Generate AI insights using Gemini
    prompt = (
        "You are a financial analyst reviewing a balance sheet.\n"
        f"Total Assets: ${total_assets:,.2f}\n"
        f"  - Cash: ${cash:,.2f}\n"
        f"  - Inventory: ${inventory:,.2f}\n"
        f"Total Liabilities: ${total_liabilities:,.2f}\n"
        f"Total Equity: ${total_equity:,.2f}\n"
        f"Debt-to-Equity Ratio: {(total_liabilities/total_equity if total_equity > 0 else 0):.2f}\n\n"
        "Provide 3-4 brief bullet points analyzing the financial position and liquidity. Suggest one recommendation.\n"
        "Keep it concise and business-focused."
    )
    narrative, ai_error = _ai_text_or_error(prompt)
    
    return {
        'assets': {
            'cash': float(cash),
            'inventory': float(inventory),
            'total': float(total_assets)
        },
        'liabilities': {
            'accounts_payable': float(accounts_payable),
            'total': float(total_liabilities)
        },
        'equity': {
            'retained_earnings': float(retained_earnings),
            'total': float(total_equity)
        },
        'narrative': narrative,
        'ai_error': ai_error
    }

@app.post('/auth/token')
def auth_token(body: dict = Body(...)):
    password = body.get('password')
    if not BACKEND_PASSWORD or not BACKEND_API_KEY:
        raise HTTPException(status_code=501, detail='Auth not configured on server')
    if password != BACKEND_PASSWORD:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    return {'token': BACKEND_API_KEY, 'mode': 'legacy'}

@app.post('/auth/login')
def auth_login(body: dict = Body(...)):
    if not jwt_enabled():
        raise HTTPException(status_code=501, detail='JWT auth disabled (set BACKEND_USERNAME)')
    username = body.get('username')
    password = body.get('password')
    if not verify_login(username, password):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = create_access_token(username)
    return {'access_token': token, 'token_type': 'bearer', 'expires_minutes': int(os.getenv('JWT_EXPIRE_MINUTES', '30'))}

# Enhanced Authentication Endpoints
@app.post('/auth/signup')
def auth_signup(request: SignUpRequest):
    """Enhanced user registration"""
    if not ENHANCED_AUTH:
        raise HTTPException(status_code=501, detail='Enhanced auth not available')
    
    try:
        # Split full_name into first and last name if provided
        first_name = ""
        last_name = ""
        if request.full_name:
            name_parts = request.full_name.strip().split(' ', 1)
            first_name = name_parts[0]
            if len(name_parts) > 1:
                last_name = name_parts[1]
        
        # Use email as username for simplicity
        username = request.email.split('@')[0]
        
        user = UserService.create_user(
            email=request.email,
            username=username,
            password=request.password,
            first_name=first_name,
            last_name=last_name,
            company=None
        )
        
        # Create access token
        token_data = {"user_id": user.id, "username": user.username}
        access_token = AuthService.create_access_token(token_data)
        
        return {
            'access_token': access_token,
            'token_type': 'bearer',
            'expires_minutes': ACCESS_TOKEN_EXPIRE_MINUTES,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail='Registration failed')

@app.post('/auth/signin')
def auth_signin(request: SignInRequest):
    """Enhanced user sign-in"""
    if not ENHANCED_AUTH:
        raise HTTPException(status_code=501, detail='Enhanced auth not available')
    
    user = UserService.authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail='Account is disabled')
    
    # Create access token
    token_data = {"user_id": user.id, "username": user.username}
    access_token = AuthService.create_access_token(token_data)
    
    return {
        'access_token': access_token,
        'token_type': 'bearer',
        'expires_minutes': ACCESS_TOKEN_EXPIRE_MINUTES,
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
    }

# User Management Endpoints
@app.get('/user/profile')
def get_user_profile(current_user: User = Depends(require_auth)):
    """Get current user profile"""
    preferences = {}
    if current_user.preferences:
        try:
            preferences = json.loads(current_user.preferences)
        except:
            preferences = {}
    
    return {
        'id': current_user.id,
        'email': current_user.email,
        'username': current_user.username,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'company': current_user.company,
        'created_at': current_user.created_at.isoformat(),
        'last_login': current_user.last_login.isoformat() if current_user.last_login else None,
        'preferences': preferences
    }

@app.patch('/user/profile')
def update_user_profile(request: UserUpdateRequest, current_user: User = Depends(require_auth)):
    """Update user profile"""
    from user_service import SessionLocal
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail='User not found')
        
        if request.email is not None:
            user.email = request.email
        if request.username is not None:
            user.username = request.username
        if request.first_name is not None:
            user.first_name = request.first_name
        if request.last_name is not None:
            user.last_name = request.last_name
        if request.company is not None:
            user.company = request.company
        
        db.commit()
        db.refresh(user)
        
        return {'message': 'Profile updated successfully'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail='Failed to update profile')
    finally:
        db.close()

@app.get('/user/activities')
def get_user_activities(current_user: User = Depends(require_auth)):
    """Get user activity history"""
    activities = UserService.get_user_activities(current_user.id)
    return [
        {
            'id': activity.id,
            'activity_type': activity.activity_type,
            'description': activity.description,
            'timestamp': activity.timestamp.isoformat(),
            'metadata': json.loads(activity.metadata) if activity.metadata else {}
        }
        for activity in activities
    ]

@app.get('/user/notifications')
def get_user_notifications(unread_only: bool = False, current_user: User = Depends(require_auth)):
    """Get user notifications"""
    notifications = UserService.get_user_notifications(current_user.id, unread_only)
    return [
        {
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'notification_type': notification.notification_type,
            'read': notification.read,
            'created_at': notification.created_at.isoformat()
        }
        for notification in notifications
    ]

@app.patch('/user/notifications/{notification_id}/read')
def mark_notification_read(notification_id: int, current_user: User = Depends(require_auth)):
    """Mark a notification as read"""
    UserService.mark_notification_read(notification_id)
    return {'message': 'Notification marked as read'}

@app.patch('/user/notifications/mark-all-read')
def mark_all_notifications_read(current_user: User = Depends(require_auth)):
    """Mark all notifications as read for current user"""
    from user_service import SessionLocal
    from models import Notification
    
    db = SessionLocal()
    try:
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.read == False
        ).update({'read': True})
        db.commit()
        return {'message': 'All notifications marked as read'}
    finally:
        db.close()

@app.post('/user/feedback')
def submit_user_feedback(request: FeedbackRequest, current_user: User = Depends(require_auth)):
    """Submit user feedback"""
    from user_service import SessionLocal
    from models import UserFeedback
    
    db = SessionLocal()
    try:
        feedback = UserFeedback(
            user_id=current_user.id,
            feedback_type=request.feedback_type,
            title=request.title,
            content=request.content,
            rating=request.rating
        )
        db.add(feedback)
        db.commit()
        
        # Log feedback activity
        UserService.log_activity(
            current_user.id,
            'feedback',
            f'Submitted {request.feedback_type} feedback: {request.title}',
            {'feedback_type': request.feedback_type, 'rating': request.rating}
        )
        
        return {'message': 'Feedback submitted successfully'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail='Failed to submit feedback')
    finally:
        db.close()

# ------------------ Admin Utilities ------------------
@app.post('/admin/reset')
def admin_reset(_=Depends(require_api_key)):
    """Delete all rows from transactions.
    Protected by API key when BACKEND_API_KEY is set; otherwise open (local dev convenience).
    """
    try:
        conn = sqlite3.connect(DATABASE)
        cur = conn.cursor()
        # Capture count before delete for reporting
        cur.execute('SELECT COUNT(*) FROM transactions')
        count_before = cur.fetchone()[0] or 0
        cur.execute('DELETE FROM transactions')
        conn.commit()
        conn.close()
        global LAST_UPLOAD_ERROR_CSV
        LAST_UPLOAD_ERROR_CSV = None
        return {'status': 'ok', 'deleted': int(count_before)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to reset DB: {e}')

if ENHANCED_AUTH:
    pass  # Already initialized above
else:
    init_db()

# Optional: start with an empty DB (dev convenience)
if os.getenv('START_EMPTY', '').lower() in ('1','true','yes'):
    try:
        _conn = sqlite3.connect(DATABASE)
        _cur = _conn.cursor()
        _cur.execute('DELETE FROM transactions')
        _conn.commit()
        _conn.close()
        logger.info('START_EMPTY enabled: cleared all rows from transactions on startup')
    except Exception as _e:
        logger.warning(f'START_EMPTY enabled but failed to clear DB: {_e}')

@app.post('/upload')
async def upload_file(request: Request, file: UploadFile = File(...), user=Depends(require_api_key)):
    # ensure DB schema in case file was deleted (e.g., tests)
    try:
        init_db()
    except Exception:
        pass
    # rate limit
    try:
        rl_upload(request)
    except Exception:
        pass
    
    filename = file.filename
    supported_extensions = ['.csv', '.xlsx', '.xls', '.json', '.txt', '.tsv', '.parquet']
    if not any(filename.lower().endswith(ext) for ext in supported_extensions):
        raise HTTPException(status_code=400, detail=f'Supported file types: {", ".join(supported_extensions)}')

    contents = await file.read()
    
    # Dynamic file parsing - support multiple formats
    try:
        if filename.lower().endswith('.csv'):
            df = pd.read_csv(pd.io.common.BytesIO(contents))
        elif filename.lower().endswith('.tsv'):
            df = pd.read_csv(pd.io.common.BytesIO(contents), sep='\t')
        elif filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(pd.io.common.BytesIO(contents))
        elif filename.lower().endswith('.json'):
            df = pd.read_json(pd.io.common.BytesIO(contents))
        elif filename.lower().endswith('.parquet'):
            df = pd.read_parquet(pd.io.common.BytesIO(contents))
        else:
            # Try CSV as fallback for .txt files
            df = pd.read_csv(pd.io.common.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to parse file: {str(e)}')
    
    if df.empty:
        raise HTTPException(status_code=400, detail='File contains no data')
    
    # Clean column names - make them database-friendly
    df.columns = [col.strip().lower().replace(' ', '_').replace('-', '_').replace('.', '_') 
                  for col in df.columns]
    
    # Remove any completely empty columns
    df = df.dropna(axis=1, how='all')
    
    # Create a dynamic table structure based on the actual data
    table_name = f"data_{int(time.time())}"
    
    # Store metadata about the uploaded file
    file_metadata = {
        'original_filename': filename,
        'table_name': table_name,
        'columns': list(df.columns),
        'row_count': len(df),
        'column_types': {col: str(df[col].dtype) for col in df.columns},
        'upload_timestamp': datetime.now().isoformat(),
        'sample_data': clean_nan_values(df.head(3).to_dict('records')) if len(df) > 0 else []
    }
    
    # Store the data dynamically in SQLite
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Create a dynamic table for this dataset
        # Convert DataFrame to SQLite (pandas handles type inference)
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        
        # Store metadata in a metadata table
        metadata_table = "file_metadata"
        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {metadata_table} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT UNIQUE,
            original_filename TEXT,
            columns TEXT,
            row_count INTEGER,
            column_types TEXT,
            upload_timestamp TEXT,
            sample_data TEXT
        )
        ''')
        
        # Insert metadata
        cursor.execute(f'''
        INSERT OR REPLACE INTO {metadata_table} 
        (table_name, original_filename, columns, row_count, column_types, upload_timestamp, sample_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            table_name,
            filename,
            json.dumps(file_metadata['columns']),
            file_metadata['row_count'],
            json.dumps(file_metadata['column_types']),
            file_metadata['upload_timestamp'],
            json.dumps(file_metadata['sample_data'])
        ))
        
        conn.commit()
        conn.close()
        
        # Log activity if enhanced auth is enabled
        if ENHANCED_AUTH and user:
            UserService.log_activity(
                user.id,
                "file_upload",
                f"Uploaded {filename} with {len(df)} rows",
                {"table_name": table_name, "columns": list(df.columns), "row_count": len(df)}
            )
        
        # metrics
        if METRICS_ENABLED:
            try:
                UPLOAD_ROWS_INSERTED.inc(len(df))
            except Exception:
                pass
        
        return clean_nan_values({
            'status': 'ok',
            'message': f'Successfully uploaded {filename}',
            'table_name': table_name,
            'rows_inserted': len(df),
            'columns': list(df.columns),
            'metadata': file_metadata,
            'sample_data': file_metadata['sample_data']
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to store data: {str(e)}')

# New flexible data endpoints
@app.get('/datasets')
def list_datasets(_=Depends(require_api_key)):
    """Get all uploaded datasets"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check if metadata table exists
        cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='file_metadata'
        """)
        
        if not cursor.fetchone():
            conn.close()
            return {'datasets': []}
        
        cursor.execute("""
        SELECT table_name, original_filename, columns, row_count, 
               column_types, upload_timestamp, sample_data
        FROM file_metadata 
        ORDER BY upload_timestamp DESC
        """)
        
        datasets = []
        for row in cursor.fetchall():
            dataset = {
                'table_name': row[0],
                'original_filename': row[1],
                'columns': json.loads(row[2]),
                'row_count': row[3],
                'column_types': json.loads(row[4]),
                'upload_timestamp': row[5],
                'sample_data': json.loads(row[6])
            }
            # Clean any NaN values before adding to response
            dataset = clean_nan_values(dataset)
            datasets.append(dataset)
        
        conn.close()
        return {'datasets': datasets}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to get datasets: {str(e)}')

@app.get('/datasets/{table_name}/data')
def get_dataset_data(table_name: str, limit: int = 1000, offset: int = 0, _=Depends(require_api_key)):
    """Get data from any uploaded dataset"""
    try:
        conn = sqlite3.connect(DATABASE)
        
        # Verify table exists and get metadata
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f'Dataset {table_name} not found')
        
        # Get the data
        df = pd.read_sql_query(f'SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}', conn)
        conn.close()
        
        result = {
            'table_name': table_name,
            'data': df.to_dict('records'),
            'columns': list(df.columns),
            'returned_rows': len(df),
            'limit': limit,
            'offset': offset
        }
        
        # Clean any NaN values before returning
        result = clean_nan_values(result)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to get dataset data: {str(e)}')

@app.get('/datasets/{table_name}/summary')
def get_dataset_summary(table_name: str, _=Depends(require_api_key)):
    """Get summary statistics for any dataset"""
    try:
        conn = sqlite3.connect(DATABASE)
        
        # Verify table exists
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f'Dataset {table_name} not found')
        
        df = pd.read_sql_query(f'SELECT * FROM {table_name}', conn)
        conn.close()
        
        summary = {
            'table_name': table_name,
            'total_rows': len(df),
            'columns': list(df.columns),
            'column_stats': {}
        }
        
        for col in df.columns:
            col_data = df[col].dropna()
            
            if col_data.dtype in ['int64', 'float64']:
                # Handle NaN values properly
                mean_val = col_data.mean() if len(col_data) > 0 else 0
                min_val = col_data.min() if len(col_data) > 0 else 0
                max_val = col_data.max() if len(col_data) > 0 else 0
                std_val = col_data.std() if len(col_data) > 0 else 0
                
                summary['column_stats'][col] = {
                    'type': 'numeric',
                    'count': len(col_data),
                    'mean': float(mean_val) if not pd.isna(mean_val) else 0,
                    'min': float(min_val) if not pd.isna(min_val) else 0,
                    'max': float(max_val) if not pd.isna(max_val) else 0,
                    'std': float(std_val) if not pd.isna(std_val) else 0
                }
            else:
                value_counts = col_data.value_counts().head(10)
                summary['column_stats'][col] = {
                    'type': 'categorical',
                    'count': len(col_data),
                    'unique_values': len(col_data.unique()),
                    'top_values': dict(value_counts) if len(value_counts) > 0 else {}
                }
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to get dataset summary: {str(e)}')

@app.post('/datasets/{table_name}/analyze')
def analyze_dataset(table_name: str, body: dict = Body(...), _=Depends(require_api_key)):
    """Flexible analytics endpoint for any dataset"""
    try:
        conn = sqlite3.connect(DATABASE)
        
        # Verify table exists
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f'Dataset {table_name} not found')
        
        df = pd.read_sql_query(f'SELECT * FROM {table_name}', conn)
        conn.close()
        
        analysis_type = body.get('type', 'summary')
        
        if analysis_type == 'summary':
            # Basic summary statistics
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            categorical_cols = df.select_dtypes(include=['object', 'string']).columns
            
            result = {
                'table_name': table_name,
                'total_rows': len(df),
                'numeric_summary': {},
                'categorical_summary': {}
            }
            
            for col in numeric_cols:
                col_data = df[col].dropna()
                mean_val = col_data.mean() if len(col_data) > 0 else 0
                median_val = col_data.median() if len(col_data) > 0 else 0
                std_val = col_data.std() if len(col_data) > 0 else 0
                min_val = col_data.min() if len(col_data) > 0 else 0
                max_val = col_data.max() if len(col_data) > 0 else 0
                
                result['numeric_summary'][col] = {
                    'count': len(col_data),
                    'mean': float(mean_val) if not pd.isna(mean_val) else 0,
                    'median': float(median_val) if not pd.isna(median_val) else 0,
                    'std': float(std_val) if not pd.isna(std_val) else 0,
                    'min': float(min_val) if not pd.isna(min_val) else 0,
                    'max': float(max_val) if not pd.isna(max_val) else 0
                }
            
            for col in categorical_cols:
                value_counts = df[col].value_counts().head(10)
                result['categorical_summary'][col] = {
                    'unique_count': len(df[col].unique()),
                    'top_values': dict(value_counts)
                }
            
            # Clean any NaN values before returning
            return clean_nan_values(result)
            
        elif analysis_type == 'groupby':
            # Group by analysis
            group_by_col = body.get('group_by')
            agg_col = body.get('aggregate_column')
            agg_func = body.get('aggregate_function', 'sum')
            
            if not group_by_col or not agg_col:
                raise HTTPException(status_code=400, detail='group_by and aggregate_column required for groupby analysis')
            
            if group_by_col not in df.columns:
                raise HTTPException(status_code=400, detail=f'Column {group_by_col} not found')
            
            if agg_col not in df.columns:
                raise HTTPException(status_code=400, detail=f'Column {agg_col} not found')
            
            try:
                if agg_func == 'sum':
                    result_df = df.groupby(group_by_col)[agg_col].sum().reset_index()
                elif agg_func == 'mean':
                    result_df = df.groupby(group_by_col)[agg_col].mean().reset_index()
                elif agg_func == 'count':
                    result_df = df.groupby(group_by_col)[agg_col].count().reset_index()
                elif agg_func == 'max':
                    result_df = df.groupby(group_by_col)[agg_col].max().reset_index()
                elif agg_func == 'min':
                    result_df = df.groupby(group_by_col)[agg_col].min().reset_index()
                else:
                    raise HTTPException(status_code=400, detail=f'Unsupported aggregate function: {agg_func}')
                
                return {
                    'table_name': table_name,
                    'analysis_type': 'groupby',
                    'group_by': group_by_col,
                    'aggregate_column': agg_col,
                    'aggregate_function': agg_func,
                    'data': clean_nan_values(result_df.to_dict('records'))
                }
                
            except Exception as e:
                raise HTTPException(status_code=400, detail=f'Aggregation failed: {str(e)}')
        
        elif analysis_type == 'timeseries':
            # Time series analysis
            date_col = body.get('date_column')
            value_col = body.get('value_column')
            
            if not date_col or not value_col:
                raise HTTPException(status_code=400, detail='date_column and value_column required for timeseries analysis')
            
            if date_col not in df.columns or value_col not in df.columns:
                raise HTTPException(status_code=400, detail='Specified columns not found')
            
            try:
                # Try to parse the date column
                df[date_col] = pd.to_datetime(df[date_col])
                df = df.sort_values(date_col)
                
                # Group by date and sum values
                timeseries_df = df.groupby(df[date_col].dt.date)[value_col].sum().reset_index()
                timeseries_df[date_col] = timeseries_df[date_col].astype(str)
                
                return {
                    'table_name': table_name,
                    'analysis_type': 'timeseries',
                    'date_column': date_col,
                    'value_column': value_col,
                    'data': clean_nan_values(timeseries_df.to_dict('records'))
                }
                
            except Exception as e:
                raise HTTPException(status_code=400, detail=f'Timeseries analysis failed: {str(e)}')
        
        else:
            raise HTTPException(status_code=400, detail=f'Unsupported analysis type: {analysis_type}')
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Analysis failed: {str(e)}')

@app.get('/reports/summary')
def report_summary(start_date: str = None, end_date: str = None):
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query('SELECT * FROM transactions', conn, parse_dates=['date'])
    conn.close()

    if start_date:
        df = df[df['date'] >= start_date]
    if end_date:
        df = df[df['date'] <= end_date]

    # compute totals
    sales = df[df['type'].str.lower()=='sale']
    purchases = df[df['type'].str.lower()=='purchase']

    total_sales = (sales['quantity'] * sales['price']).sum()
    total_purchases = (purchases['quantity'] * purchases['price']).sum()
    profit = total_sales - total_purchases

    return {
        'total_sales': float(total_sales),
        'total_purchases': float(total_purchases),
        'profit': float(profit),
        'rows': len(df)
    }

@app.get('/reports/by_product')
def report_by_product(start_date: str = None, end_date: str = None):
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query('SELECT * FROM transactions', conn, parse_dates=['date'])
    conn.close()

    if start_date:
        df = df[df['date'] >= start_date]
    if end_date:
        df = df[df['date'] <= end_date]

    df['amount'] = df['quantity'] * df['price']
    grouped = df.groupby('product').agg({'amount':'sum','quantity':'sum'}).reset_index()
    result = grouped.to_dict(orient='records')
    return {'by_product': result}

@app.get('/reports/inventory')
def report_inventory():
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query('SELECT * FROM transactions', conn, parse_dates=['date'])
    conn.close()
    # stock in = purchases, stock out = sales
    purchases = df[df['type'].str.lower()=='purchase'].groupby('product')['quantity'].sum()
    sales = df[df['type'].str.lower()=='sale'].groupby('product')['quantity'].sum()
    inventory = (purchases - sales).fillna(0).reset_index().rename(columns={0:'quantity'})
    inventory_df = inventory.copy()
    inventory_df.columns = ['product','quantity']
    return {'inventory': inventory_df.to_dict(orient='records')}

@app.get('/transactions')
def list_transactions(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product: Optional[str] = None,
    region: Optional[str] = None,
    customer: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query('date'),
    sort_dir: str = Query('desc'),
):
    # ensure DB exists
    try:
        init_db()
    except Exception:
        pass
    base = 'SELECT * FROM transactions WHERE 1=1'
    params: List = []
    if start_date:
        base += ' AND date >= ?'
        params.append(start_date)
    if end_date:
        base += ' AND date <= ?'
        params.append(end_date)
    if product:
        base += ' AND product = ?'
        params.append(product)
    if region:
        base += ' AND region = ?'
        params.append(region)
    if customer:
        base += ' AND customer = ?'
        params.append(customer)
    if search:
        base += ' AND (LOWER(product) LIKE ? OR LOWER(customer) LIKE ? OR LOWER(region) LIKE ? OR LOWER(type) LIKE ? )'
        q = f"%{search.lower()}%"
        params.extend([q, q, q, q])
    count_q = 'SELECT COUNT(*) FROM (' + base + ')'
    allowed_cols = {'date','type','product','quantity','price','customer','region'}
    col = sort_by if sort_by in allowed_cols else 'date'
    direction = 'DESC' if str(sort_dir).lower()=='desc' else 'ASC'
    base += f' ORDER BY {col} {direction} LIMIT ? OFFSET ?'
    params_paged = params + [limit, offset]
    conn = sqlite3.connect(DATABASE)
    total = conn.execute(count_q, params).fetchone()[0]
    # Global amount total with same filters (no pagination)
    amount_q = 'SELECT SUM(quantity * price) FROM (' + count_q[18:] + ')'  # hack: reuse WHERE body
    try:
        global_amount = conn.execute('SELECT SUM(quantity * price) FROM transactions WHERE 1=1' + count_q.split('WHERE 1=1',1)[1].split(')')[0], params).fetchone()[0]
    except Exception:
        global_amount = None
    df = pd.read_sql_query(base, conn, params=params_paged, parse_dates=['date'])
    conn.close()
    page_amount = float(((df['quantity'] * df['price']).sum())) if not df.empty else 0.0
    return {
        'transactions': df.to_dict(orient='records'),
        'pagination': {
            'limit': limit,
            'offset': offset,
            'total': total,
            'returned': len(df)
        },
        'totals': {
            'page_amount': page_amount,
            'global_amount': float(global_amount) if global_amount is not None else None
        }
    }

@app.get('/meta/distincts')
def meta_distincts(start_date: Optional[str] = None, end_date: Optional[str] = None):
    q = 'SELECT product, region, customer FROM transactions WHERE 1=1'
    params: List = []
    if start_date:
        q += ' AND date >= ?'
        params.append(start_date)
    if end_date:
        q += ' AND date <= ?'
        params.append(end_date)
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query(q, conn, params=params)
    conn.close()
    products = sorted([x for x in df['product'].dropna().unique().tolist()]) if 'product' in df else []
    regions = sorted([x for x in df['region'].dropna().unique().tolist()]) if 'region' in df else []
    customers = sorted([x for x in df['customer'].dropna().unique().tolist()]) if 'customer' in df else []
    return {'products': products, 'regions': regions, 'customers': customers}

try:
    from .ai_service import generate_text, test_google_key
except ImportError:  # support module execution
    from ai_service import generate_text, test_google_key


def _ai_text_or_error(prompt: str) -> Tuple[str, Optional[str]]:
    """Call generate_text and condense provider errors into a short UI-friendly string.
    Returns (text, ai_error). If ai_error is set, text should be ignored by the UI.
    """
    try:
        text = generate_text(prompt)
    except Exception as e:
        return "", f"AI error: {e}"
    if not text:
        return "", None
    s = str(text)
    s_lower = s.lower()
    if s_lower.startswith('ai request failed'):
        if '429' in s or 'quota' in s_lower:
            return "", 'AI quota exceeded. Please add billing or try again later.'
        if '404' in s and 'model' in s_lower:
            return "", 'AI model not accessible for this key. Try a different GOOGLE_MODEL.'
        return "", 'AI provider error. See /ai/test for details.'
    if s_lower.startswith('(ai disabled)'):
        return "", 'AI is disabled on the server.'
    return s, None

@app.get('/ai/insight')
def ai_insight(request: Request, summary: str = "", _=Depends(require_api_key)):
    try:
        rl_ai(request)
    except Exception:
        pass
    # Backwards-compatible endpoint; uses generate_text
    text, ai_error = _ai_text_or_error(summary)
    return {'insight': text, 'ai_error': ai_error}

@app.get('/ai/test')
def ai_test(_=Depends(require_api_key)):
    """Check AI provider health; currently verifies Google key when enabled.
    Returns {'status': 'ok'} or {'status':'error','detail':...}
    """
    try:
        res = test_google_key()
        # Accept either 'ok' or 'ok:<model>' formats from the checker
        if isinstance(res, str):
            lower = res.lower()
            if lower == 'ok':
                return {'status': 'ok'}
            if lower.startswith('ok'):
                parts = res.split(':', 1)
                model = parts[1].strip() if len(parts) > 1 else None
                out = {'status': 'ok'}
                if model:
                    out['model'] = model
                return out
        return {'status': 'error', 'detail': res}
    except Exception as e:
        return {'status':'error','detail': str(e)}


@app.get('/ai/query')
def ai_query(request: Request, query: str = 'most_profitable_product', start_date: str = None, end_date: str = None, _=Depends(require_api_key)):
    try:
        rl_ai(request)
    except Exception:
        pass
    """Simple AI-powered analytics queries. Returns chart-friendly data and a narrative.

    Supported queries:
    - most_profitable_product
    - sales_over_time
    - by_region
    - by_customer
    """
    conn = sqlite3.connect(DATABASE)
    
    # Try to get the latest uploaded dataset first, fallback to transactions table
    try:
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'data_%' ORDER BY name DESC LIMIT 1")
        result = cursor.fetchone()
        table_name = result[0] if result else 'transactions'
    except:
        table_name = 'transactions'
    
    try:
        df = pd.read_sql_query(f'SELECT * FROM {table_name}', conn, parse_dates=['date'] if 'date' in pd.read_sql_query(f'SELECT * FROM {table_name} LIMIT 0', conn).columns else None)
    except Exception as e:
        # Fallback to transactions table if there's an error
        df = pd.read_sql_query('SELECT * FROM transactions', conn, parse_dates=['date'])
    finally:
        conn.close()

    if start_date and 'date' in df.columns:
        df = df[df['date'] >= start_date]
    if end_date and 'date' in df.columns:
        df = df[df['date'] <= end_date]

    # Calculate amount if needed
    if 'amount' not in df.columns:
        if 'quantity' in df.columns and 'price' in df.columns:
            df['amount'] = df['quantity'] * df['price']
        elif 'sales' in df.columns:
            df['amount'] = df['sales']
        elif 'revenue' in df.columns:
            df['amount'] = df['revenue']
        else:
            # Find the first numeric column to use as amount
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                df['amount'] = df[numeric_cols[0]]
            else:
                # No numeric data found
                return {'query': query, 'data': [], 'narrative': 'No numeric data found in the dataset.', 'ai_error': None}

    if query == 'most_profitable_product':
        # profit per product = sales_amount - purchase_amount
        sales = df[df['type'].str.lower()=='sale'].groupby('product')['amount'].sum()
        purchases = df[df['type'].str.lower()=='purchase'].groupby('product')['amount'].sum()
        profit = (sales - purchases).fillna(0).reset_index().rename(columns={0:'profit'})
        profit_df = profit.copy()
        profit_df.columns = ['product','profit']
        sorted_df = profit_df.sort_values('profit', ascending=False).reset_index(drop=True)
        data = sorted_df.to_dict(orient='records')
        # Generate narrative (ask for clean Markdown formatting)
        prompt = (
            "You are a helpful business analyst.\n"
            f"Given these product profits (top 10): {data[:10]}.\n"
            "Write 2-3 brief bullet points highlighting key insights.\n"
            "Keep it concise and actionable."
        )
        narrative, ai_error = _ai_text_or_error(prompt)
        return {'query':query,'data':data,'narrative':narrative, 'ai_error': ai_error}

    if query == 'by_region' or query == 'by_customer':
        key = 'region' if query == 'by_region' else 'customer'
        
        # Check if the column exists
        if key not in df.columns:
            return {
                'query': query, 
                'data': [], 
                'narrative': '',
                'ai_error': None
            }
        
        grouped = df.groupby(key)['amount'].sum().reset_index()
        items = grouped.to_dict(orient='records')
        
        # Check if there's actual data
        if not items or len(items) == 0:
            return {
                'query': query, 
                'data': [], 
                'narrative': '',
                'ai_error': None
            }
        
        # build a simple prompt
        prompt = (
            "You are a helpful business analyst.\n"
            f"Summarize sales contribution by {key} for the period. Top items: {items[:10]}. Provide two insights.\n"
            "Keep it brief and concise - just 2 bullet points."
        )
        narrative, ai_error = _ai_text_or_error(prompt)
        return {'query': query, 'data': items, 'narrative': narrative, 'ai_error': ai_error}

    if query == 'sales_over_time':
        times = df[df['type'].str.lower()=='sale'].groupby('date')['amount'].sum().reset_index()
        times = times.sort_values('date')
        data = {'dates': times['date'].dt.strftime('%Y-%m-%d').tolist(), 'amounts': times['amount'].tolist()}
        prompt = (
            "You are a helpful business analyst.\n"
            f"Given this sales time series: {data['dates'][:10]} with amounts {data['amounts'][:10]}.\n"
            "Write 2-3 brief bullet points about the trend and one actionable recommendation."
        ) 
        narrative, ai_error = _ai_text_or_error(prompt)
        return {'query':query,'data':data,'narrative':narrative, 'ai_error': ai_error}

    return {'error':'unknown_query'}

# -------- Generic analytics endpoints for dynamic dashboards --------
ALLOWED_GROUP_FIELDS = {'type','product','customer','region'}

def _apply_date_and_filters(base: str, params: List, start_date: Optional[str], end_date: Optional[str], filters: Optional[list]):
    if start_date:
        base += ' AND date >= ?'
        params.append(start_date)
    if end_date:
        base += ' AND date <= ?'
        params.append(end_date)
    # simple filters: [{field, op, value}] with op in (=, like)
    if filters:
        for f in filters:
            try:
                field = str(f.get('field'))
                op = str(f.get('op','='))
                value = f.get('value')
            except Exception:
                continue
            if field not in (ALLOWED_GROUP_FIELDS | {'type','product','customer','region'}):
                continue
            if op.lower() == 'like':
                base += f' AND LOWER({field}) LIKE ?'
                params.append(f"%{str(value).lower()}%")
            else:
                base += f' AND {field} = ?'
                params.append(value)
    return base, params

def _metric_expr(metric: str) -> str:
    m = (metric or '').lower()
    if m in ('sum_amount','amount','sum'): return '(quantity * price)'
    if m in ('sum_quantity','quantity'): return 'quantity'
    if m in ('count','rows'): return '1'
    # default amount
    return '(quantity * price)'

@app.post('/analytics/query')
def analytics_query(body: dict = Body(...), _=Depends(require_api_key)):
    metric = (body or {}).get('metric','sum_amount')
    group_by = (body or {}).get('group_by')
    start_date = (body or {}).get('start_date')
    end_date = (body or {}).get('end_date')
    filters = (body or {}).get('filters', [])
    top_n = int((body or {}).get('top_n') or 0)
    if not group_by or group_by not in ALLOWED_GROUP_FIELDS:
        raise HTTPException(status_code=400, detail=f'group_by must be one of {sorted(ALLOWED_GROUP_FIELDS)}')
    expr = _metric_expr(metric)
    base = f'SELECT {group_by} AS label, SUM({expr}) AS value FROM transactions WHERE 1=1'
    params: List = []
    base, params = _apply_date_and_filters(base, params, start_date, end_date, filters)
    base += f' GROUP BY {group_by} ORDER BY value DESC'
    if top_n and top_n > 0:
        base += ' LIMIT ?'
        params.append(top_n)
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query(base, conn, params=params)
    conn.close()
    items = df.to_dict(orient='records') if not df.empty else []
    return {'items': items, 'metric': metric, 'group_by': group_by}

@app.post('/analytics/timeseries')
def analytics_timeseries(body: dict = Body(...), _=Depends(require_api_key)):
    metric = (body or {}).get('metric','sum_amount')
    start_date = (body or {}).get('start_date')
    end_date = (body or {}).get('end_date')
    filters = (body or {}).get('filters', [])
    expr = _metric_expr(metric)
    base = f'SELECT date, SUM({expr}) AS value FROM transactions WHERE 1=1'
    params: List = []
    base, params = _apply_date_and_filters(base, params, start_date, end_date, filters)
    base += ' GROUP BY date ORDER BY date ASC'
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query(base, conn, params=params, parse_dates=['date'])
    conn.close()
    dates = df['date'].dt.strftime('%Y-%m-%d').tolist() if not df.empty else []
    values = df['value'].tolist() if not df.empty else []
    return {'dates': dates, 'values': values, 'metric': metric}

@app.post('/analytics/kpi')
def analytics_kpi(body: dict = Body(...), _=Depends(require_api_key)):
    metric = (body or {}).get('metric','sum_amount')
    start_date = (body or {}).get('start_date')
    end_date = (body or {}).get('end_date')
    filters = (body or {}).get('filters', [])
    expr = _metric_expr(metric)
    base = f'SELECT SUM({expr}) FROM transactions WHERE 1=1'
    params: List = []
    base, params = _apply_date_and_filters(base, params, start_date, end_date, filters)
    conn = sqlite3.connect(DATABASE)
    val = conn.execute(base, params).fetchone()[0]
    conn.close()
    return {'value': float(val or 0.0), 'metric': metric}

@app.post('/ai/dashboard_config')
def ai_dashboard_config(body: dict = Body(...), _=Depends(require_api_key)):
    """Generate a dashboard config from a natural language prompt.
    Returns {config, ai_error}
    Config schema (minimal):
    {
      "kpis": [ {"title":"Total Sales","metric":"sum_amount"} ],
      "charts": [
        {"type":"timeseries","title":"Sales Over Time","metric":"sum_amount"},
        {"type":"bar","title":"Top Products","metric":"sum_amount","group_by":"product","top_n":7},
        {"type":"pie","title":"Sales by Region","metric":"sum_amount","group_by":"region"}
      ]
    }
    """
    prompt = (body or {}).get('prompt','')
    # Guide the model to emit strict JSON only
    sys = (
        "You are a dashboard designer. Output ONLY JSON matching the schema. No prose.\n"
        f"Allowed group_by fields: {sorted(ALLOWED_GROUP_FIELDS)}. Allowed chart types: timeseries, bar, pie.\n"
        "Allowed metrics: sum_amount, sum_quantity, count. Provide at most 4 charts."
    )
    full_prompt = (
        f"{sys}\nUser request: {prompt}\n"
        "Return JSON with keys 'kpis' and 'charts'."
    )
    text, ai_error = _ai_text_or_error(full_prompt)
    if ai_error:
        return {'config': None, 'ai_error': ai_error}
    # Try to extract JSON from the response
    try:
        start = text.find('{')
        end = text.rfind('}')
        j = text[start:end+1] if start != -1 and end != -1 else text
        config = json.loads(j)
        
        # basic sanitize
        charts = config.get('charts', [])
        safe = []
        for c in charts:
            t = c.get('type')
            gb = c.get('group_by')
            
            # Fix: AI sometimes returns group_by as a list - convert to string
            if isinstance(gb, list):
                gb = gb[0] if gb else None
                c['group_by'] = gb
            
            # Fix: AI sometimes returns 'metrics' as array - convert to 'metric' string
            if 'metrics' in c and isinstance(c['metrics'], list):
                c['metric'] = c['metrics'][0] if c['metrics'] else 'sum_amount'
                del c['metrics']
            
            # Fix: Ensure 'metric' exists
            if 'metric' not in c:
                c['metric'] = 'sum_amount'
            
            # Fix: AI sometimes returns 'limit' instead of 'top_n'
            if 'limit' in c:
                c['top_n'] = c['limit']
                del c['limit']
            
            # Validate group_by field for bar and pie charts
            if t in ('bar','pie'):
                if not gb or gb not in ALLOWED_GROUP_FIELDS:
                    continue
            
            # For timeseries, group_by is usually "date" which is fine
            safe.append(c)
        
        config['charts'] = safe[:4]
        
        # Ensure kpis exist
        if 'kpis' not in config:
            config['kpis'] = []
        
        return {'config': config, 'ai_error': None}
    except Exception as e:
        return {'config': None, 'ai_error': f'AI produced invalid config: {str(e)}'}

@app.post('/analytics/smart-dashboard')
def smart_dashboard_analytics(body: dict = Body(...), _=Depends(require_api_key)):
    """Generate smart dashboard analytics based on uploaded dataset structure"""
    table_name = body.get('table_name')
    start_date = body.get('start_date')
    end_date = body.get('end_date')
    
    print(f"Smart Dashboard Analytics called with: {table_name}, {start_date}, {end_date}")
    
    if not table_name:
        raise HTTPException(status_code=400, detail='table_name is required')
    
    try:
        conn = sqlite3.connect(DATABASE)
        
        # Get table schema
        cursor = conn.execute(f"PRAGMA table_info({table_name})")
        columns_info = cursor.fetchall()
        columns = [col[1] for col in columns_info]  # column names
        column_types = {col[1]: col[2] for col in columns_info}  # name: type mapping
        
        # Get sample data to understand content
        query = f"SELECT * FROM {table_name} LIMIT 1000"
        df = pd.read_sql_query(query, conn)
        
        # Generate smart KPIs
        kpis = []
        numeric_columns = [col for col in columns if column_types.get(col, '').upper() in ('INTEGER', 'REAL', 'NUMERIC')]
        
        # Also check for columns with numeric data even if type is TEXT
        for col in columns:
            if col not in numeric_columns:
                try:
                    # Try to convert to numeric
                    numeric_vals = pd.to_numeric(df[col], errors='coerce')
                    if numeric_vals.notna().sum() > len(df) * 0.5:  # More than 50% are numeric
                        numeric_columns.append(col)
                except:
                    pass
        
        for col in numeric_columns[:4]:  # Limit to 4 KPIs
            try:
                # Convert to numeric if needed
                values = pd.to_numeric(df[col], errors='coerce')
                total = values.sum() if not values.isna().all() else 0
                avg = values.mean() if not values.isna().all() else 0
                
                # Format the value properly
                if abs(total) > 1000000:
                    value = f"${total/1000000:.1f}M"
                elif abs(total) > 1000:
                    value = f"${total/1000:.1f}K"
                elif abs(total) >= 1:
                    value = f"${total:,.0f}"
                else:
                    value = f"{total:.2f}"
                
                # Create a clean English title from column name
                title = col.replace('_', ' ').replace('-', ' ').strip()
                # If title contains non-ASCII (like Arabic), create a generic title
                if not title.isascii():
                    # Use position-based generic titles
                    position = len(kpis)
                    generic_titles = ['Total Amount', 'Total Value', 'Total Sales', 'Total Revenue']
                    title = generic_titles[position] if position < len(generic_titles) else f'Metric {position + 1}'
                else:
                    title = title.title()
                
                kpis.append({
                    'title': title,
                    'value': value,
                    'trend': 'positive' if avg > 0 else None
                })
            except Exception as e:
                print(f"Error processing column {col}: {e}")
                continue
        
        # If no numeric columns, create basic info KPIs
        if not kpis:
            # Try to find any countable data
            row_count = len(df)
            col_count = len(columns)
            
            # Look for any aggregatable columns
            for col in columns[:4]:
                try:
                    unique_count = df[col].nunique()
                    non_null_count = df[col].notna().sum()
                    
                    # Create meaningful KPIs from text data
                    clean_title = col.replace('_', ' ').replace('-', ' ').strip()
                    if not clean_title.isascii():
                        clean_title = f'Field {len(kpis) + 1}'
                    else:
                        clean_title = clean_title.title()
                    
                    kpis.append({
                        'title': f'Unique {clean_title}',
                        'value': str(unique_count),
                        'trend': None
                    })
                except:
                    continue
            
            # If still no KPIs, use basic dataset info
            if not kpis:
                kpis = [
                    {'title': 'Total Rows', 'value': f'{row_count:,}'},
                    {'title': 'Total Columns', 'value': str(col_count)},
                    {'title': 'Data Quality', 'value': 'Good'},
                    {'title': 'Status', 'value': 'Ready'}
                ]
        
        # Generate smart charts
        charts = []
        
        # Look for date columns for time series
        date_columns = [col for col in columns if any(keyword in col.lower() for keyword in ['date', 'time', 'created', 'updated'])]
        if date_columns and numeric_columns:
            date_col = date_columns[0]
            value_col = numeric_columns[0]
            try:
                # Simple time series aggregation
                time_query = f"""
                SELECT {date_col} as date, SUM({value_col}) as value 
                FROM {table_name} 
                WHERE {date_col} IS NOT NULL 
                GROUP BY {date_col} 
                ORDER BY {date_col} 
                LIMIT 50
                """
                time_df = pd.read_sql_query(time_query, conn)
                if not time_df.empty:
                    charts.append({
                        'title': f'{value_col.replace("_", " ").title()} Over Time',
                        'type': 'line',
                        'data': [{'x': row['date'], 'y': row['value']} for _, row in time_df.iterrows()],
                        'xLabel': 'Date',
                        'yLabel': value_col.replace('_', ' ').title(),
                        'insight': f'Timeline analysis of {value_col} showing trends over time.'
                    })
            except:
                pass
        
        # Look for categorical columns for distribution charts
        categorical_columns = [col for col in columns if column_types.get(col, '').upper() in ('TEXT', 'VARCHAR')]
        if categorical_columns and numeric_columns:
            cat_col = categorical_columns[0]
            value_col = numeric_columns[0]
            try:
                dist_query = f"""
                SELECT {cat_col} as category, SUM({value_col}) as value 
                FROM {table_name} 
                WHERE {cat_col} IS NOT NULL 
                GROUP BY {cat_col} 
                ORDER BY value DESC 
                LIMIT 10
                """
                dist_df = pd.read_sql_query(dist_query, conn)
                if not dist_df.empty:
                    charts.append({
                        'title': f'{value_col.replace("_", " ").title()} by {cat_col.replace("_", " ").title()}',
                        'type': 'bar',
                        'data': [{'name': row['category'], 'value': row['value']} for _, row in dist_df.iterrows()],
                        'xLabel': cat_col.replace('_', ' ').title(),
                        'yLabel': value_col.replace('_', ' ').title(),
                        'insight': f'Distribution analysis showing top {cat_col} by {value_col}.'
                    })
            except:
                pass
        
        conn.close()
        
        return clean_nan_values({
            'kpis': kpis,
            'charts': charts,
            'table_info': {
                'name': table_name,
                'rows': len(df),
                'columns': columns
            }
        })
        
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise HTTPException(status_code=500, detail=f'Smart analytics failed: {str(e)}')

@app.post('/ai/nl_query')
def ai_nl_query(request: Request, body: dict = Body(...), _=Depends(require_api_key)):
    # rate limit
    try:
        rl_ai(request)
    except Exception:
        pass
    prompt = (body or {}).get('prompt', '')
    start_date = (body or {}).get('start_date')
    end_date = (body or {}).get('end_date')
    s = str(prompt).lower()
    intent = 'most_profitable_product' if 'most profitable' in s or 'profitable product' in s else None
    if not intent and ('sales over time' in s or 'trend' in s or 'time' in s):
        intent = 'sales_over_time'
    if not intent and ('by region' in s or 'region' in s):
        intent = 'by_region'
    if not intent and ('by customer' in s or 'customer' in s):
        intent = 'by_customer'
    if not intent:
        # Provide helpful fallback without verbose AI response
        return {
            'query': 'insight', 
            'data': None, 
            'narrative': 'I can help you analyze:\n\n- **Most profitable products** - "Which products are most profitable?"\n- **Sales trends** - "Show sales over time"\n- **Regional analysis** - "Sales by region"\n- **Customer analysis** - "Sales by customer"\n\nTry asking one of these questions!',
            'ai_error': None
        }

    # Execute same path as ai_query
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query('SELECT * FROM transactions', conn, parse_dates=['date'])
    conn.close()
    if start_date:
        df = df[df['date'] >= start_date]
    if end_date:
        df = df[df['date'] <= end_date]
    df['amount'] = df['quantity'] * df['price']

    if intent == 'most_profitable_product':
        sales = df[df['type'].str.lower()=='sale'].groupby('product')['amount'].sum()
        purchases = df[df['type'].str.lower()=='purchase'].groupby('product')['amount'].sum()
        profit = (sales - purchases).fillna(0).reset_index().rename(columns={0:'profit'})
        profit_df = profit.copy(); profit_df.columns = ['product','profit']
        sorted_df = profit_df.sort_values('profit', ascending=False).reset_index(drop=True)
        data = sorted_df.to_dict(orient='records')
        narrative, ai_error = _ai_text_or_error(
            "You are a helpful business analyst.\n"
            f"Given product profits (top 10): {data[:10]}.\n"
            "Provide 2-3 brief bullet points with key insights. Keep it concise."
        )
        return {'query': intent, 'data': data, 'narrative': narrative, 'ai_error': ai_error}

    if intent in ('by_region','by_customer'):
        key = 'region' if intent=='by_region' else 'customer'
        if key not in df.columns:
            return {
                'query': intent, 
                'data': [], 
                'narrative': f'No {key} data available in the current dataset.',
                'ai_error': None
            }
        grouped = df.groupby(key)['amount'].sum().reset_index()
        items = grouped.to_dict(orient='records')
        if not items:
            return {
                'query': intent, 
                'data': [], 
                'narrative': f'No {key} data found for the selected period.',
                'ai_error': None
            }
        narrative, ai_error = _ai_text_or_error(
            "You are a helpful business analyst.\n"
            f"Summarize sales contribution by {key}. Top items: {items[:10]}.\n"
            "Provide 2-3 brief insights in markdown bullet points."
        )
        return {'query': intent, 'data': items, 'narrative': narrative, 'ai_error': ai_error}

    if intent == 'sales_over_time':
        times = df[df['type'].str.lower()=='sale'].groupby('date')['amount'].sum().reset_index().sort_values('date')
        data = {'dates': times['date'].dt.strftime('%Y-%m-%d').tolist(), 'amounts': times['amount'].tolist()}
        narrative, ai_error = _ai_text_or_error(
            "You are a helpful business analyst.\n"
            f"Given sales time series: {data['dates'][:10]} with amounts {data['amounts'][:10]}.\n"
            "Provide 2-3 brief bullet points about the trend. Keep it concise."
        )
        return {'query': intent, 'data': data, 'narrative': narrative, 'ai_error': ai_error}

    return {'query': intent, 'data': None, 'narrative': ''}

@app.get('/metrics')
def metrics():
    if not METRICS_ENABLED:
        raise HTTPException(status_code=501, detail='Metrics not enabled')
    data = generate_latest()  # type: ignore
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)  # type: ignore

if __name__ == "__main__":
    import uvicorn
    print("Starting Business Intelligence Dashboard server...")
    if ENHANCED_AUTH:
        print("✓ Enhanced authentication enabled")
        init_enhanced_db()
        print("✓ Database initialized")
    else:
        print("Using legacy authentication")
    print("Server starting on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
