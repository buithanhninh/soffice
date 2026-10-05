/**
 * Pageless View Mode Manager for sOffice Docs.
 * Supports continuous, uninterrupted document reading & editing without physical A4 page breaks.
 * Provides adjustable canvas widths (Narrow, Medium, Wide, Full) and seamless toggle.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export type DocumentViewMode = 'pages' | 'pageless';
export type PagelessWidth = 'narrow' | 'medium' | 'wide' | 'full';

export interface PagelessSettings {
  mode: DocumentViewMode;
  width: PagelessWidth;
  backgroundColor?: string;
}

export const PAGELESS_WIDTH_MAP: Record<PagelessWidth, string> = {
  narrow: '680px',
  medium: '900px',
  wide: '1150px',
  full: '100%',
};

class PagelessStateManager {
  private settings: PagelessSettings = {
    mode: 'pages',
    width: 'medium',
  };
  private listeners = new Set<(settings: PagelessSettings) => void>();

  public getSettings(): PagelessSettings {
    return { ...this.settings };
  }

  public setMode(mode: DocumentViewMode): void {
    if (this.settings.mode === mode) return;
    this.settings.mode = mode;
    this.notify();
  }

  public toggleMode(): DocumentViewMode {
    const next = this.settings.mode === 'pages' ? 'pageless' : 'pages';
    this.setMode(next);
    return next;
  }

  public setWidth(width: PagelessWidth): void {
    if (this.settings.width === width) return;
    this.settings.width = width;
    this.notify();
  }

  public isPageless(): boolean {
    return this.settings.mode === 'pageless';
  }

  public subscribe(listener: (settings: PagelessSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const copy = this.getSettings();
    for (const listener of this.listeners) {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in pageless state listener:', err);
      }
    }
  }
}

export const pagelessManager = new PagelessStateManager();