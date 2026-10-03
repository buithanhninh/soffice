with open('/home/ubuntu/SOFFICE/apps/shell/electron-builder.cjs', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("executableName: 'genoffice',", "executableName: 'soffice',")

with open('/home/ubuntu/SOFFICE/apps/shell/electron-builder.cjs', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated executableName to soffice")
