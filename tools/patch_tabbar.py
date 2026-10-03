tabbar_path = '/home/ubuntu/SOFFICE/apps/shell/src/renderer/src/TabBar.tsx'

with open(tabbar_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "{tabs.map((tab, index) => {"
replacement = "{tabs.map((tab, index) => {\n          const displayTitle = tab.id === 'home' || tab.title === 'GenOffice' ? 'sOffice' : tab.title"

content = content.replace(target, replacement)

with open(tabbar_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added displayTitle definition to TabBar.tsx")
