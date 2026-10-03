import re

ROOT = '/home/ubuntu/SOFFICE'

# 1. apps/shell/src/renderer/index.html
index_html = f'{ROOT}/apps/shell/src/renderer/index.html'
with open(index_html, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('<title>GenOffice</title>', '<title>sOffice</title>')
with open(index_html, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated shell index.html")

# 2. apps/shell/src/renderer/update.html
update_html = f'{ROOT}/apps/shell/src/renderer/update.html'
with open(update_html, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('<title>GenOffice Update</title>', '<title>sOffice Update</title>')
c = c.replace('alt="GenOffice"', 'alt="sOffice"')
with open(update_html, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated shell update.html")

# 3. apps/shell/src/renderer/pdf-password.html
pdf_html = f'{ROOT}/apps/shell/src/renderer/pdf-password.html'
with open(pdf_html, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('<title>GenOffice</title>', '<title>sOffice</title>')
with open(pdf_html, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated shell pdf-password.html")

# 4. apps/shell/src/renderer/src/strings.ts
strings_ts = f'{ROOT}/apps/shell/src/renderer/src/strings.ts'
with open(strings_ts, 'r', encoding='utf-8') as f:
    c = f.read()
# Replace GenOffice with sOffice across all languages
c = c.replace('GenOffice', 'sOffice')
with open(strings_ts, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated shell strings.ts (purged GenOffice)")

# 5. e2e/soffice-branding.spec.ts
spec_path = f'{ROOT}/e2e/soffice-branding.spec.ts'
with open(spec_path, 'r', encoding='utf-8') as f:
    c = f.read()
# In T1.1.4: aiGroupLabel is styled display:none in Slides (like Docs per mac styling), so check toBeAttached
c = c.replace(
    "const aiGroupLabel = editorPage.locator('.ribbon-group-label', { hasText: 'sOffice AI' })\n        await expect(aiGroupLabel).toBeVisible()",
    "const aiGroupLabel = editorPage.locator('.ribbon-group-label', { hasText: 'sOffice AI' })\n        await expect(aiGroupLabel).toBeAttached()"
)
with open(spec_path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated e2e/soffice-branding.spec.ts")
