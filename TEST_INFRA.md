# Test Infrastructure: sOffice Desktop Suite Overhaul

## 1. Overview & Objectives

This document establishes the test architecture, execution harness, and 4-tier requirement-driven E2E test suite for the **sOffice Desktop Suite Overhaul**. The test suite is designed following the Dual Track E2E Testing methodology:
1. **Opaque-Box & Requirement-Driven**: Tests are derived strictly from user requirements in `ORIGINAL_REQUEST.md` and the 16-feature specification in `PROJECT.md`, completely independent of implementation internals.
2. **Progressive Testability**: Tests assert observable external behavior — UI elements, DOM attributes, window titles, settings persistence, IPC error contracts, package metadata, and distribution artifacts.
3. **4-Tier Test Design Methodology**:
   - **Tier 1: Feature Coverage** (80 test cases: 16 features × 5 tests/feature) — Happy path verification of each feature in isolation.
   - **Tier 2: Boundary & Corner Cases** (80 test cases: 16 features × 5 tests/feature) — Limits, missing keys, invalid keys, timeouts, unicode filenames, resizing, tab switches.
   - **Tier 3: Cross-Feature Combinations** (7 multi-feature interaction suites) — Pairwise and multi-feature interaction testing across shell, editors, and providers.
   - **Tier 4: Real-World Application Scenarios** (4 end-to-end user workflows) — Complete multi-step user journeys from launch to export and configuration.

---

## 2. Test Harness & Environment Architecture

### 2.1 Toolchain & Runtimes
- **Test Framework**: Playwright Test (`@playwright/test` v1.61.1) & Node.js ESM Runner (`node e2e/run-all-tiers.mjs`)
- **Unit & Integration Runner**: Vitest v4.1.11
- **Headless Display Server**: `/usr/bin/xvfb-run` (X11 Virtual Framebuffer)
- **Target Platform**: Ubuntu 22.04 LTS x86_64 on VPS `hmu-vm-soffice` (`/home/ubuntu/SOFFICE`)
- **Electron Main Entrypoint**: `apps/shell/out/main/index.js`
- **Configuration File**: `e2e/playwright.config.ts`

### 2.2 Test Isolation Strategy
- **Scratch User Data Directory**: Each test invocation boots Electron against a freshly allocated temporary directory via `mkdtemp(join(tmpdir(), 'soffice-e2e-'))` mapped through `GENOFFICE_USER_DATA`. Real user settings and credentials remain untouched.
- **Unattended Dialog Handling**: Native Electron file and message dialogs (`dialog.showMessageBox`, `dialog.showOpenDialog`) are intercepted to ensure tests execute fully unattended.
- **Single-Worker Execution**: Playwright runs with `workers: 1` and `fullyParallel: false` to avoid GPU cache collision and window focus stealing across headless Electron instances.
- **Clean Teardown**: `closeAndSaveVideo(launched)` guarantees process cleanup with a 20-second SIGTERM/SIGKILL watchdog, preventing orphan zombie Electron processes.

---

## 3. Feature Test Matrix (16 Features × 4 Tiers)

The 16 features from `PROJECT.md § Feature Inventory` are mapped below:

