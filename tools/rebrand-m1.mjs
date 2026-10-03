/**
 * Complete Milestone M1 Rebranding & Metadata Automation Script
 * Handles Features 1, 2, 3, and 4 deterministically.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function patchFile(relPath, fn) {
  const fullPath = path.join(rootDir, relPath)
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`)
    return false
  }
  const original = fs.readFileSync(fullPath, 'utf8')
  const modified = fn(original)
  if (original !== modified) {
    fs.writeFileSync(fullPath, modified, 'utf8')
    console.log(`[PATCHED] ${relPath}`)
    return true
  } else {
    console.log(`[UNCHANGED] ${relPath}`)
    return false
  }
}

// ---------------------------------------------------------------------------
// 1. Feature 2: Home.tsx & home.css logo references
// ---------------------------------------------------------------------------
console.log('\n--- 1. Patching Home logo references ---')
patchFile('apps/shell/src/renderer/src/Home.tsx', (content) => {
  return content.replace(
    "import logoLockup from './assets/genoffice-logo.svg'",
    "import logoLockup from './assets/soffice-logo.svg'"
  )
})

patchFile('apps/shell/src/renderer/src/home.css', (content) => {
  return content.replace(
    '/* genoffice-logo.svg is pure black-and-white; dark themes flip it to 1 */',
    '/* soffice-logo.svg is pure black-and-white; dark themes flip it to 1 */'
  )
})

// ---------------------------------------------------------------------------
// 2. Feature 1: Brand String Purge
// ---------------------------------------------------------------------------
console.log('\n--- 2. Purging Brand Strings ---')

// 2.0 Default Save Directory in electron-utils
patchFile('packages/electron-utils/src/default-save-dir.ts', (c) => {
  return c.replace(
    'const fallback = existsSync(legacyDir) && !existsSync(sOfficeDir) ? legacyDir : sOfficeDir',
    'const fallback = sOfficeDir'
  )
})

// 2.1 Docs Help Menu in apps/docs/src/main/docs-main.ts
patchFile('apps/docs/src/main/docs-main.ts', (content) => {
  let c = content
  const replacements = [
    ["menuDocsHelp: 'GenOffice Docs 帮助'", "menuDocsHelp: 'sOffice Docs 帮助'"],
    ["menuDocsHelp: 'GenOffice Docs Help'", "menuDocsHelp: 'sOffice Docs Help'"],
    ["menuDocsHelp: 'GenOffice Docs ヘルプ'", "menuDocsHelp: 'sOffice Docs ヘルプ'"],
    ["menuDocsHelp: 'GenOffice Docs 도움말'", "menuDocsHelp: 'sOffice Docs 도움말'"],
    ["menuDocsHelp: 'Aide GenOffice Docs'", "menuDocsHelp: 'Aide sOffice Docs'"],
    ["menuDocsHelp: 'GenOffice Docs-Hilfe'", "menuDocsHelp: 'sOffice Docs-Hilfe'"],
    ["menuDocsHelp: 'Ayuda de GenOffice Docs'", "menuDocsHelp: 'Ayuda de sOffice Docs'"],
    ["menuDocsHelp: 'วิธีใช้ GenOffice Docs'", "menuDocsHelp: 'วิธีใช้ sOffice Docs'"],
    ["menuDocsHelp: 'Bantuan GenOffice Docs'", "menuDocsHelp: 'Bantuan sOffice Docs'"],
    ["menuDocsHelp: 'Справка GenOffice Docs'", "menuDocsHelp: 'Справка sOffice Docs'"],
    ["menuDocsHelp: 'تعليمات GenOffice Docs'", "menuDocsHelp: 'تعليمات sOffice Docs'"],
    ["menuDocsHelp: 'Ajuda do GenOffice Docs'", "menuDocsHelp: 'Ajuda do sOffice Docs'"],
    ["menuDocsHelp: 'Guida di GenOffice Docs'", "menuDocsHelp: 'Guida di sOffice Docs'"],
    ["menuDocsHelp: 'Pomoc GenOffice Docs'", "menuDocsHelp: 'Pomoc sOffice Docs'"],
    ["menuDocsHelp: 'Nápověda GenOffice Docs'", "menuDocsHelp: 'Nápověda sOffice Docs'"],
    ["menuDocsHelp: 'עזרה של GenOffice Docs'", "menuDocsHelp: 'עזרה של sOffice Docs'"],
    ["menuDocsHelp: 'GenOffice Docs सहायता'", "menuDocsHelp: 'sOffice Docs सहायता'"],
    ["menuDocsHelp: 'GenOffice Docs 說明'", "menuDocsHelp: 'sOffice Docs 說明'"],
    ["setAiUserAgent(`GenOffice/${app.getVersion()}`)", "setAiUserAgent(`sOffice/${app.getVersion()}`)" ],
    ["app.setPath('userData', join(app.getPath('appData'), 'GenOffice Docs Dev'))", "app.setPath('userData', join(app.getPath('appData'), 'sOffice Docs Dev'))"]
  ]
  for (const [from, to] of replacements) {
    c = c.replace(from, to)
  }
  return c
})

