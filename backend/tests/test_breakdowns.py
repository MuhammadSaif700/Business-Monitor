import os
import sys
from importlib.util import spec_from_file_location, module_from_spec

# ensure backend root is importable
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from fastapi.testclient import TestClient
from app import app, DATABASE

client = TestClient(app)

def setup_module(module):
    if os.path.exists(DATABASE):
        os.remove(DATABASE)

def test_region_and_customer_breakdown():
    sample = os.path.join(os.path.dirname(__file__), 'sample_transactions.csv')
    with open(sample,'rb') as f:
        r = client.post('/upload', files={'file': ('sample.csv', f, 'text/csv')})
        assert r.status_code == 200

    r1 = client.get('/ai/query', params={'query':'by_region'})
    assert r1.status_code == 200
    data = r1.json()
    assert 'data' in data
    assert isinstance(data['data'], list)

    r2 = client.get('/ai/query', params={'query':'by_customer'})
    assert r2.status_code == 200
    data2 = r2.json()
    assert 'data' in data2
    assert isinstance(data2['data'], list)
