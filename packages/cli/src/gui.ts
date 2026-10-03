import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { realizedPath } from './fs'
import { CliError, EXIT } from './result'

/** The shell's Electron userData directory, located without Electron (SOFFICE_USER_DATA / GENOFFICE_USER_DATA overrides). */
export function genofficeUserDataDir(env: NodeJS.ProcessEnv): string {
  if (env.SOFFICE_USER_DATA) return env.SOFFICE_USER_DATA
  if (env.GENOFFICE_USER_DATA) return env.GENOFFICE_USER_DATA
  const base =
    process.platform === 'darwin'
      ? join(homedir(), 'Library', 'Application Support')
      : process.platform === 'win32'
        ? env.APPDATA || join(homedir(), 'AppData', 'Roaming')
        : env.XDG_CONFIG_HOME || join(homedir(), '.config')
  const sofficeDir = join(base, 'sOffice')
  if (existsSync(sofficeDir)) return sofficeDir
  const genofficeDir = join(base, 'GenOffice')
  if (existsSync(genofficeDir)) return genofficeDir
  return sofficeDir
}

export interface GuiOpenDocuments {
  pid: number
  paths: string[]
}

/**
 * Files the running sOffice/GenOffice shell has open, from the registries it publishes
 * on every tab change (apps/shell/src/main/open-documents.ts). Empty when no
 * shell is running: a registry whose pid is gone is a crash leftover.
 */
export function guiOpenDocuments(
  env: NodeJS.ProcessEnv,
  dirs = env.SOFFICE_USER_DATA || env.GENOFFICE_USER_DATA
    ? [env.SOFFICE_USER_DATA || env.GENOFFICE_USER_DATA!]
    : [
        genofficeUserDataDir(env),
        `${genofficeUserDataDir(env)} Dev`,
        join(
          process.platform === 'darwin'
            ? join(homedir(), 'Library', 'Application Support')
            : process.platform === 'win32'
              ? env.APPDATA || join(homedir(), 'AppData', 'Roaming')
              : env.XDG_CONFIG_HOME || join(homedir(), '.config'),
          'GenOffice',
        ),
        join(
          process.platform === 'darwin'
            ? join(homedir(), 'Library', 'Application Support')
            : process.platform === 'win32'
              ? env.APPDATA || join(homedir(), 'AppData', 'Roaming')
              : env.XDG_CONFIG_HOME || join(homedir(), '.config'),
          'GenOffice Dev',
        ),
      ],
): GuiOpenDocuments[] {
  const live: GuiOpenDocuments[] = []
  for (const dir of dirs) {
    const path = join(dir, 'open-documents.json')
    if (!existsSync(path)) continue
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<GuiOpenDocuments>
      if (typeof raw.pid !== 'number' || !Array.isArray(raw.paths)) continue
      if (!processAlive(raw.pid)) continue
      live.push({
        pid: raw.pid,
        paths: raw.paths.filter((p): p is string => typeof p === 'string'),
      })
    } catch {
      continue
    }
  }
  return live
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** Refuses to write a document the editor is showing; `--force` skips this. */
export function assertNotOpenInGui(abs: string, env: NodeJS.ProcessEnv): void {
  const target = realizedPath(abs)
  for (const open of guiOpenDocuments(env)) {
    if (!open.paths.some((p) => realizedPath(p) === target)) continue
    throw new CliError(
      EXIT.file,
      `sOffice has this file open: ${abs}`,
      { gui_pid: open.pid },
      {
        reason: 'file_open_in_gui',
        suggestion:
          'close the tab in sOffice first, or pass --force to write anyway (the editor may overwrite your change on its next save)',
      },
    )
  }
}