// 2.2 Shell strings.ts across 20 languages
patchFile('apps/shell/src/renderer/src/strings.ts', (content) => {
  let c = content
  // navCloud across all 20 langs
  c = c.replaceAll("navCloud: 'Genspark Projects'", "navCloud: 'sOffice Projects'")
  // cloudSubtitle
  c = c.replaceAll('Genspark AI', 'sOffice AI')
  // Genspark account / login
  c = c.replaceAll("accountGenspark: 'Genspark 账号'", "accountGenspark: 'sOffice 账号'")
  c = c.replaceAll("loginGenspark: '登录 Genspark 账号'", "loginGenspark: '登录 sOffice 账号'")
  c = c.replaceAll("loggedInGenspark: '已登录 Genspark'", "loggedInGenspark: '已登录 sOffice'")
  c = c.replaceAll("loginNetworkError: '无法连接 Genspark,请检查网络或代理设置'", "loginNetworkError: '无法连接 sOffice,请检查网络或代理设置'")
  c = c.replaceAll("cloudLoginHint: '登录 Genspark 账号，查看你在网页端创建的项目。'", "cloudLoginHint: '登录 sOffice 账号，查看你在网页端创建的项目。'")
  c = c.replaceAll("onbCredits: '活跃贡献者可获得 **1,000+ Genspark 积分**'", "onbCredits: '活跃贡献者可获得 **1,000+ sOffice 积分**'")
  c = c.replaceAll("onbNote3: 'AI 功能可能消耗 Genspark 积分。'", "onbNote3: 'AI 功能可能消耗 sOffice 积分。'")

  // English
  c = c.replaceAll("cloudLoginHint: 'Sign in to your Genspark account to see projects you created on the web.'", "cloudLoginHint: 'Sign in to your sOffice account to see projects you created on the web.'")
  c = c.replaceAll("accountGenspark: 'Genspark Account'", "accountGenspark: 'sOffice Account'")
  c = c.replaceAll("loginGenspark: 'Sign in with Genspark'", "loginGenspark: 'Sign in with sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Signed in to Genspark'", "loggedInGenspark: 'Signed in to sOffice'")
  c = c.replaceAll("loginNetworkError: 'Cannot reach Genspark — check your network or proxy settings'", "loginNetworkError: 'Cannot reach sOffice — check your network or proxy settings'")
  c = c.replaceAll("onbCredits: 'Active contributors get **1,000+ Genspark credits**'", "onbCredits: 'Active contributors get **1,000+ sOffice credits**'")
  c = c.replaceAll("onbNote3: 'AI features may consume Genspark credits.'", "onbNote3: 'AI features may consume sOffice credits.'")

  // Japanese
  c = c.replaceAll("'Genspark アカウントにサインインして、Web 上で作成したプロジェクトを表示します。'", "'sOffice アカウントにサインインして、Web 上で作成したプロジェクトを表示します。'")
  c = c.replaceAll("accountGenspark: 'Genspark アカウント'", "accountGenspark: 'sOffice アカウント'")
  c = c.replaceAll("loginGenspark: 'Genspark アカウントでサインイン'", "loginGenspark: 'sOffice アカウントでサインイン'")
  c = c.replaceAll("loggedInGenspark: 'Genspark にサインイン済み'", "loggedInGenspark: 'sOffice にサインイン済み'")
  c = c.replaceAll("'Genspark に接続できません。ネットワークまたはプロキシの設定を確認してください'", "'sOffice に接続できません。ネットワークまたはプロキシの設定を確認してください'")
  c = c.replaceAll("onbCredits: 'アクティブな貢献者への特典 **1,000+ Genspark クレジット**'", "onbCredits: 'アクティブな貢献者への特典 **1,000+ sOffice クレジット**'")
  c = c.replaceAll("onbNote3: 'AI 機能は Genspark クレジットを消費する場合があります。'", "onbNote3: 'AI 機能は sOffice クレジットを消費する場合があります。'")

  // Korean
  c = c.replaceAll("cloudLoginHint: 'Genspark 계정에 로그인하면 웹에서 만든 프로젝트를 볼 수 있습니다.'", "cloudLoginHint: 'sOffice 계정에 로그인하면 웹에서 만든 프로젝트를 볼 수 있습니다.'")
  c = c.replaceAll("accountGenspark: 'Genspark 계정'", "accountGenspark: 'sOffice 계정'")
  c = c.replaceAll("loginGenspark: 'Genspark 계정으로 로그인'", "loginGenspark: 'sOffice 계정으로 로그인'")
  c = c.replaceAll("loggedInGenspark: 'Genspark에 로그인됨'", "loggedInGenspark: 'sOffice에 로그인됨'")
  c = c.replaceAll("loginNetworkError: 'Genspark에 연결할 수 없습니다. 네트워크 또는 프록시 설정을 확인하세요'", "loginNetworkError: 'sOffice에 연결할 수 없습니다. 네트워크 또는 프록시 설정을 확인하세요'")
  c = c.replaceAll("onbCredits: '활발한 기여자를 위한 혜택 **1,000+ Genspark 크레딧**'", "onbCredits: '활발한 기여자를 위한 혜택 **1,000+ sOffice 크레딧**'")
  c = c.replaceAll("onbNote3: 'AI 기능은 Genspark 크레딧을 소모할 수 있습니다.'", "onbNote3: 'AI 기능은 sOffice 크레딧을 소모할 수 있습니다.'")

  // French
  c = c.replaceAll("'Connectez-vous à votre compte Genspark pour voir les projets créés sur le Web.'", "'Connectez-vous à votre compte sOffice pour voir les projets créés sur le Web.'")
  c = c.replaceAll("accountGenspark: 'Compte Genspark'", "accountGenspark: 'Compte sOffice'")
  c = c.replaceAll("loginGenspark: 'Se connecter avec Genspark'", "loginGenspark: 'Se connecter avec sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Connecté à Genspark'", "loggedInGenspark: 'Connecté à sOffice'")
  c = c.replaceAll("'Impossible de joindre Genspark — vérifiez vos paramètres réseau ou de proxy'", "'Impossible de joindre sOffice — vérifiez vos paramètres réseau ou de proxy'")
  c = c.replaceAll("onbCredits: 'Les contributeurs actifs reçoivent **1 000+ crédits Genspark**'", "onbCredits: 'Les contributeurs actifs reçoivent **1 000+ crédits sOffice**'")
  c = c.replaceAll("onbNote3: 'Les fonctions IA peuvent consommer des crédits Genspark.'", "onbNote3: 'Les fonctions IA peuvent consommer des crédits sOffice.'")

  // German
  c = c.replaceAll("'Melden Sie sich bei Ihrem Genspark-Konto an, um im Web erstellte Projekte zu sehen.'", "'Melden Sie sich bei Ihrem sOffice-Konto an, um im Web erstellte Projekte zu sehen.'")
  c = c.replaceAll("accountGenspark: 'Genspark-Konto'", "accountGenspark: 'sOffice-Konto'")
  c = c.replaceAll("loginGenspark: 'Mit Genspark anmelden'", "loginGenspark: 'Mit sOffice anmelden'")
  c = c.replaceAll("loggedInGenspark: 'Bei Genspark angemeldet'", "loggedInGenspark: 'Bei sOffice angemeldet'")
  c = c.replaceAll("'Genspark kann nicht erreicht werden – überprüfen Sie Netzwerk- oder Proxyeinstellungen'", "'sOffice kann nicht erreicht werden – überprüfen Sie Netzwerk- oder Proxyeinstellungen'")
  c = c.replaceAll("onbCredits: 'Aktive Mitwirkende erhalten **1.000+ Genspark-Guthaben**'", "onbCredits: 'Aktive Mitwirkende erhalten **1.000+ sOffice-Guthaben**'")
  c = c.replaceAll("onbNote3: 'KI-Funktionen können Genspark-Credits verbrauchen.'", "onbNote3: 'KI-Funktionen können sOffice-Credits verbrauchen.'")

  // Spanish
  c = c.replaceAll("'Inicia sesión en tu cuenta de Genspark para ver los proyectos que creaste en la web.'", "'Inicia sesión en tu cuenta de sOffice para ver los proyectos que creaste en la web.'")
  c = c.replaceAll("accountGenspark: 'Cuenta de Genspark'", "accountGenspark: 'Cuenta de sOffice'")
  c = c.replaceAll("loginGenspark: 'Iniciar sesión con Genspark'", "loginGenspark: 'Iniciar sesión con sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Sesión iniciada en Genspark'", "loggedInGenspark: 'Sesión iniciada en sOffice'")
  c = c.replaceAll("'No se puede conectar con Genspark. Comprueba tu red o la configuración del proxy'", "'No se puede conectar con sOffice. Comprueba tu red o la configuración del proxy'")
  c = c.replaceAll("onbCredits: 'Los colaboradores activos reciben **1.000+ créditos de Genspark**'", "onbCredits: 'Los colaboradores activos reciben **1.000+ créditos de sOffice**'")
  c = c.replaceAll("onbNote3: 'Las funciones de IA pueden consumir créditos de Genspark.'", "onbNote3: 'Las funciones de IA pueden consumir créditos de sOffice.'")

  // Thai
  c = c.replaceAll("cloudLoginHint: 'ลงชื่อเข้าใช้บัญชี Genspark เพื่อดูโปรเจกต์ที่คุณสร้างบนเว็บ'", "cloudLoginHint: 'ลงชื่อเข้าใช้บัญชี sOffice เพื่อดูโปรเจกต์ที่คุณสร้างบนเว็บ'")
  c = c.replaceAll("accountGenspark: 'บัญชี Genspark'", "accountGenspark: 'บัญชี sOffice'")
  c = c.replaceAll("loginGenspark: 'ลงชื่อเข้าใช้ด้วย Genspark'", "loginGenspark: 'ลงชื่อเข้าใช้ด้วย sOffice'")
  c = c.replaceAll("loggedInGenspark: 'ลงชื่อเข้าใช้ Genspark แล้ว'", "loggedInGenspark: 'ลงชื่อเข้าใช้ sOffice แล้ว'")
  c = c.replaceAll("loginNetworkError: 'ไม่สามารถเชื่อมต่อ Genspark ได้ โปรดตรวจสอบเครือข่ายหรือการตั้งค่าพร็อกซี'", "loginNetworkError: 'ไม่สามารถเชื่อมต่อ sOffice ได้ โปรดตรวจสอบเครือข่ายหรือการตั้งค่าพร็อกซี'")
  c = c.replaceAll("onbCredits: 'ผู้มีส่วนร่วมอย่างต่อเนื่องจะได้รับ **เครดิต Genspark กว่า 1,000**'", "onbCredits: 'ผู้มีส่วนร่วมอย่างต่อเนื่องจะได้รับ **เครดิต sOffice กว่า 1,000**'")
  c = c.replaceAll("onbNote3: 'ฟีเจอร์ AI อาจใช้เครดิต Genspark'", "onbNote3: 'ฟีเจอร์ AI อาจใช้เครดิต sOffice'")

  // Indonesian
  c = c.replaceAll("cloudLoginHint: 'Masuk ke akun Genspark untuk melihat proyek yang Anda buat di web.'", "cloudLoginHint: 'Masuk ke akun sOffice untuk melihat proyek yang Anda buat di web.'")
  c = c.replaceAll("accountGenspark: 'Akun Genspark'", "accountGenspark: 'Akun sOffice'")
  c = c.replaceAll("loginGenspark: 'Masuk dengan Genspark'", "loginGenspark: 'Masuk với sOffice'")
  c = c.replaceAll("loginGenspark: 'Masuk với sOffice'", "loginGenspark: 'Masuk dengan sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Sudah masuk ke Genspark'", "loggedInGenspark: 'Sudah masuk ke sOffice'")
  c = c.replaceAll("'Tidak dapat menjangkau Genspark — periksa jaringan atau pengaturan proksi Anda'", "'Tidak dapat menjangkau sOffice — periksa jaringan atau pengaturan proksi Anda'")
  c = c.replaceAll("onbCredits: 'Kontributor aktif mendapat **1.000+ kredit Genspark**'", "onbCredits: 'Kontributor aktif mendapat **1.000+ kredit sOffice**'")
  c = c.replaceAll("onbNote3: 'Fitur AI dapat menggunakan kredit Genspark.'", "onbNote3: 'Fitur AI dapat menggunakan kredit sOffice.'")

  // Russian
  c = c.replaceAll("cloudLoginHint: 'Войдите в аккаунт Genspark, чтобы увидеть проекты, созданные в вебе.'", "cloudLoginHint: 'Войдите в аккаунт sOffice, чтобы увидеть проекты, созданные в вебе.'")
  c = c.replaceAll("accountGenspark: 'Учётная запись Genspark'", "accountGenspark: 'Учётная запись sOffice'")
  c = c.replaceAll("loginGenspark: 'Войти через Genspark'", "loginGenspark: 'Войти через sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Выполнен вход в Genspark'", "loggedInGenspark: 'Выполнен вход в sOffice'")
  c = c.replaceAll("loginNetworkError: 'Не удаётся подключиться к Genspark — проверьте сеть или настройки прокси'", "loginNetworkError: 'Не удаётся подключиться к sOffice — проверьте сеть или настройки прокси'")
  c = c.replaceAll("onbCredits: 'Активные участники получают **1000+ кредитов Genspark**'", "onbCredits: 'Активные участники получают **1000+ кредитов sOffice**'")
  c = c.replaceAll("onbNote3: 'Функции ИИ могут расходовать кредиты Genspark.'", "onbNote3: 'Функции ИИ могут расходовать кредиты sOffice.'")

  // Arabic
  c = c.replaceAll("cloudLoginHint: 'سجّل الدخول إلى حساب Genspark لعرض المشاريع التي أنشأتها على الويب.'", "cloudLoginHint: 'سجّل الدخول إلى حساب sOffice لعرض المشاريع التي أنشأتها على الويب.'")
  c = c.replaceAll("accountGenspark: 'حساب Genspark'", "accountGenspark: 'حساب sOffice'")
  c = c.replaceAll("loginGenspark: 'تسجيل الدخول باستخدام Genspark'", "loginGenspark: 'تسجيل الدخول باستخدام sOffice'")
  c = c.replaceAll("loggedInGenspark: 'تم تسجيل الدخول إلى Genspark'", "loggedInGenspark: 'تم تسجيل الدخول إلى sOffice'")
  c = c.replaceAll("loginNetworkError: 'تعذّر الاتصال بـ Genspark — تحقق من الشبكة أو إعدادات الوكيل'", "loginNetworkError: 'تعذّر الاتصال بـ sOffice — تحقق من الشبكة أو إعدادات الوكيل'")
  c = c.replaceAll("onbCredits: 'يحصل المساهمون النشطون على **+1,000 من أرصدة Genspark**'", "onbCredits: 'يحصل المساهمون النشطون على **+1,000 من أرصدة sOffice**'")
  c = c.replaceAll("onbNote3: 'قد تستهلك ميزات الذكاء الاصطناعي أرصدة Genspark.'", "onbNote3: 'قد تستهلك ميزات الذكاء الاصطناعي أرصدة sOffice.'")

  // Portuguese
  c = c.replaceAll("cloudLoginHint: 'Entre na sua conta Genspark para ver os projetos criados na web.'", "cloudLoginHint: 'Entre na sua conta sOffice para ver os projetos criados na web.'")
  c = c.replaceAll("accountGenspark: 'Conta Genspark'", "accountGenspark: 'Conta sOffice'")
  c = c.replaceAll("loginGenspark: 'Entrar com a Genspark'", "loginGenspark: 'Entrar com a sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Conectado à Genspark'", "loggedInGenspark: 'Conectado à sOffice'")
  c = c.replaceAll("'Não foi possível conectar ao Genspark — verifique suas configurações de rede ou proxy'", "'Não foi possível conectar ao sOffice — verifique suas configurações de rede ou proxy'")
  c = c.replaceAll("onbCredits: 'Contribuidores ativos recebem **1.000+ créditos Genspark**'", "onbCredits: 'Contribuidores ativos recebem **1.000+ créditos sOffice**'")
  c = c.replaceAll("onbNote3: 'Os recursos de IA podem consumir créditos Genspark.'", "onbNote3: 'Os recursos de IA podem consumir créditos sOffice.'")

  // Italian
  c = c.replaceAll("cloudLoginHint: 'Accedi al tuo account Genspark per vedere i progetti creati sul web.'", "cloudLoginHint: 'Accedi al tuo account sOffice per vedere i progetti creati sul web.'")
  c = c.replaceAll("accountGenspark: 'Account Genspark'", "accountGenspark: 'Account sOffice'")
  c = c.replaceAll("loginGenspark: 'Accedi con Genspark'", "loginGenspark: 'Accedi con sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Accesso effettuato a Genspark'", "loggedInGenspark: 'Accesso effettuato a sOffice'")
  c = c.replaceAll("'Impossibile raggiungere Genspark — controlla la rete o le impostazioni del proxy'", "'Impossibile raggiungere sOffice — controlla la rete o le impostazioni del proxy'")
  c = c.replaceAll("onbCredits: 'I collaboratori attivi ricevono **1.000+ crediti Genspark**'", "onbCredits: 'I collaboratori attivi ricevono **1.000+ crediti sOffice**'")
  c = c.replaceAll("onbNote3: 'Le funzioni IA possono consumare crediti Genspark.'", "onbNote3: 'Le funzioni IA possono consumare crediti sOffice.'")

  // Polish
  c = c.replaceAll("cloudLoginHint: 'Zaloguj się na konto Genspark, aby zobaczyć projekty utworzone w sieci.'", "cloudLoginHint: 'Zaloguj się na konto sOffice, aby zobaczyć projekty utworzone w sieci.'")
  c = c.replaceAll("accountGenspark: 'Konto Genspark'", "accountGenspark: 'Konto sOffice'")
  c = c.replaceAll("loginGenspark: 'Zaloguj się przez Genspark'", "loginGenspark: 'Zaloguj się przez sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Zalogowano do Genspark'", "loggedInGenspark: 'Zalogowano do sOffice'")
  c = c.replaceAll("loginNetworkError: 'Nie można połączyć się z Genspark — sprawdź sieć lub ustawienia proxy'", "loginNetworkError: 'Nie można połączyć się z sOffice — sprawdź sieć lub ustawienia proxy'")
  c = c.replaceAll("onbCredits: 'Aktywni współtwórcy otrzymują **1000+ kredytów Genspark**'", "onbCredits: 'Aktywni współtwórcy otrzymują **1000+ kredytów sOffice**'")
  c = c.replaceAll("onbNote3: 'Funkcje AI mogą zużywać kredyty Genspark.'", "onbNote3: 'Funkcje AI mogą zużywać kredyty sOffice.'")

  // Czech
  c = c.replaceAll("'Přihlaste se ke svému účtu Genspark a prohlédněte si projekty vytvořené na webu.'", "'Přihlaste se ke svému účtu sOffice a prohlédněte si projekty vytvořené na webu.'")
  c = c.replaceAll("accountGenspark: 'Účet Genspark'", "accountGenspark: 'Účet sOffice'")
  c = c.replaceAll("loginGenspark: 'Přihlásit se přes Genspark'", "loginGenspark: 'Přihlásit se přes sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Přihlášeno ke Genspark'", "loggedInGenspark: 'Přihlášeno ke sOffice'")
  c = c.replaceAll("loginNetworkError: 'Genspark není dostupný — zkontrolujte síť nebo nastavení proxy'", "loginNetworkError: 'sOffice není dostupný — zkontrolujte síť nebo nastavení proxy'")
  c = c.replaceAll("onbCredits: 'Aktivní přispěvatelé získají **1 000+ kreditů Genspark**'", "onbCredits: 'Aktivní přispěvatelé získají **1 000+ kreditů sOffice**'")
  c = c.replaceAll("onbNote3: 'Funkce AI mohou čerpat kredity Genspark.'", "onbNote3: 'Funkce AI mohou čerpat kredity sOffice.'")

  // Dutch
  c = c.replaceAll("'Meld u aan bij uw Genspark-account om projecten te zien die u op het web hebt gemaakt.'", "'Meld u aan bij uw sOffice-account om projecten te zien die u op het web hebt gemaakt.'")
  c = c.replaceAll("accountGenspark: 'Genspark-account'", "accountGenspark: 'sOffice-account'")
  c = c.replaceAll("loginGenspark: 'Inloggen met Genspark'", "loginGenspark: 'Inloggen met sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Ingelogd bij Genspark'", "loggedInGenspark: 'Ingelogd bij sOffice'")
  c = c.replaceAll("loginNetworkError: 'Kan Genspark niet bereiken — controleer uw netwerk of proxyinstellingen'", "loginNetworkError: 'Kan sOffice niet bereiken — controleer uw netwerk of proxyinstellingen'")
  c = c.replaceAll("onbCredits: 'Actieve bijdragers krijgen **1.000+ Genspark-credits**'", "onbCredits: 'Actieve bijdragers krijgen **1.000+ sOffice-credits**'")
  c = c.replaceAll("onbNote3: 'AI-functies kunnen Genspark-credits verbruiken.'", "onbNote3: 'AI-functies kunnen sOffice-credits verbruiken.'")

  // Malay
  c = c.replaceAll("cloudLoginHint: 'Log masuk ke akaun Genspark untuk melihat projek yang anda cipta di web.'", "cloudLoginHint: 'Log masuk ke akaun sOffice untuk melihat projek yang anda cipta di web.'")
  c = c.replaceAll("accountGenspark: 'Akaun Genspark'", "accountGenspark: 'Akaun sOffice'")
  c = c.replaceAll("loginGenspark: 'Log masuk dengan Genspark'", "loginGenspark: 'Log masuk dengan sOffice'")
  c = c.replaceAll("loggedInGenspark: 'Telah log masuk ke Genspark'", "loggedInGenspark: 'Telah log masuk ke sOffice'")
  c = c.replaceAll("'Tidak dapat menyambung ke Genspark — semak rangkaian atau tetapan proksi anda'", "'Tidak dapat menyambung ke sOffice — semak rangkaian atau tetapan proksi anda'")
  c = c.replaceAll("onbCredits: 'Penyumbang aktif menerima **1,000+ kredit Genspark**'", "onbCredits: 'Penyumbang aktif menerima **1,000+ kredit sOffice**'")
  c = c.replaceAll("onbNote3: 'Ciri AI mungkin menggunakan kredit Genspark.'", "onbNote3: 'Ciri AI mungkin menggunakan kredit sOffice.'")

  // Hebrew
  c = c.replaceAll("cloudLoginHint: 'התחברו לחשבון Genspark כדי לראות פרויקטים שיצרתם באתר.'", "cloudLoginHint: 'התחברו לחשבון sOffice כדי לראות פרויקטים שיצרתם באתר.'")
  c = c.replaceAll("accountGenspark: 'חשבון Genspark'", "accountGenspark: 'חשבון sOffice'")
  c = c.replaceAll("loginGenspark: 'התחברות עם Genspark'", "loginGenspark: 'התחברות עם sOffice'")
  c = c.replaceAll("loggedInGenspark: 'מחובר ל-Genspark'", "loggedInGenspark: 'מחובר ל-sOffice'")
  c = c.replaceAll("loginNetworkError: 'לא ניתן להתחבר ל-Genspark — בדקו את הרשת או את הגדרות ה-proxy'", "loginNetworkError: 'לא ניתן להתחבר ל-sOffice — בדקו את הרשת או את הגדרות ה-proxy'")
  c = c.replaceAll("onbCredits: 'תורמים פעילים מקבלים **1,000+ נקודות Genspark**'", "onbCredits: 'תורמים פעילים מקבלים **1,000+ נקודות sOffice**'")
  c = c.replaceAll("onbNote3: 'תכונות AI עשויות לצרוך קרדיטים של Genspark.'", "onbNote3: 'תכונות AI עשויות לצרוך קרדיטים של sOffice.'")

  // Hindi
  c = c.replaceAll("cloudLoginHint: 'वेब पर बनाए गए प्रोजेक्ट देखने के लिए अपने Genspark खाते में साइन इन करें।'", "cloudLoginHint: 'वेब पर बनाए गए प्रोजेक्ट देखने के लिए अपने sOffice खाते में साइन इन करें।'")
  c = c.replaceAll("accountGenspark: 'Genspark खाता'", "accountGenspark: 'sOffice खाता'")
  c = c.replaceAll("loginGenspark: 'Genspark से साइन इन करें'", "loginGenspark: 'sOffice से साइन इन करें'")
  c = c.replaceAll("loggedInGenspark: 'Genspark में साइन इन है'", "loggedInGenspark: 'sOffice में साइन इन है'")
  c = c.replaceAll("loginNetworkError: 'Genspark से कनेक्ट नहीं हो सका — नेटवर्क या प्रॉक्सी सेटिंग जांचें'", "loginNetworkError: 'sOffice से कनेक्ट नहीं हो सका — नेटवर्क या प्रॉक्सी सेटिंग जांचें'")
  c = c.replaceAll("onbCredits: 'सक्रिय योगदानकर्ताओं के लिए **1,000+ Genspark क्रेडिट**'", "onbCredits: 'सक्रिय योगदानकर्ताओं के लिए **1,000+ sOffice क्रेडिट**'")
  c = c.replaceAll("onbNote3: 'AI सुविधाएँ Genspark क्रेडिट खर्च कर सकती हैं।'", "onbNote3: 'AI सुविधाएँ sOffice क्रेडिट खर्च कर सकती हैं।'")

  // Traditional Chinese
  c = c.replaceAll("cloudLoginHint: '登入 Genspark 帳號，查看你在網頁端建立的專案。'", "cloudLoginHint: '登入 sOffice 帳號，查看你在網頁端建立的專案。'")
  c = c.replaceAll("accountGenspark: 'Genspark 帳號'", "accountGenspark: 'sOffice 帳號'")
  c = c.replaceAll("loginGenspark: '登入 Genspark 帳號'", "loginGenspark: '登入 sOffice 帳號'")
  c = c.replaceAll("loggedInGenspark: '已登入 Genspark'", "loggedInGenspark: '已登入 sOffice'")
  c = c.replaceAll("loginNetworkError: '無法連線至 Genspark，請檢查網路或代理設定'", "loginNetworkError: '無法連線至 sOffice，請檢查網路或代理設定'")
  c = c.replaceAll("onbCredits: '活躍貢獻者可獲得 **1,000+ Genspark 點數**'", "onbCredits: '活躍貢獻者可獲得 **1,000+ sOffice 點數**'")
  c = c.replaceAll("onbNote3: 'AI 功能可能消耗 Genspark 點數。'", "onbNote3: 'AI 功能可能消耗 sOffice 點數。'")

  // Replace remaining occurrences in settings strings
  c = c.replaceAll('Genspark cloud tools', 'sOffice cloud tools')
  c = c.replaceAll('Genspark 雲端工具', 'sOffice 雲端工具')
  c = c.replaceAll('Genspark 云端工具', 'sOffice 云端工具')
  c = c.replaceAll('Genspark sign-in', 'sOffice sign-in')
  c = c.replaceAll('Genspark account', 'sOffice account')
  c = c.replaceAll('Genspark credits', 'sOffice credits')

  return c
})