| # | Feature | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Combinations) | Tier 4 (Real-World) |
|---|---------|-------------------|-------------------|-----------------------|---------------------|
| 1 | Brand String Purge | 5 cases (T1.1.1 - T1.1.5) | 5 cases (T2.1.1 - T2.1.5) | C5 (Purge + Package) | S1, S4 (UI Branding) |
| 2 | Brand Icon & Logo Sync | 5 cases (T1.2.1 - T1.2.5) | 5 cases (T2.2.1 - T2.2.5) | C1, C2 (Ribbon Icons) | S1 (Home & App Icons) |
| 3 | AI Glyph Component Replacement | 5 cases (T1.3.1 - T1.3.5) | 5 cases (T2.3.1 - T2.3.5) | C1, C2 (Ribbon & Panel) | S1, S3 (Editor Glyphs) |
| 4 | Package & Builder Metadata Sync | 5 cases (T1.4.1 - T1.4.5) | 5 cases (T2.4.1 - T2.4.5) | C5, C6 (Metadata Sync) | S4 (Distribution Audit) |
| 5 | OpenAI Default Provider | 5 cases (T1.5.1 - T1.5.5) | 5 cases (T2.5.1 - T2.5.5) | C1 (OpenAI + Slides) | S2 (AI Config Flow) |
| 6 | OpenAI / Gemini API Key Settings UI | 5 cases (T1.6.1 - T1.6.5) | 5 cases (T2.6.1 - T2.6.5) | C2, C3, C4 (Settings UI) | S2 (BYOK Setup Flow) |
| 7 | Application AI Routing & Error Handling | 5 cases (T1.7.1 - T1.7.5) | 5 cases (T2.7.1 - T2.7.5) | C1, C2, C3, C4 (AI Routing) | S3 (Prompt & Recovery) |
| 8 | Media & Search Defaults Restructure | 5 cases (T1.8.1 - T1.8.5) | 5 cases (T2.8.1 - T2.8.5) | C1 (Media + Slides) | S2 (Media Settings) |
| 9 | Windows Portable & NSIS Packaging | 5 cases (T1.9.1 - T1.9.5) | 5 cases (T2.9.1 - T2.9.5) | C6 (Windows + Mac CI) | S4 (Packaging Audit) |
| 10 | Linux .deb & .AppImage Distribution | 5 cases (T1.10.1 - T1.10.5) | 5 cases (T2.10.1 - T2.10.5) | C5 (Linux Package Audit) | S4 (Installer Verification) |
| 11 | macOS Dual-Arch CI Release Workflow | 5 cases (T1.11.1 - T1.11.5) | 5 cases (T2.11.1 - T2.11.5) | C6 (CI Release Workflow) | S4 (CI Pipeline Audit) |
| 12 | Git Remote & GitHub Release Automation | 5 cases (T1.12.1 - T1.12.5) | 5 cases (T2.12.1 - T2.12.5) | C6 (Release Automation) | S4 (GitHub Sync Audit) |
| 13 | Monorepo Typecheck & Lint Clean Pass | 5 cases (T1.13.1 - T1.13.5) | 5 cases (T2.13.1 - T2.13.5) | C7 (Monorepo Stability) | S4 (Quality Gates) |
| 14 | Unit & Integration Test Verification | 5 cases (T1.14.1 - T1.14.5) | 5 cases (T2.14.1 - T2.14.5) | C7 (Regression Suite) | S4 (Test Verification) |
| 15 | Headless Launch Smoke Testing | 5 cases (T1.15.1 - T1.15.5) | 5 cases (T2.15.1 - T2.15.5) | C7 (Headless Execution) | S1, S2, S3, S4 (Smoke) |
| 16 | Adversarial Coverage Hardening | 5 cases (T1.16.1 - T1.16.5) | 5 cases (T2.16.1 - T2.16.5) | C7 (Stress & Resilience) | S3 (Error Resilience) |

---

## 4. Tier 1: Feature Coverage (80 Test Cases)

### Feature 1: Brand String Purge
- **T1.1.1**: Home screen title and hero banner contain "sOffice" with 0 occurrences of "GenOffice" or "Genspark".
- **T1.1.2**: All 6 Quick Create cards display "AI Docs", "AI Sheets", "AI Slides", "AI Markdown", "AI HTML", "AI PDF" with sOffice branding.
- **T1.1.3**: Window title format follows `<Document Name> - sOffice` across all editors.
- **T1.1.4**: Settings Modal navigation labels and titles display clean "sOffice" strings without legacy references.
- **T1.1.5**: About screen/dialog displays "sOffice" as product name, version, and copyright.

### Feature 2: Brand Icon & Logo Sync
- **T1.2.1**: App icon files exist across all required sizes: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512, 1024x1024 png.
- **T1.2.2**: Linux icon desktop assets reflect `soffice.png` and desktop entry icon matches `soffice`.
- **T1.2.3**: macOS `.icns` bundle exists in `apps/shell/build/icon.icns` with valid binary header.
- **T1.2.4**: Windows `.ico` file exists in `apps/shell/build/icon.ico` with embedded multi-resolution headers.
- **T1.2.5**: Home screen header renders sOffice SVG logo component with valid viewBox and visible dimensions.

