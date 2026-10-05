/**
 * Smart Canvas & Interactive Chips for sOffice Docs.
 * Implements Date Chips, Dropdown Status Pills, People Mentions, and Interactive Checklists.
 * Compatible with OpenXML Structured Document Tags (w:sdt).
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface DateChipData {
  type: 'date';
  date: string; // ISO format: YYYY-MM-DD
  format?: string;
}

export interface StatusOption {
  key: string;
  label: string;
  color: string;
  bg: string;
}

export interface DropdownStatusData {
  type: 'dropdown';
  currentKey: string;
  options: StatusOption[];
}

export interface PeopleChipData {
  type: 'people';
  name: string;
  email?: string;
  role?: string;
}

export interface ChecklistItemData {
  type: 'checklist';
  id: string;
  checked: boolean;
  text: string;
}

export type SmartChip = DateChipData | DropdownStatusData | PeopleChipData | ChecklistItemData;

// ============================================================================
// Preset Option Sets
// ============================================================================

export const DEFAULT_PROJECT_STATUSES: StatusOption[] = [
  { key: 'not_started', label: 'Chưa bắt đầu', color: '#6c757d', bg: '#f1f3f5' },
  { key: 'in_progress', label: 'Đang thực hiện', color: '#0d6efd', bg: '#e7f1ff' },
  { key: 'under_review', label: 'Đang duyệt', color: '#e67e22', bg: '#fff4e6' },
  { key: 'approved', label: 'Đã hoàn thành', color: '#198754', bg: '#d1e7dd' },
  { key: 'blocked', label: 'Tạm dừng', color: '#dc3545', bg: '#f8d7da' },
];

export const DEFAULT_PRIORITIES: StatusOption[] = [
  { key: 'low', label: 'Thấp (P3)', color: '#198754', bg: '#d1e7dd' },
  { key: 'medium', label: 'Trung bình (P2)', color: '#fd7e14', bg: '#ffe8cc' },
  { key: 'high', label: 'Cao (P1)', color: '#dc3545', bg: '#f8d7da' },
  { key: 'urgent', label: 'Khẩn cấp (P0)', color: '#721c24', bg: '#f5c6cb' },
];

// ============================================================================
// Smart Chip Operations & Helpers
// ============================================================================

export const SmartChips = {
  createDateChip(dateInput?: string): DateChipData {
    let dateStr = dateInput;
    if (!dateStr || dateStr === '@today') {
      dateStr = new Date().toISOString().slice(0, 10);
    } else if (dateStr === '@tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dateStr = d.toISOString().slice(0, 10);
    } else if (dateStr === '@yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      dateStr = d.toISOString().slice(0, 10);
    }
    return { type: 'date', date: dateStr, format: 'DD/MM/YYYY' };
  },

  formatDate(dateIso: string, format = 'DD/MM/YYYY'): string {
    const parts = dateIso.split('-');
    if (parts.length !== 3) return dateIso;
    const [y, m, d] = parts;
    if (format === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
    if (format === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
    return `${y}-${m}-${d}`;
  },

  createDropdownStatus(
    initialKey = 'not_started',
    options = DEFAULT_PROJECT_STATUSES
  ): DropdownStatusData {
    return {
      type: 'dropdown',
      currentKey: initialKey,
      options: [...options],
    };
  },

  switchStatus(chip: DropdownStatusData, targetKey: string): DropdownStatusData {
    const exists = chip.options.some((o) => o.key === targetKey);
    return {
      ...chip,
      currentKey: exists ? targetKey : chip.currentKey,
    };
  },

  getCurrentStatusOption(chip: DropdownStatusData): StatusOption {
    return (
      chip.options.find((o) => o.key === chip.currentKey) ||
      chip.options[0] || {
        key: 'unknown',
        label: chip.currentKey,
        color: '#6c757d',
        bg: '#f1f3f5',
      }
    );
  },

  createPeopleChip(name: string, email?: string, role?: string): PeopleChipData {
    return {
      type: 'people',
      name: name.replace(/^@/, '').trim(),
      email: email ? email.trim() : undefined,
      role: role ? role.trim() : undefined,
    };
  },

  createChecklistItem(text: string, checked = false): ChecklistItemData {
    const id = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      type: 'checklist',
      id,
      checked,
      text: text.trim(),
    };
  },

  toggleChecklist(item: ChecklistItemData): ChecklistItemData {
    return {
      ...item,
      checked: !item.checked,
    };
  },

  /**
   * Generates HTML inline rendering for a Smart Chip.
   */
  renderHtml(chip: SmartChip): string {
    switch (chip.type) {
      case 'date': {
        const display = this.formatDate(chip.date, chip.format);
        return `<span class="doc-smart-chip doc-chip-date" data-date="${chip.date}"><span class="chip-icon">📅</span> ${display}</span>`;
      }
      case 'dropdown': {
        const opt = this.getCurrentStatusOption(chip);
        return `<span class="doc-smart-chip doc-chip-dropdown" data-key="${chip.currentKey}" style="color:${opt.color};background-color:${opt.bg}"><span class="chip-dot">●</span> ${opt.label}</span>`;
      }
      case 'people': {
        const emailAttr = chip.email ? ` title="${chip.email}"` : '';
        return `<span class="doc-smart-chip doc-chip-people"${emailAttr}><span class="chip-avatar">👤</span> ${chip.name}</span>`;
      }
      case 'checklist': {
        const checkedCls = chip.checked ? ' is-checked' : '';
        return `<div class="doc-checklist-row${checkedCls}" data-id="${chip.id}"><input type="checkbox" ${chip.checked ? 'checked' : ''} /> <span>${chip.text}</span></div>`;
      }
    }
  },
};