// 2.3 Ribbons across Docs, Sheets, Slides, Markdown, PDF
patchFile('apps/docs/src/renderer/components/Ribbon.tsx', (content) => {
  return content
    .replaceAll('<span>Genspark AI</span>', '<span>sOffice AI</span>')
    .replaceAll('<div className="ribbon-group-label">Genspark AI</div>', '<div className="ribbon-group-label">sOffice AI</div>')
})

patchFile('apps/sheets/src/renderer/ExcelShell.tsx', (content) => {
  return content.replaceAll('<strong>Genspark AI</strong>', '<strong>sOffice AI</strong>')
})

patchFile('apps/markdown/src/renderer/components/Ribbon.tsx', (content) => {
  return content.replaceAll('<span>Genspark AI</span>', '<span>sOffice AI</span>')
})

patchFile('apps/slides/src/renderer/components/RibbonHomeTab.tsx', (content) => {
  return content.replaceAll('<span>Genspark AI</span>', '<span>sOffice AI</span>')
})

patchFile('apps/slides/src/renderer/App.tsx', (content) => {
  return content.replaceAll('<span>Genspark AI</span>', '<span>sOffice AI</span>')
})

patchFile('apps/pdf/src/renderer/App.tsx', (content) => {
  return content.replaceAll('<span>Genspark AI</span>', '<span>sOffice AI</span>')
})