### Feature 3: AI Glyph Component Replacement
- **T1.3.1**: Docs editor AI dock header displays sOffice/sAI glyph component instead of GensparkMark.
- **T1.3.2**: Sheets Formula Assistant button and ribbon display sOffice/sAI glyph.
- **T1.3.3**: Slides AI presentation generator panel displays sOffice/sAI glyph.
- **T1.3.4**: PDF reader AI Q&A panel renders sOffice/sAI glyph.
- **T1.3.5**: Shell TabBar and Quick Create cards render unified sOffice/sAI mark.

### Feature 4: Package & Builder Metadata Sync
- **T1.4.1**: Root `package.json` specifies description containing "sOffice" and author "sOffice".
- **T1.4.2**: `apps/shell/package.json` product name and description specify "sOffice".
- **T1.4.3**: `apps/shell/electron-builder.cjs` defines `productName: 'sOffice'` and `appId: 'com.soffice.app'`.
- **T1.4.4**: `apps/shell/electron-builder.cjs` specifies Linux `executableName: 'soffice'` and `category: 'Office'`.
- **T1.4.5**: Linux maintainer and vendor metadata specify `sOffice <support@soffice.caqa.io.vn>`.

### Feature 5: OpenAI Default Provider
- **T1.5.1**: `defaultAiSettings()` returns `provider: 'openai'`.
- **T1.5.2**: Default model for OpenAI is configured to `gpt-5.6-terra`.
- **T1.5.3**: AI provider catalog lists OpenAI with standard model options (`gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`).
- **T1.5.4**: Fresh user profile launch initializes with OpenAI selected in Settings.
- **T1.5.5**: `activeProvider(settings)` resolves to `'openai'` without fallback to Genspark when configured.

### Feature 6: OpenAI / Gemini API Key Settings UI
- **T1.6.1**: Settings Modal "AI Model" tab renders Provider dropdown containing "OpenAI" and "Gemini".
- **T1.6.2**: Selecting "OpenAI" displays API key input (`#set-ai-key`) with `sk-...` placeholder and model dropdown.
- **T1.6.3**: Selecting "Gemini" displays API key input with `AIza...` placeholder and Gemini model dropdown (`gemini-3.7-flash`).
- **T1.6.4**: Modifying API key activates the "Save" button (`dirty: true`).
- **T1.6.5**: "Test connection" button invokes connection tester and updates status pill (`.set-ai-status`).

### Feature 7: Application AI Routing & Error Handling
- **T1.7.1**: Docs AI generation requests route to the configured active provider via IPC `ai:stream`.
- **T1.7.2**: Sheets Formula Assistant routes generation requests to the active provider.
- **T1.7.3**: Slides AI presentation generation routes requests to the active provider.
- **T1.7.4**: PDF AI Q&A panel routes queries to the active provider.
- **T1.7.5**: Missing API key displays user-friendly banner with a clickable "Configure API Key" button.

### Feature 8: Media & Search Defaults Restructure
- **T1.8.1**: `defaultAiMediaSettings()` sets default image generation provider without Genspark proxy dependencies.
- **T1.8.2**: Local file search / reranking defaults avoid hardcoded Genspark proxy endpoints.
- **T1.8.3**: Settings Modal "AI Media & Search" tab renders configuration blocks for media and search.
- **T1.8.4**: Media connection test verifies configured provider endpoint independently.
- **T1.8.5**: Image generation requests in Docs/Slides route through configured media provider.

### Feature 9: Windows Portable & NSIS Packaging
- **T1.9.1**: `apps/shell/electron-builder.cjs` `win.target` specifies both `nsis` and `portable`.
- **T1.9.2**: Portable configuration defines `artifactName: 'sOffice-Portable-${version}.${ext}'`.
- **T1.9.3**: NSIS configuration defines `artifactName: 'sOffice-Setup-${version}.${ext}'`.
- **T1.9.4**: Windows executable name is configured as `'sOffice'`.
- **T1.9.5**: Build script `npm run dist:win` triggers electron-builder with Windows targets.

