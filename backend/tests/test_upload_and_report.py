import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend folder is on sys.path so tests can import app
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app import app, DATABASE

client = TestClient(app)

def setup_module(module):
    # Ensure a fresh database for tests
    if os.path.exists(DATABASE):
        os.remove(DATABASE)

def test_upload_and_summary():
    path = os.path.join(os.path.dirname(__file__), 'sample_transactions.csv')
    with open(path, 'rb') as f:
        resp = client.post('/upload', files={'file': ('sample_transactions.csv', f, 'text/csv')})
    assert resp.status_code == 200
    data = resp.json()
    assert data['status'] == 'ok'
    assert data['rows'] == 5

    # fetch summary
    resp2 = client.get('/reports/summary')
    assert resp2.status_code == 200
    s = resp2.json()
    # total sales amount: Beef sales: (10*20) + (5*22) = 200 + 110 = 310; Chicken sale: 8*10 = 80 => total_sales = 390
    assert abs(s['total_sales'] - 390.0) < 1e-6
    # total purchases amount: Beef purchase:30*12=360; Chicken purchase:50*6=300 => total_purchases = 660
    assert abs(s['total_purchases'] - 660.0) < 1e-6
    # profit = -270
    assert abs(s['profit'] - (-270.0)) < 1e-6