// 2.4 AI Panel Headers / Titles
patchFile('apps/sheets/src/renderer/ai/AiChatPanel.tsx', (content) => {
  return content
    .replace("aria-label={t('aiGensparkAccount')}", "aria-label={t('aiAssistant')}")
    .replace(/<span className="ai-panel-title">\s*<SofficeMark size=\{22\} \/>\s*Genspark\s*<\/span>/, '<span className="ai-panel-title">\n          <SofficeMark size={22} />\n          sAI\n        </span>')
    .replace(/>\s*Genspark\s*<\/button>/, '>sAI</button>')
})

patchFile('apps/markdown/src/renderer/ai/AiPanel.tsx', (content) => {
  return content
    .replace(/<span className="ai-panel-title">\s*<SofficeMark size=\{22\} \/>\s*Genspark\s*<\/span>/, '<span className="ai-panel-title">\n          <SofficeMark size={22} />\n          sAI\n        </span>')
    .replace(/>\s*Genspark\s*<\/div>/, '>sAI</div>')
})

patchFile('apps/pdf/src/renderer/ai/AiPanel.tsx', (content) => {
  return content
    .replace(/<span className="ai-panel-title">\s*<SofficeMark size=\{22\} \/>\s*Genspark\s*<\/span>/, '<span className="ai-panel-title">\n          <SofficeMark size={22} />\n          sAI\n        </span>')
    .replace(/>\s*Genspark\s*<\/div>/, '>sAI</div>')
})