### Feature 10: Linux .deb & .AppImage Distribution
- **T1.10.1**: `apps/shell/release/` contains valid `soffice_0.10.0_amd64.deb`.
- **T1.10.2**: `apps/shell/release/` contains valid `sOffice-0.10.0.AppImage`.
- **T1.10.3**: Debian package control file defines `Package: soffice`, `Section: utils`, `Maintainer: sOffice`.
- **T1.10.4**: Desktop entry file specifies `Exec=soffice %U` and `Icon=soffice`.
- **T1.10.5**: Unpacked binary `apps/shell/release/linux-unpacked/soffice` executes and launches under `xvfb-run`.

### Feature 11: macOS Dual-Arch CI Release Workflow
- **T1.11.1**: `.github/workflows/build-desktop-release.yml` includes `build-macos` job on `macos-latest`.
- **T1.11.2**: Workflow exports `GENOFFICE_MAC_X64: '1'` and `SOFFICE_MAC_X64: '1'` for dual-arch build.
- **T1.11.3**: macOS packaging targets both `arm64` (Apple Silicon) and `x64` (Intel) DMG artifacts.
- **T1.11.4**: Release artifact upload step packages both `sOffice-*-arm64.dmg` and `sOffice-*-x64.dmg`.
- **T1.11.5**: Universal native build step (`native:build:universal`) combines sidecar binaries via lipo.

### Feature 12: Git Remote & GitHub Release Automation
- **T1.12.1**: Git remote `origin` is configured to `https://github.com/buithanhninh/soffice.git`.
- **T1.12.2**: Git remote `upstream` is configured to `https://github.com/genspark-ai/genoffice.git`.
- **T1.12.3**: Release workflow job `create-release` aggregates artifacts from linux, windows, and macos jobs.
- **T1.12.4**: `create-release` generates SHA256 checksums (`SHA256SUMS.txt`) for all packages.
- **T1.12.5**: GitHub Release action attaches Linux, Windows, macOS installers, and checksum files.

### Feature 13: Monorepo Typecheck & Lint Clean Pass
- **T1.13.1**: `npm run typecheck` runs `tsc --noEmit` across all 25 workspaces and exits with code 0.
- **T1.13.2**: `npm run lint` runs ESLint across monorepo and exits with 0 errors.
- **T1.13.3**: `eslint.config.mjs` excludes non-application prototype code (`archive_web_prototype/**`).
- **T1.13.4**: All workspace `tsconfig.json` project references compile cleanly.
- **T1.13.5**: Codebase health check `npm run check:theme-colors` passes cleanly.

### Feature 14: Unit & Integration Test Verification
- **T1.14.1**: `@genoffice/i18n` unit tests pass cleanly (19/19 tests).
- **T1.14.2**: `@genoffice/electron-utils` unit tests pass cleanly (24/24 tests).
- **T1.14.3**: `@genoffice/ai-provider` unit tests pass cleanly (12/12 tests).
- **T1.14.4**: `@genoffice/shell` unit and component tests pass cleanly (559/559 tests).
- **T1.14.5**: Aggregated `npm test` runs across workspaces sequentially and reports overall success.

### Feature 15: Headless Launch Smoke Testing
- **T1.15.1**: Electron shell boots cleanly under `xvfb-run -a` without physical display.
- **T1.15.2**: Home screen renders hero banner and tab bar within 15 seconds.
- **T1.15.3**: Opening a new Docs tab creates an active editor view with `.ProseMirror` element.
- **T1.15.4**: Opening a new Sheets tab creates an active spreadsheet view with canvas grid.
- **T1.15.5**: `app.close()` terminates the Electron process cleanly without hanging.

