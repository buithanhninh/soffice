import json
import re

ROOT = '/home/ubuntu/SOFFICE'

# 1. Root package.json
root_pkg_path = f'{ROOT}/package.json'
with open(root_pkg_path, 'r', encoding='utf-8') as f:
    root_pkg = json.load(f)

root_pkg['author'] = 'sOffice'
root_pkg['description'] = 'sOffice - AI-native office suite (docs, sheets, slides, pdf, markdown, html)'

with open(root_pkg_path, 'w', encoding='utf-8') as f:
    json.dump(root_pkg, f, indent=2)
    f.write('\n')
print("Updated root package.json")

# 2. apps/shell/package.json
shell_pkg_path = f'{ROOT}/apps/shell/package.json'
with open(shell_pkg_path, 'r', encoding='utf-8') as f:
    shell_pkg = json.load(f)

shell_pkg['productName'] = 'sOffice'
shell_pkg['description'] = 'sOffice - AI-Native Office Suite (Docs, Sheets, Slides, PDF)'
shell_pkg['homepage'] = 'https://soffice.caqa.io.vn'
shell_pkg['desktopName'] = 'soffice.desktop'

with open(shell_pkg_path, 'w', encoding='utf-8') as f:
    json.dump(shell_pkg, f, indent=2)
    f.write('\n')
print("Updated apps/shell/package.json")

# 3. apps/shell/src/renderer/src/Home.tsx
home_tsx_path = f'{ROOT}/apps/shell/src/renderer/src/Home.tsx'
with open(home_tsx_path, 'r', encoding='utf-8') as f:
    home_content = f.read()

home_content = home_content.replace(
    '<img className="logo-lockup" src={logoLockup} alt="GenOffice" />',
    '<img className="logo-lockup" src={logoLockup} alt="sOffice" />'
)
with open(home_tsx_path, 'w', encoding='utf-8') as f:
    f.write(home_content)
print("Updated Home.tsx")

# 4. apps/shell/electron-builder.cjs
builder_path = f'{ROOT}/apps/shell/electron-builder.cjs'
with open(builder_path, 'r', encoding='utf-8') as f:
    b_content = f.read()

# Replace appId and productName in config
b_content = b_content.replace("appId: 'com.genoffice.app',", "appId: 'com.soffice.app',")
b_content = b_content.replace("productName: 'GenOffice',", "productName: 'sOffice',")

# In win block, add executableName: 'sOffice', portable target, and portable artifactName
win_target_old = """  win: {
    target: [
      {
        target: 'nsis',
        arch: [winArch],
      },
    ],"""

win_target_new = """  win: {
    executableName: 'sOffice',
    target: [
      {
        target: 'nsis',
        arch: [winArch],
      },
      {
        target: 'portable',
        arch: [winArch],
      },
    ],
    portable: {
      artifactName: 'sOffice-${version}-Portable.${ext}',
    },"""

if win_target_old in b_content:
    b_content = b_content.replace(win_target_old, win_target_new)
else:
    print("WARNING: win_target_old not found in electron-builder.cjs!")

# In linux block, executableName
b_content = re.sub(
    r"(linux:\s*\{[^}]*?executableName:\s*)'genoffice'",
    r"\1'soffice'",
    b_content
)

# In deb block
b_content = b_content.replace(
    "artifactName: 'genoffice_${version}_${arch}.deb',\n    packageName: 'genoffice',",
    "artifactName: 'soffice_${version}_${arch}.deb',\n    packageName: 'soffice',"
)

# In rpm block
b_content = b_content.replace(
    "artifactName: 'genoffice-${version}.${arch}.rpm',\n    packageName: 'genoffice',",
    "artifactName: 'soffice-${version}.${arch}.rpm',\n    packageName: 'soffice',"
)

# In nsis block
nsis_old = """  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },"""

nsis_new = """  nsis: {
    artifactName: 'sOffice-Setup-${version}.${ext}',
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },"""

if nsis_old in b_content:
    b_content = b_content.replace(nsis_old, nsis_new)
else:
    print("WARNING: nsis_old not found in electron-builder.cjs!")

with open(builder_path, 'w', encoding='utf-8') as f:
    f.write(b_content)
print("Updated apps/shell/electron-builder.cjs")