patchFile('apps/html/src/renderer/ai/AiPanel.tsx', (content) => {
  return content
    .replace(/<span className="ai-panel-title">\s*<SofficeMark size=\{22\} \/>\s*Genspark\s*<\/span>/, '<span className="ai-panel-title">\n          <SofficeMark size={22} />\n          sAI\n        </span>')
    .replace(/>\s*Genspark\s*<\/div>/, '>sAI</div>')
})

// Update Docs and Slides i18n aiPanelTitle
const docsAiDir = path.join(rootDir, 'apps/docs/src/renderer/i18n/ai')
if (fs.existsSync(docsAiDir)) {
  for (const f of fs.readdirSync(docsAiDir)) {
    if (f.endsWith('.ts')) {
      patchFile(`apps/docs/src/renderer/i18n/ai/${f}`, (c) => {
        return c.replace("aiPanelTitle: 'Genspark'", "aiPanelTitle: 'sAI'")
      })
    }
  }
}

const slidesAiDir = path.join(rootDir, 'apps/slides/src/renderer/i18n/ai')
if (fs.existsSync(slidesAiDir)) {
  for (const f of fs.readdirSync(slidesAiDir)) {
    if (f.endsWith('.ts')) {
      patchFile(`apps/slides/src/renderer/i18n/ai/${f}`, (c) => {
        return c.replace("aiPanelTitle: 'Genspark'", "aiPanelTitle: 'sAI'")
      })
    }
  }
}