### Feature 16: Adversarial Coverage Hardening
- **T1.16.1**: Document title with control characters (`\r\n\t`) is sanitized without breaking TabBar.
- **T1.16.2**: Special character filename (`Test @#$&()[] Document.docx`) opens and saves without corruption.
- **T1.16.3**: Large prompt payload (50,000 characters) in AI panel does not crash the renderer process.
- **T1.16.4**: Rapid double-clicking AI generation button disables button, preventing duplicate API requests.
- **T1.16.5**: Rapid opening and closing of 5 document tabs preserves window manager stability.

---

## 5. Tier 2: Boundary & Corner Cases (80 Test Cases)

### Feature 1: Brand String Purge
- **T2.1.1**: Localized UI (`GENOFFICE_LANG=zh-CN` / `fr`) maintains "sOffice" product name across languages.
- **T2.1.2**: Extremely long document title (255 characters) truncates with ellipsis without exposing fallback brand.
- **T2.1.3**: Untitled document defaults to "Untitled Document - sOffice" rather than "Untitled Document - GenOffice".
- **T2.1.4**: Multiple tab switches (Docs -> Sheets -> Slides -> PDF) continuously preserve " - sOffice" in window title.
- **T2.1.5**: Window resize to minimum dimensions (800x600) does not break header into fragmented brand text.

### Feature 2: Brand Icon & Logo Sync
- **T2.2.1**: Switching between Dark and Light themes maintains SVG logo contrast and visibility.
- **T2.2.2**: High-DPI display scaling (200%) renders crisp vector logo without clipped viewBox boundaries.
- **T2.2.3**: Minimize and restore cycle preserves taskbar/window icon handle in Electron window manager.
- **T2.2.4**: SVG fallback renders immediately if any external web image asset is unreachable.
- **T2.2.5**: File association icons for `.docx`, `.xlsx`, `.pptx` reflect sOffice branding.

### Feature 3: AI Glyph Component Replacement
- **T2.3.1**: Collapsed AI sidebar (width 34px) keeps sAI rail button glyph centered and unclipped.
- **T2.3.2**: Repositioning AI sidebar from Right to Left maintains symmetric glyph padding and alignment.
- **T2.3.3**: Streaming generation state displays subtle pulse animation without DOM node leaks.
- **T2.3.4**: High contrast theme mode renders glyph with WCAG AA compliant fill/stroke contrast ratio.
- **T2.3.5**: Dynamic font size scaling (12px to 24px) preserves vertical glyph alignment with label text.

### Feature 4: Package & Builder Metadata Sync
- **T2.4.1**: Version format validation: semantic versioning (`X.Y.Z`) correctly formats electron-builder artifacts.
- **T2.4.2**: Multi-architecture packaging template (`x64`, `arm64`) produces distinct unambiguous deb artifact names.
- **T2.4.3**: CLI binary wrapper `soffice --version` outputs exact version matching root `package.json`.
- **T2.4.4**: `THIRD-PARTY-NOTICES.txt` reflects sOffice distribution notice and legal maintainer.
- **T2.4.5**: Deep scan across all 25 workspace package manifests contains zero deprecated author fields.

### Feature 5: OpenAI Default Provider
- **T2.5.1**: Launching with empty OpenAI API key does NOT silently fall back to Genspark proxy.
- **T2.5.2**: Corrupted or empty `ai-settings.json` heals to default settings with OpenAI selected.
- **T2.5.3**: Whitespace-only OpenAI API key (`"   "`) is treated as empty, triggering missing key state.
- **T2.5.4**: Custom OpenAI base URL (`https://my-proxy.com/v1`) parses safely without breaking provider resolution.
- **T2.5.5**: Legacy configuration containing `provider: 'genspark'` prompts user migration to OpenAI/Gemini.

### Feature 6: OpenAI / Gemini API Key Settings UI
- **T2.6.1**: Clicking "Test connection" with empty API key displays "Enter an API key" inline without network call.
- **T2.6.2**: Entering invalid API key (`sk-invalid-key`) fails gracefully with error status pill (no unhandled crash).
- **T2.6.3**: Network timeout simulation during connection test displays timeout verdict and resets spinner.
- **T2.6.4**: Rapid provider switching (OpenAI -> Gemini -> OpenAI) preserves typed keys and handles dirty state.
- **T2.6.5**: API key input masks secrets by default with toggle option to inspect key.

