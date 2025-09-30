"""Demo script: load sample data and call generate_text via ai_service for the computed analytics.

Run it with the backend venv active. It prints chart-friendly data and AI narrative.
"""
import os
from importlib.util import spec_from_file_location, module_from_spec

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
spec = spec_from_file_location('app','%s/app.py' % ROOT)
app_mod = module_from_spec(spec)
spec.loader.exec_module(app_mod)

# ensure ai_service is importable
spec2 = spec_from_file_location('ai_service','%s/ai_service.py' % ROOT)
ai_mod = module_from_spec(spec2)
spec2.loader.exec_module(ai_mod)

from fastapi.testclient import TestClient
client = TestClient(app_mod.app)

# upload sample dataset
sample = os.path.join(ROOT,'tests','sample_transactions.csv')
with open(sample,'rb') as f:
    r = client.post('/upload', files={'file': ('sample.csv', f, 'text/csv')})
    print('upload status', r.status_code, r.json())

    print('\nAI enabled:', getattr(ai_mod, 'AI_ENABLED', False))

# sales over time
r1 = client.get('/ai/query', params={'query':'sales_over_time'})
print('\nSales over time data:')
print(r1.json())

# most profitable product
r2 = client.get('/ai/query', params={'query':'most_profitable_product'})
print('\nMost profitable product data:')
print(r2.json())

# Example: create a custom prompt for OpenAI (if enabled)
data = r2.json()['data']
prompt = ai_mod.build_insight_prompt_for_profits(data)
print('\nBuilt prompt for profits:\n')
print(prompt)
print('\nAI response:')
print(ai_mod.generate_text(prompt))