const slidesRibbonDir = path.join(rootDir, 'apps/slides/src/renderer/i18n/ribbon')
if (fs.existsSync(slidesRibbonDir)) {
  for (const f of fs.readdirSync(slidesRibbonDir)) {
    if (f.endsWith('.ts')) {
      patchFile(`apps/slides/src/renderer/i18n/ribbon/${f}`, (c) => {
        return c.replace("ribbonAiAssistant: 'Genspark'", "ribbonAiAssistant: 'sAI'")
      })
    }
  }
}

// 2.5 System Prompts
patchFile('apps/html/src/renderer/ai/html-skill.ts', (c) => {
  return c.replace('You are the assistant inside GenOffice HTML', 'You are the assistant inside sOffice HTML')
})
patchFile('apps/html/src/renderer/ai/page-writer.ts', (c) => {
  return c
    .replace('You are the page writer of GenOffice HTML', 'You are the page writer of sOffice HTML')
    .replace('You are the document writer of GenOffice HTML.', 'You are the document writer of sOffice HTML.')
})
patchFile('apps/html/src/renderer/ai/brief-writer.ts', (c) => {
  return c.replace('You are the brief writer of GenOffice HTML', 'You are the brief writer of sOffice HTML')
})
patchFile('apps/markdown/src/renderer/ai/doc-writer.ts', (c) => {
  return c.replace('You are the document writer of GenOffice Markdown', 'You are the document writer of sOffice Markdown')
})
patchFile('apps/markdown/src/renderer/ai/markdown-skill.ts', (c) => {
  return c.replace('You are the writing assistant inside GenOffice Markdown', 'You are the writing assistant inside sOffice Markdown')
})
patchFile('apps/docs/src/renderer/ai/doc-writer.ts', (c) => {
  return c.replace('You are the document writer of GenOffice Docs', 'You are the document writer of sOffice Docs')
})