### Feature 7: Application AI Routing & Error Handling
- **T2.7.1**: Invoking AI prompt without configured API key displays error banner and prevents network flood.
- **T2.7.2**: Clicking "Configure API Key" in error banner immediately opens Settings Modal to `aiModel` section.
- **T2.7.3**: User configures key, saves, closes modal, and retries prompt without needing full app restart.
- **T2.7.4**: Clicking "Stop Generation" cancels active HTTP stream, emits cancel IPC, and unlocks editor.
- **T2.7.5**: HTTP 429 Rate Limit error from provider displays friendly rate limit message with retry recommendation.

### Feature 8: Media & Search Defaults Restructure
- **T2.8.1**: Generating image without media API key renders clear error banner with settings navigation link.
- **T2.8.2**: Image upload prompt exceeding 10MB limit is rejected client-side before network transmission.
- **T2.8.3**: Offline search gracefully falls back to local lexical search when remote reranking is unreachable.
- **T2.8.4**: Malformed media endpoint URL triggers validation warning before settings are persisted.
- **T2.8.5**: Concurrent image generation requests are queued orderly without race conditions.

### Feature 9: Windows Portable & NSIS Packaging
- **T2.9.1**: Portable mode runs without administrative privileges and isolates user data to portable folder.
- **T2.9.2**: NSIS uninstaller cleanly removes desktop shortcuts, Start Menu entries, and registry keys.
- **T2.9.3**: 64-bit architecture packaging bundles 64-bit native Rust sidecar binary (`xlsx-sidecar.exe`).
- **T2.9.4**: Installation into paths containing spaces and parentheses (`C:\Program Files (x86)\sOffice`) works properly.
- **T2.9.5**: Executable PE header metadata contains FileDescription "sOffice Desktop Suite" and CompanyName "sOffice".

### Feature 10: Linux .deb & .AppImage Distribution
- **T2.10.1**: Monorepo root `release/` directory contains or symlinks to the Linux packages.
- **T2.10.2**: Debian package inspection via `dpkg-deb -I` confirms valid architecture (`amd64`) and dependencies.
- **T2.10.3**: AppImage package has executable permission bit (`chmod +x`) set on release artifact.
- **T2.10.4**: Debian `afterRemove` script cleans up system desktop entries and icon cache.
- **T2.10.5**: SHA256 checksum generation verifies file integrity and detects corrupted packages.

### Feature 11: macOS Dual-Arch CI Release Workflow
- **T2.11.1**: CI release workflow executes properly on both `workflow_dispatch` (manual) and tag pushes.
- **T2.11.2**: Missing Apple code signing certificate in preview mode falls back to ad-hoc signed DMG.
- **T2.11.3**: macOS hardened runtime entitlements file specifies required sandbox flags.
- **T2.11.4**: Mounted DMG volume name displays "sOffice" consistently.
- **T2.11.5**: Universal sidecar binary lipo validation confirms presence of both `arm64` and `x86_64` slices.

### Feature 12: Git Remote & GitHub Release Automation
- **T2.12.1**: Git working tree clean check confirms zero uncommitted changes before tagging release.
- **T2.12.2**: Git push network retry logic handles transient GitHub connection resets.
- **T2.12.3**: Release notes generator compiles structured changelog from commit messages.
- **T2.12.4**: Tag collision prevention verifies tag uniqueness before pushing release.
- **T2.12.5**: Pre-release semantic tags (`v0.10.0-rc1`) are correctly marked as pre-release on GitHub.

### Feature 13: Monorepo Typecheck & Lint Clean Pass
- **T2.13.1**: TypeScript strict null checks pass with zero unresolved nullable accesses in AI subsystem.
- **T2.13.2**: ESLint rule enforcement confirms zero unused variables or missing React hook dependencies.
- **T2.13.3**: Incremental typecheck cache resilience: removing `.tsbuildinfo` yields identical clean pass.
- **T2.13.4**: Circular dependency audit confirms acyclic graph across all 18 packages and 7 apps.
- **T2.13.5**: Playwright E2E test files pass `tsc --noEmit` validation without type errors.

