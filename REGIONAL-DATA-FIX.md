# 🚨 Regional Data Not Showing on Production - Quick Fix Guide

## Problem
✅ **Works on localhost** (port 5173) - Regional charts show data  
❌ **Doesn't work on production** (https://business-monitor.netlify.app/) - Regional charts empty

---

## Root Cause
Your **Azure backend has a separate database** from your local machine. When you upload data locally, it only goes to your computer's database, not Azure's.

---

## ✅ Solution (2 minutes)

### **Step 1: Check if Azure has any data**

Open this URL in your browser:
```
https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/debug/database-info
```

**What you'll see:**

**Scenario A - No Data (Most likely):**
```json
{
  "total_data_tables": 0,
  "tables": [],
  "datasets": []
}
```
**→ Solution: Upload data (Step 2 below)**

**Scenario B - Has Data:**
```json
{
  "total_data_tables": 5,
  "datasets": [{
    "has_region": true,
    "has_customer": true,
    "region_summary": [...]
  }]
}
```
**→ Your data is already there! Try hard-refresh (Ctrl+Shift+R)**

---

### **Step 2: Upload your data to production**

1. Go to: **https://business-monitor.netlify.app/**
2. Click **Upload** in the sidebar
3. Upload your CSV file (same one you used locally)
4. Wait for "Upload successful" message
5. Go to **Dashboard**
6. **Hard refresh** your browser:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

✅ **Regional charts should now show data!**

---

## 📋 Your CSV Must Have These Columns

For regional data to work, your CSV needs:

| Column | Required | Description |
|--------|----------|-------------|
| `date` | ✅ | Transaction date (YYYY-MM-DD) |
| `product` | ✅ | Product name |
| `sales` or `amount` | ✅ | Sales amount (number) |
| `region` | ✅ **For regional chart** | Region name (East, West, North, South, etc.) |
| `customer` | ✅ **For customer chart** | Customer name |

**Example CSV:**
```csv
date,product,sales,cost,category,region,customer
2024-01-01,Widget A,1200,600,Electronics,North,Acme Corp
2024-01-02,Widget B,800,400,Home,East,Beta Inc
2024-01-03,Widget C,1500,900,Office,West,Gamma LLC
```

---

## 🔍 Still Not Working? Debug Checklist

### ✅ **1. Check Azure Backend is Running**
Visit: https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/health

Expected: `{"status": "ok"}`

---

### ✅ **2. Check Browser Console**
1. Open browser (F12)
2. Go to **Console** tab
3. Look for errors:
   - ❌ **CORS errors**: Azure CORS misconfigured
   - ❌ **404 errors**: Backend not deployed
   - ❌ **500 errors**: Backend crashed

---

### ✅ **3. Test API Directly**

Open this in browser:
```
https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/ai/query?query=by_region
```

**With data:**
```json
{
  "query": "by_region",
  "data": [
    {"region": "East", "amount": 5000},
    {"region": "West", "amount": 3000}
  ]
}
```

**Without data:**
```json
{
  "query": "by_region",
  "data": [],
  "narrative": ""
}
```

If `data: []`, your Azure database is empty → Upload CSV!

---

## 🗄️ Azure Database Persistence Issue

If data **disappears after Azure restarts**, you need to configure persistent storage:

### **Option 1: Azure File Share (Easy)**
1. Azure Portal → Your App Service
2. **Configuration** → **Path mappings**
3. **New Azure Storage Mount**
4. Create storage account for database files

### **Option 2: Azure SQL Database (Better for production)**
See: `PRODUCTION-TROUBLESHOOTING.md` for full migration guide

---

## 📞 Quick Commands

### **Check local database:**
```bash
cd backend
../.venv/Scripts/python check_db.py
```

### **Check Azure database:**
```
https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/debug/database-info
```

### **List datasets on Azure:**
```
https://business-monitor-api-h0dngcd0e4d2c3dj.centralindia-01.azurewebsites.net/datasets
```

---

## 🎯 TL;DR

1. **Azure database is separate from your local database**
2. **Upload your CSV to production** (https://business-monitor.netlify.app/)
3. **Hard refresh browser** (Ctrl+Shift+R)
4. **Done!** 🎉

---

## 💡 Pro Tips

- **Always upload to production after testing locally**
- **Use Azure SQL Database instead of SQLite for production**
- **Check `/debug/database-info` endpoint to verify data**
- **Your local database has 54 tables, Azure probably has 0**

---

Need more help? Check `PRODUCTION-TROUBLESHOOTING.md` for detailed solutions.
