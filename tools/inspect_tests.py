import re

with open('/home/ubuntu/SOFFICE/e2e/run-all-tiers.mjs') as f:
    lines = f.readlines()

targets = ['T1.1.5', 'T1.4.1', 'T1.4.2', 'T1.4.3', 'T1.4.4', 'T1.4.5', 'T1.9.2', 'T1.9.3', 'T1.9.4', 'T1.10.5', 'C5', 'S1']

for i, line in enumerate(lines):
    for t in targets:
        if f"id: '{t}'" in line or f'id: "{t}"' in line or f"'{t}'" in line:
            start = max(0, i - 2)
            end = min(len(lines), i + 20)
            print(f"--- MATCH {t} around line {i+1} ---")
            for j in range(start, end):
                print(f"{j+1}: {lines[j]}", end='')
            print()