### Feature 14: Unit & Integration Test Verification
- **T2.14.1**: Vitest workspace runner executes tests concurrently without IPC channel collisions.
- **T2.14.2**: Simulated SSE chunk stream with varying delay reassembles into complete markdown text.
- **T2.14.3**: Simulated HTTP 500 server error dispatches to error callback without crashing process.
- **T2.14.4**: 0-byte input files in file parsers handle EOF cleanly without memory faults.
- **T2.14.5**: Async test timeout handler terminates hanging promises within configured timeout limit.

### Feature 15: Headless Launch Smoke Testing
- **T2.15.1**: Missing DISPLAY or Xvfb server produces descriptive failure message rather than silent abort.
- **T2.15.2**: Rapid window minimize and maximize under headless display server preserves WebContents renderer.
- **T2.15.3**: Scratch userData directory cleanup removes temporary files after test run completes.
- **T2.15.4**: Memory consumption during idle home screen stays below 500MB RSS threshold.
- **T2.15.5**: Shutdown watchdog forcefully kills hung process if graceful exit exceeds 20 seconds.

### Feature 16: Adversarial Coverage Hardening
- **T2.16.1**: Opening zero-byte or corrupted `.docx` displays graceful error banner rather than white screen.
- **T2.16.2**: Abrupt network disconnection mid-stream terminates stream listener with network error pill.
- **T2.16.3**: Deeply nested or malformed JSON in `ai-settings.json` is safely parsed with schema fallback.
- **T2.16.4**: Oversized API key input (10,000 characters) is truncated or rejected without buffer overflow.
- **T2.16.5**: Simultaneous Settings save while AI prompt is in-flight performs atomic write without corruption.

---

## 6. Tier 3: Cross-Feature Combinations (7 Suites)

- **C1: OpenAI Provider (F5) + Slides AI Generator (F7) + Rebranded Glyphs (F3)**:
  Configure OpenAI as active provider, launch Slides, open AI generator panel (verifying sOffice glyph), generate 3 slides, verify slides populate the canvas without calling Genspark proxy.
- **C2: Gemini BYOK (F6) + Sheets Formula Assistant (F7) + Brand Icons (F2)**:
  Enter Gemini API key in Settings, launch Sheets, open Formula Assistant (verifying sOffice icon and formula prompt), verify formula query routes to Gemini endpoint and formula inserts into cell A1.
- **C3: Settings Modal API Key Update (F6) + Immediate Docs AI Chat Prompt (F7)**:
  Open Docs with missing key, observe "Configure API Key" button, click to open Settings, enter OpenAI key, save, close modal, immediately re-trigger prompt in Docs tab and verify stream initiates without app restart.
- **C4: Missing API Key in PDF Q&A (F7) + "Configure API Key" Click + Settings Route (F6)**:
  Open sample PDF, click AI Assistant, observe missing key error banner, click "Configure API Key", verify Settings Modal opens with focus directly on the AI Model provider tab.
- **C5: Brand String Purge (F1) + Package Metadata (F4) + Linux Package Audit (F10)**:
  Inspect unpackaged Linux binary and `.deb` archive to verify zero remaining occurrences of "GenOffice" or "Genspark" across all user-facing strings and debian control files.
- **C6: Windows Multi-Target Packaging (F9) + macOS Dual-Arch CI (F11) + GitHub Release (F12)**:
  Verify electron-builder and GitHub Actions workflow harmonize all 6 target artifacts (`sOffice-Setup-*.exe`, `sOffice-Portable-*.exe`, `soffice_*.deb`, `sOffice-*.AppImage`, `sOffice-*-arm64.dmg`, `sOffice-*-x64.dmg`) with unified SHA256SUMS.
- **C7: Headless Smoke Launch (F15) + Typecheck & Lint (F13) + Unit Verification (F14) + Adversarial Stress (F16)**:
  Execute unified headless verification pipeline: typecheck passes, lint passes, core unit tests pass, and headless Electron smoke test opens and closes 5 tabs under rapid stress.