// 2.6 Window Titles & Document Fallbacks
patchFile('apps/docs/src/renderer/App.tsx', (c) => {
  return c
    .replace("document.title = doc ? doc.fileName : 'GenOffice Docs'", "document.title = doc ? doc.fileName : 'sOffice Docs'")
    .replace("throw new Error('No active GenOffice document')", "throw new Error('No active sOffice document')")
})
patchFile('apps/docs/src/renderer/components/ribbon-tabs.tsx', (c) => {
  return c.replace("{w.title || 'GenOffice Docs'}", "{w.title || 'sOffice Docs'}")
})

// 2.7 IntegrationsPane NPX command
patchFile('apps/shell/src/renderer/src/IntegrationsPane.tsx', (c) => {
  return c.replace(
    "export const NPX_INSTALL_COMMAND = 'npx skills add genspark-ai/genoffice'",
    "export const NPX_INSTALL_COMMAND = 'npx skills add buithanhninh/soffice'"
  )
})

// ---------------------------------------------------------------------------
// 3. Feature 3: Implement <SofficeMark /> Component & Call Sites
// ---------------------------------------------------------------------------
console.log('\n--- 3. Implementing <SofficeMark /> and Replacing Call Sites ---')

const SOFFICE_MARK_TSX = `
export interface SofficeMarkProps {
  readonly size?: number
  readonly className?: string
  readonly fill?: string
}

/**
 * sOffice brand glyph component.
 * Stylized 'S' ribbon intertwined with stacked AI document sheets and sparkle accents,
 * harmonized with the sOffice brand identity (https://soffice.caqa.io.vn).
 */
export function SofficeMark({
  size = 24,
  className = '',
  fill = 'currentColor',
}: SofficeMarkProps) {
  return (
    <svg
      className={\`soffice-mark \${className}\`.trim()}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M52 46 L78 26 L86 35 L58 56 Z" fill={fill} opacity="0.35" />
      <path d="M48 44 L74 24 L83 33 L55 54 Z" fill={fill} opacity="0.6" />
      <path d="M44 42 L70 22 L79 31 L51 52 Z" fill={fill} opacity="0.85" />
      <path
        d="M48 18 C33 18 22 27 22 40 C22 49 28 56 38 60 L44 62 C53 66 58 70 58 76 C58 83 51 88 40 88 C30 88 23 83 20 75 L12 80 C17 92 27 98 40 98 C57 98 68 89 68 76 C68 66 61 59 51 55 L45 53 C36 49 32 46 32 40 C32 33 38 28 48 28 C56 28 62 32 65 39 L73 34 C68 24 59 18 48 18 Z"
        fill={fill}
      />
      <path
        d="M78 8 C78 13 81 16 86 16 C81 16 78 19 78 24 C78 19 75 16 70 16 C75 16 78 13 78 8 Z"
        fill={fill}
      />
      <path
        d="M66 10 C66 12.5 67.5 14 70 14 C67.5 14 66 15.5 66 18 C66 15.5 64.5 14 62 14 C64.5 14 66 12.5 66 10 Z"
        fill={fill}
        opacity="0.8"
      />
      <circle cx="88" cy="8" r="2" fill={fill} opacity="0.75" />
    </svg>
  )
}

/** Backward-compatibility alias during rebranding migration */
export const GensparkMark = SofficeMark
`

// Replace GensparkMark in component definition files:
function replaceGlyphDefinition(relPath) {
  patchFile(relPath, (content) => {
    const regex = /export function GensparkMark[\s\S]*?^}/m
    if (regex.test(content)) {
      return content.replace(regex, SOFFICE_MARK_TSX.trim())
    } else {
      console.warn(`Could not find GensparkMark in ${relPath}`)
      return content
    }
  })
}

replaceGlyphDefinition('apps/docs/src/renderer/components/icons.tsx')
replaceGlyphDefinition('apps/slides/src/renderer/components/icons.tsx')
replaceGlyphDefinition('apps/sheets/src/renderer/ribbon-icons.tsx')
replaceGlyphDefinition('apps/pdf/src/renderer/ai/AiPanel.tsx')
replaceGlyphDefinition('apps/markdown/src/renderer/ai/AiPanel.tsx')
replaceGlyphDefinition('apps/html/src/renderer/ai/AiPanel.tsx')

patchFile('packages/ui/src/icons.tsx', (content) => {
  if (!content.includes('export function SofficeMark')) {
    return content + '\n' + SOFFICE_MARK_TSX
  }
  return content
})

patchFile('packages/ui/src/index.ts', (content) => {
  if (!content.includes('SofficeMark')) {
    return content.replace(
      "export { IconSend, IconStop, type IconProps } from './icons'",
      "export { IconSend, IconStop, SofficeMark, GensparkMark, type IconProps } from './icons'"
    )
  }
  return content
})

// Replace JSX Call Sites to use <SofficeMark />
patchFile('apps/docs/src/renderer/components/Ribbon.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\/icons'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from './icons'`
    })
  }
  return res.replaceAll('<GensparkMark size={26} />', '<SofficeMark size={26} />')
})

patchFile('apps/docs/src/renderer/ai/AiPanel.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\.\/components\/icons'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from '../components/icons'`
    })
  }
  return res.replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

patchFile('apps/slides/src/renderer/components/RibbonHomeTab.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\/icons'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from './icons'`
    })
  }
  return res.replaceAll('<GensparkMark size={26} />', '<SofficeMark size={26} />')
})

patchFile('apps/slides/src/renderer/App.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\/components\/icons'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from './components/icons'`
    })
  }
  return res
    .replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
    .replaceAll('<GensparkMark size={14} />', '<SofficeMark size={14} />')
})

patchFile('apps/slides/src/renderer/ai/AiPanel.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\.\/components\/icons'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from '../components/icons'`
    })
  }
  return res.replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

patchFile('apps/sheets/src/renderer/ExcelShell.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\/ribbon-icons'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from './ribbon-icons'`
    })
  }
  return res.replaceAll('<GensparkMark size={26} />', '<SofficeMark size={26} />')
})

patchFile('apps/sheets/src/renderer/ai/AiChatPanel.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\.\/ribbon-icons'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from '../ribbon-icons'`
    })
  }
  return res.replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

patchFile('apps/pdf/src/renderer/App.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\/ai\/AiPanel'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from './ai/AiPanel'`
    })
  }
  return res
    .replaceAll('<GensparkMark size={26} />', '<SofficeMark size={26} />')
    .replaceAll('<GensparkMark size={20} />', '<SofficeMark size={20} />')
    .replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

