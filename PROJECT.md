# Project: sOffice Desktop Suite Overhaul & Release

## Architecture
- **Repository Type**: npm monorepo with 7 applications (`apps/docs`, `apps/sheets`, `apps/slides`, `apps/pdf`, `apps/markdown`, `apps/html`, `apps/shell`) and 18 packages under `packages/` (`@genoffice/*`).
- **Target Working Directory**: `/home/ubuntu/SOFFICE` on VPS `hmu-vm-soffice`.
- **Target Remote Repository**: `origin`: https://github.com/buithanhninh/soffice.git (branch `main`).
- **Runtime & Toolchain**: Node.js v22.23.3, npm 10.9.9, Electron 43.3.0, Electron-Builder 26.0.12, Vitest 4.1.11, Playwright 1.61.1, Xvfb headless display server.
- **Data Flow & Boundaries**:
  - Unified Shell (`apps/shell`): Orchestrates application windows, TabBar, Home screen, SettingsModal, and native electron menus.
  - Multi-Provider AI Architecture (`packages/ai-provider`): Standardized protocols for `openai-compatible` (default OpenAI) and `gemini` (Google Gemini) via IPC channel `ai:stream`.
  - Settings Persistence: `userData/ai-settings.json` via atomic json writes.
  - Build Pipeline: `apps/shell/electron-builder.cjs` orchestrates multi-platform artifacts (`deb`, `AppImage`, `rpm`, Windows NSIS & portable, macOS dual-arch DMG).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Brand String Purge | Purge all user-visible "GenOffice" / "Genspark" strings in menus, window titles, tabs, ribbons, headers, home screen, and dialogs | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Brand Icon & Logo Sync | Synchronize app icons (.ico, .icns, .png 16x16 to 1024x1024, SVG) with https://soffice.caqa.io.vn/logo.jpg | M1 | ORIGINAL_REQUEST §R1 |
| 3 | AI Glyph Component Replacement | Replace `<GensparkMark />` with clean sOffice/sAI brand component in all app ribbons and AI panels | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Package & Builder Metadata Sync | Update maintainer, vendor, and product descriptions to sOffice in package.json & electron-builder.cjs | M1 | ORIGINAL_REQUEST §R1 |
| 5 | OpenAI Default Provider | Configure OpenAI as the default AI provider in `defaultAiSettings()` and prevent silent fallback to Genspark | M2 | ORIGINAL_REQUEST §R2 |
| 6 | OpenAI / Gemini API Key Settings UI | SettingsModal UI for entering, persisting, and live connection testing of OpenAI & Gemini API keys | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Application AI Routing & Error Handling | Update Docs, Sheets, Slides, and PDF AI callers to route to OpenAI/Gemini and show Settings link on missing key | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Media & Search Defaults Restructure | Set media & search defaults to OpenAI/free fallbacks without calling Genspark proxies | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Windows Portable & NSIS Packaging | Standardize electron-builder to build both NSIS installer (.exe) and portable (.exe) for Windows | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Linux .deb and .AppImage Distribution | Build and verify installable Linux .deb and .AppImage artifacts on VPS in release/ | M3 | ORIGINAL_REQUEST §R3 |
| 11 | macOS Dual-Arch CI Release Workflow | Standardize `.github/workflows/build-desktop-release.yml` with `GENOFFICE_MAC_X64: '1'` for Apple Silicon & Intel DMGs | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Git Remote & GitHub Release Automation | Commit all changes, push to origin/main (buithanhninh/soffice), and create official GitHub Release with installers attached | M3 | User Follow-up |
| 13 | Monorepo Typecheck & Lint Clean Pass | Ensure `npm run typecheck` and `npm run lint` pass with 0 errors across all 25 workspaces | M4 | ORIGINAL_REQUEST §R4 |
| 14 | Unit & Integration Test Verification | Ensure all test suites (`npm run test`) pass cleanly across monorepo | M4 | ORIGINAL_REQUEST §R4 |
| 15 | Headless Launch Smoke Testing | Automated smoke test using Playwright and Xvfb confirming application boots without errors or crashes | M4 | ORIGINAL_REQUEST §R4 |
| 16 | Adversarial Coverage Hardening | White-box stress-testing, edge case verification, and regression prevention | M4 | Dual Track Phase 2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Full Rebranding & Asset Synchronization | Features 1, 2, 3, 4 | none | PLANNED |
| M2 | AI Subsystem Restructure: OpenAI & Gemini BYOK | Features 5, 6, 7, 8 | none | PLANNED |
| M3 | Multi-platform Packaging, Release CI & GitHub Release | Features 9, 10, 11, 12 | M1, M2 | PLANNED |
| M4 | Final E2E Verification & Adversarial Hardening | Features 13, 14, 15, 16 | M1, M2, M3 | PLANNED |

## Interface Contracts
### Shell ↔ Applications AI Settings Protocol
- **IPC Channel**: `'ai:stream'`, `'ai:stream-chunk'`, `'ai:stream-cancel'`, `'ai:chat'`
- **Settings Shape**:
  ```ts
  interface AiSettings {
    provider: 'openai' | 'gemini' | string
    providers: {
      openai?: { apiKey: string; model: string; baseUrl?: string }
      gemini?: { apiKey: string; model: string }
      [key: string]: unknown
    }
  }
  ```
- **Error Behavior**:
  When `apiKey` is empty for `openai`, main process emits `errNoApiKey` with `{ provider: 'openai' }`. Renderers catch this and render `<button onClick={() => window.desktop.openSettings('aiModel')}>Configure API Key</button>`.

### Electron-Builder ↔ CI Distribution Contract
- **Artifacts**:
  - Linux: `soffice_${version}_amd64.deb`, `sOffice-${version}.AppImage`
  - Windows: `sOffice-Setup-${version}.exe`, `sOffice-Portable-${version}.exe`
  - macOS: `sOffice-${version}-arm64.dmg`, `sOffice-${version}-x64.dmg`
- **Output Directory**: `apps/shell/release/` symlinked or mirrored to `/home/ubuntu/SOFFICE/release/`.

## Code Layout
- `apps/shell/`: Electron main entrypoint, TabBar, Home screen, SettingsModal, build icons, electron-builder.cjs.
- `apps/{docs,sheets,slides,pdf,markdown,html}/`: Individual office suite apps (renderers, main handlers, AI panels, ribbons).
- `packages/ai-provider/`: Multi-provider LLM adapters, streaming protocols, default settings, connection tester.
- `packages/electron-utils/`: Shared menus, window management, dialogs, atomic JSON file store.
- `.github/workflows/`: CI and build-desktop-release GitHub Actions workflows.
- `e2e/`: Playwright end-to-end and headless smoke tests.