---

## 7. Tier 4: Real-World Application Scenarios (4 Workflows)

### Scenario 1: First-Time User Experience & Office Suite Navigation
1. User boots sOffice headlessly for the first time.
2. User lands on clean sOffice Home screen, confirming "sOffice" branding, sOffice SVG logo, hero banner, and zero legacy brand strings.
3. User navigates through Quick Create cards (Docs -> Sheets -> Slides -> PDF -> Markdown -> HTML).
4. Each tab opens with correct window title format (`<Doc> - sOffice`), clean tab icon, and functional canvas.
5. User closes all tabs and returns to Home screen cleanly.

### Scenario 2: End-to-End AI Configuration & BYOK Activation
1. User clicks Settings button on Home screen.
2. User navigates to "AI Model" tab.
3. User verifies OpenAI is the default selected provider.
4. User selects "Gemini", enters a BYOK Gemini key (`AIzaSy...`), selects `gemini-3.7-flash`.
5. User clicks "Test connection" (observes status pill transition).
6. User clicks "Save" (observes saved confirmation and atomic write to `ai-settings.json`).
7. User re-opens Settings, switches to "OpenAI", enters custom API key, and saves.
8. User inspects `ai-settings.json` on disk to verify persistent storage of configured providers.

### Scenario 3: Document Authoring & AI Integration Error Recovery
1. User creates a new blank document in Docs.
2. User opens the AI sidebar; prompt is submitted while API key is unconfigured.
3. User receives clear "API key required" notification with "Configure API Key" action button.
4. User clicks action; Settings Modal opens with focus directly on the API Key input.
5. User configures valid test key, saves, and closes Settings.
6. User re-submits AI prompt; stream initiates and content streams into the document editor.
7. User saves document to disk as `document.docx`.

### Scenario 4: Complete Distribution & Release Integrity Audit
1. Verifies Linux release directory contains installable `soffice_*.deb` and `sOffice-*.AppImage` packages.
2. Verifies Windows builder configuration in `electron-builder.cjs` specifies both NSIS installer and portable `.exe`.
3. Verifies macOS CI workflow specifies dual-arch Apple Silicon (`arm64`) and Intel (`x64`) DMG packages.
4. Verifies Git remote `origin` points to `buithanhninh/soffice.git` and release action compiles SHA256 checksums.
5. Validates entire build and distribution pipeline readiness for official GitHub Release.

---

## 8. Test Execution Guide

### 8.1 Running via Dedicated 4-Tier Test Runner
Execute the complete requirement-driven test suite with structured reporting:
```bash
cd /home/ubuntu/SOFFICE && node e2e/run-all-tiers.mjs
```

### 8.2 Running via Playwright Test Runner under Xvfb
Run individual spec suites or the full E2E suite headlessly:
```bash
# Run Branding & UI Rebranding Spec
cd /home/ubuntu/SOFFICE && xvfb-run -a npx playwright test --config e2e/playwright.config.ts e2e/soffice-branding.spec.ts

# Run AI Settings & BYOK Spec
cd /home/ubuntu/SOFFICE && xvfb-run -a npx playwright test --config e2e/playwright.config.ts e2e/ai-settings.spec.ts

# Run Packaging & Distribution Spec
cd /home/ubuntu/SOFFICE && xvfb-run -a npx playwright test --config e2e/playwright.config.ts e2e/packaging-distribution.spec.ts

# Run System Stability & Adversarial Hardening Spec
cd /home/ubuntu/SOFFICE && xvfb-run -a npx playwright test --config e2e/playwright.config.ts e2e/system-stability.spec.ts

# Run All Playwright Specs in e2e
cd /home/ubuntu/SOFFICE && xvfb-run -a npm run test:e2e
```

### 8.3 Core Verification Gates
```bash
# Typecheck across all 25 workspaces
cd /home/ubuntu/SOFFICE && npm run typecheck

# Lint across monorepo (with archive_web_prototype ignored)
cd /home/ubuntu/SOFFICE && npm run lint

# Core package unit tests
cd /home/ubuntu/SOFFICE && npm test
```
