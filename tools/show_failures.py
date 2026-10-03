import json

with open('/home/ubuntu/SOFFICE/e2e/test-results-all-tiers.json') as f:
    data = json.load(f)

for tier_name, tier in data.get('tiers', {}).items():
    print(f"=== {tier_name} (failed: {tier.get('failed')}) ===")
    for c in tier.get('cases', []):
        if not c.get('passed', True) or c.get('status') == 'failed' or 'error' in c:
            print(f"FAILED: {c.get('id')} - {c.get('name')}")
            print(f"  Error: {c.get('error')}")
            print()