patchFile('apps/pdf/src/renderer/ai/AiPanel.tsx', (c) => {
  return c.replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

patchFile('apps/markdown/src/renderer/components/Ribbon.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\.\/ai\/AiPanel'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from '../ai/AiPanel'`
    })
  }
  return res.replaceAll('<GensparkMark size={26} />', '<SofficeMark size={26} />')
})

patchFile('apps/markdown/src/renderer/App.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\/ai\/AiPanel'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from './ai/AiPanel'`
    })
  }
  return res.replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

patchFile('apps/markdown/src/renderer/ai/AiPanel.tsx', (c) => {
  return c.replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

patchFile('apps/html/src/renderer/components/Ribbon.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\.\/ai\/AiPanel'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from '../ai/AiPanel'`
    })
  }
  return res.replaceAll('<GensparkMark size={26} />', '<SofficeMark size={26} />')
})

patchFile('apps/html/src/renderer/App.tsx', (c) => {
  let res = c
  if (!res.includes('SofficeMark')) {
    res = res.replace(/import\s*\{([^}]*)\bGensparkMark\b([^}]*)\}\s*from\s*'\.\/ai\/AiPanel'/g, (m, b1, b2) => {
      return `import {${b1}SofficeMark, GensparkMark${b2}} from './ai/AiPanel'`
    })
  }
  return res.replaceAll('<GensparkMark size={18} />', '<SofficeMark size={18} />')
})

patchFile('apps/html/src/renderer/ai/AiPanel.tsx', (c) => {
  return c.replaceAll('<GensparkMark size={22} />', '<SofficeMark size={22} />')
})

// Update Test mocks
patchFile('apps/markdown/tests/ribbon-save-as.test.ts', (c) => {
  return c.replace(
    "vi.mock('../src/renderer/ai/AiPanel', () => ({ GensparkMark: () => null }))",
    "vi.mock('../src/renderer/ai/AiPanel', () => ({ SofficeMark: () => null, GensparkMark: () => null }))"
  )
})

patchFile('apps/html/tests/ribbon-save-as.test.ts', (c) => {
  return c.replace(
    "vi.mock('../src/renderer/ai/AiPanel', () => ({ GensparkMark: () => null }))",
    "vi.mock('../src/renderer/ai/AiPanel', () => ({ SofficeMark: () => null, GensparkMark: () => null }))"
  )
})

// Update slides styles.css selector
patchFile('apps/slides/src/renderer/styles.css', (c) => {
  return c.replace(
    '.stage-ai-btn svg.genspark-mark {',
    '.stage-ai-btn svg.soffice-mark,\n.stage-ai-btn svg.genspark-mark {'
  )
})

// Deduplicate any repeated SofficeMark imports
const filesWithImports = [
  'apps/docs/src/renderer/components/Ribbon.tsx',
  'apps/docs/src/renderer/ai/AiPanel.tsx',
  'apps/slides/src/renderer/components/RibbonHomeTab.tsx',
  'apps/slides/src/renderer/App.tsx',
  'apps/slides/src/renderer/ai/AiPanel.tsx',
  'apps/sheets/src/renderer/ExcelShell.tsx',
  'apps/sheets/src/renderer/ai/AiChatPanel.tsx',
  'apps/pdf/src/renderer/App.tsx',
  'apps/markdown/src/renderer/components/Ribbon.tsx',
  'apps/markdown/src/renderer/App.tsx',
  'apps/html/src/renderer/components/Ribbon.tsx',
  'apps/html/src/renderer/App.tsx',
]
for (const f of filesWithImports) {
  patchFile(f, (c) => c.replace(/(SofficeMark,\s*)+/g, 'SofficeMark, '))
}

// ---------------------------------------------------------------------------
// 4. Feature 4: Package & Builder Metadata Synchronization
// ---------------------------------------------------------------------------
console.log('\n--- 4. Updating Package and Builder Metadata ---')

patchFile('apps/shell/electron-builder.cjs', (c) => {
  return c
    .replace(
      "maintainer: 'Mainfunc, Inc. <team@genspark.ai>'",
      "maintainer: 'sOffice Team <support@soffice.caqa.io.vn>'"
    )
    .replace(
      "vendor: 'Mainfunc, Inc. <team@genspark.ai>'",
      "vendor: 'sOffice'"
    )
})

patchFile('package.json', (c) => {
  const pkg = JSON.parse(c)
  pkg.repository = {
    type: 'git',
    url: 'git+https://github.com/buithanhninh/soffice.git'
  }
  pkg.author = 'sOffice Team <support@soffice.caqa.io.vn>'
  pkg.description = 'sOffice - AI-native office suite (docs, sheets, slides, pdf, markdown, html)'
  return JSON.stringify(pkg, null, 2) + '\n'
})

patchFile('apps/shell/package.json', (c) => {
  const pkg = JSON.parse(c)
  pkg.author = 'sOffice Team <support@soffice.caqa.io.vn>'
  pkg.repository = {
    type: 'git',
    url: 'https://github.com/buithanhninh/soffice.git'
  }
  return JSON.stringify(pkg, null, 2) + '\n'
})

patchFile('packages/electron-utils/src/github-menu.ts', (c) => {
  return c.replace(
    "export const GITHUB_REPO_URL = 'https://github.com/genspark-ai/genoffice'",
    "export const GITHUB_REPO_URL = 'https://github.com/buithanhninh/soffice'"
  )
})

patchFile('apps/shell/src/renderer/src/SettingsModal.tsx', (c) => {
  return c.replaceAll('github.com/genspark-ai/genoffice', 'github.com/buithanhninh/soffice')
})

patchFile('apps/shell/src/main/index.ts', (c) => {
  return c.replace(
    "'https://api.github.com/repos/genspark-ai/genoffice'",
    "'https://api.github.com/repos/buithanhninh/soffice'"
  )
})

patchFile('apps/shell/src/main/updater.ts', (c) => {
  return c.replace(
    "const DOWNLOAD_PAGE_URL = 'https://github.com/genspark-ai/genoffice/releases/latest'",
    "const DOWNLOAD_PAGE_URL = 'https://github.com/buithanhninh/soffice/releases/latest'"
  )
})

patchFile('apps/shell/tests/updater.test.ts', (c) => {
  return c.replaceAll(
    'https://github.com/genspark-ai/genoffice/releases/latest',
    'https://github.com/buithanhninh/soffice/releases/latest'
  )
})

console.log('\nMilestone M1 Rebranding Script finished execution!')
