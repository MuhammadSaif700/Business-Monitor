# Production Regional Data Troubleshooting Guide

## Issue: Regional Data Not Showing on Netlify Production

### Root Cause
Your **Azure backend uses a separate database** from your local development environment. The SQLite `business.db` file on Azure is either:
1. **Empty** (no data uploaded yet)
2. **Not persisting** between deployments
3. **Missing required columns** (region, customer, etc.)

---

## ✅ Solution Steps

### **Step 1: Verify Azure Backend is Running**

Visit this URL in your browser:
```
https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/health
```

✅ Expected response: `{"status": "ok", ...}`  
❌ If it fails: Your Azure backend is down

---

### **Step 2: Check What Data Exists on Azure**

Visit:
```
https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/datasets
```

**What to look for:**
- ✅ **If you see datasets listed**: Azure has data, continue to Step 3
- ❌ **If `datasets: []` (empty)**: No data uploaded yet → Go to Step 4

---

### **Step 3: Check Dataset Structure**

If datasets exist, check one:
```
https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/datasets/data_XXXXXXXXXX/data?limit=5
```
(Replace `data_XXXXXXXXXX` with actual table name from `/datasets`)

**Check if these columns exist:**
- ✅ `region` - Required for regional chart
- ✅ `customer` - Required for customer chart
- ✅ `sales` or `amount` - Required for values

❌ **If columns are missing**: Your CSV doesn't have the required structure

---

### **Step 4: Upload Data to Production** ⭐ **Most Common Fix**

1. Go to: **https://business-monitor.netlify.app/**
2. Click **Upload** in the sidebar
3. Upload the **same CSV file** you used locally
4. Wait for success message
5. Go to **Dashboard** → Regional data should now appear! 🎉

---

## 🗄️ Azure Database Persistence Issue

If data disappears after Azure restarts, it's because **SQLite files in Azure App Service don't persist** by default.

### **Quick Fix: Use Azure File Share (Recommended)**

1. Go to **Azure Portal** → Your App Service
2. Navigate to **Configuration** → **Path mappings**
3. Add a **New Azure Storage Mount**:
   - **Name**: `database`
   - **Type**: Azure Files
   - **Storage account**: Create a new storage account
   - **Share name**: `businessdb`
   - **Mount path**: `/home/data`

4. Update your backend to use the persistent path:

In `app.py`, change:
```python
DATABASE = os.getenv('DATABASE', 'business.db')
```

To:
```python
DATABASE = os.getenv('DATABASE', '/home/data/business.db')
```

5. Set environment variable in Azure:
   - **Configuration** → **Application settings**
   - Add: `DATABASE=/home/data/business.db`

---

## 🔄 Better Solution: Use Azure SQL Database

For production, SQLite isn't ideal. Migrate to Azure SQL Database:

### **1. Create Azure SQL Database**
```bash
az sql server create --name business-monitor-sql --resource-group your-rg --location centralindia --admin-user sqladmin --admin-password YourPassword123!

az sql db create --resource-group your-rg --server business-monitor-sql --name businessdb --service-objective S0
```

### **2. Update Backend Code**

Install dependencies:
```bash
pip install pyodbc sqlalchemy
```

Update `app.py`:
```python
import os
from sqlalchemy import create_engine

# Database configuration
if os.getenv('ENVIRONMENT') == 'production':
    # Azure SQL Database
    DB_SERVER = os.getenv('DB_SERVER', 'business-monitor-sql.database.windows.net')
    DB_NAME = os.getenv('DB_NAME', 'businessdb')
    DB_USER = os.getenv('DB_USER', 'sqladmin')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    
    connection_string = f'mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{DB_NAME}?driver=ODBC+Driver+18+for+SQL+Server'
    engine = create_engine(connection_string)
else:
    # Local SQLite
    DATABASE = 'business.db'
```

### **3. Set Azure Environment Variables**
- `ENVIRONMENT=production`
- `DB_SERVER=business-monitor-sql.database.windows.net`
- `DB_NAME=businessdb`
- `DB_USER=sqladmin`
- `DB_PASSWORD=YourSecurePassword123!`

---

## 🧪 Debug Endpoint

Add this to your `app.py` for quick diagnostics:

```python
@app.get('/debug/database-info')
def debug_database_info():
    """Debug endpoint to check database state"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Get all data tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'data_%' ORDER BY name DESC")
        tables = [row[0] for row in cursor.fetchall()]
        
        info = {
            'database_path': DATABASE,
            'database_exists': os.path.exists(DATABASE),
            'total_data_tables': len(tables),
            'tables': tables[:10],  # Show first 10
            'datasets': []
        }
        
        # Check each table's structure
        for table in tables[:3]:  # Check first 3
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            
            info['datasets'].append({
                'table': table,
                'columns': columns,
                'row_count': row_count,
                'has_region': 'region' in columns,
                'has_customer': 'customer' in columns
            })
        
        conn.close()
        return info
    except Exception as e:
        return {'error': str(e), 'database_path': DATABASE}
```

Then visit: `https://your-azure-url.azurewebsites.net/debug/database-info`

---

## 📊 CSV File Requirements

Your CSV must have these columns for regional charts to work:

**Required columns:**
- `date` - Transaction date
- `product` - Product name
- `sales` or `amount` - Sales amount (numeric)
- `region` - Region name (Central, East, North, South, etc.)
- `customer` - Customer name

**Example CSV structure:**
```csv
date,product,sales,cost,category,region,customer
2024-01-01,Product A,1000,600,Electronics,East,Customer 1
2024-01-02,Product B,1500,900,Home,West,Customer 2
```

---

## 🚀 Quick Checklist

- [ ] Azure backend is running (check `/health`)
- [ ] Check if datasets exist on Azure (check `/datasets`)
- [ ] Upload CSV file to production site
- [ ] CSV has `region` and `customer` columns
- [ ] Azure database is persisting (check after restart)
- [ ] Environment variables are set correctly
- [ ] CORS allows Netlify origin

---

## 🔍 Still Not Working?

1. **Check Browser Console** (F12):
   - Look for CORS errors
   - Check network requests to Azure backend
   - Verify API responses

2. **Check Azure Logs**:
   - Azure Portal → App Service → Log stream
   - Look for Python errors or database issues

3. **Test API directly**:
   ```bash
   curl https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/ai/query?query=by_region
   ```

   Expected response (with data):
   ```json
   {
     "query": "by_region",
     "data": [
       {"region": "East", "amount": 5000},
       {"region": "West", "amount": 3000}
     ],
     "narrative": "..."
   }
   ```

   Expected response (no data):
   ```json
   {
     "query": "by_region",
     "data": [],
     "narrative": ""
   }
   ```

---

## 💡 Pro Tip

After uploading data to production, **hard refresh** your browser:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

This clears cached API responses that might show old empty data.
