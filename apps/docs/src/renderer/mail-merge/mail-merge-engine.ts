/**
 * Mail Merge & Batch Document Personalization Engine for sOffice Docs.
 * Supports tokenized placeholders ({{Field}} and «Field»), Excel/CSV data sources,
 * live record navigation, and individual or combined batch export.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface MergeRecord {
  [key: string]: unknown;
}

export interface MergedDocumentItem {
  recordIndex: number;
  filename: string;
  mergedContent: string;
}

export class MailMergeEngine {
  private template: string;
  private records: MergeRecord[];
  private currentIndex: number;

  constructor(template = '', records: MergeRecord[] = []) {
    this.template = template;
    this.records = records;
    this.currentIndex = 0;
  }

  public setTemplate(template: string): void {
    this.template = template;
  }

  public setRecords(records: MergeRecord[]): void {
    this.records = records;
    this.currentIndex = 0;
  }

  public extractFieldTokens(template = this.template): string[] {
    const tokens = new Set<string>();

    // Pattern 1: {{FieldName}}
    const curlyMatch = template.match(/\{\{\s*([^{}]+?)\s*\}\}/g);
    if (curlyMatch) {
      for (const m of curlyMatch) {
        tokens.add(m.replace(/^\{\{\s*|\s*\}\}$/g, ''));
      }
    }

    // Pattern 2: «FieldName»
    const chevronMatch = template.match(/«\s*([^«»]+?)\s*»/g);
    if (chevronMatch) {
      for (const m of chevronMatch) {
        tokens.add(m.replace(/^«\s*|\s*»$/g, ''));
      }
    }

    return [...tokens];
  }

  public mergeSingle(record: MergeRecord, template = this.template): string {
    return template.replace(/(?:\{\{\s*([^{}]+?)\s*\}\}|«\s*([^«»]+?)\s*»)/g, (_, cKey, chKey) => {
      const key = (cKey || chKey || '').trim();
      const val = record[key];
      return val !== null && val !== undefined ? String(val) : '';
    });
  }

  public getCurrentPreview(): string {
    if (this.records.length === 0) return this.template;
    const current = this.records[this.currentIndex] || {};
    return this.mergeSingle(current);
  }

  public nextRecord(): number {
    if (this.currentIndex < this.records.length - 1) {
      this.currentIndex++;
    }
    return this.currentIndex;
  }

  public prevRecord(): number {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
    return this.currentIndex;
  }

  public goToRecord(index: number): number {
    if (index >= 0 && index < this.records.length) {
      this.currentIndex = index;
    }
    return this.currentIndex;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getTotalRecords(): number {
    return this.records.length;
  }

  public mergeAll(namingField?: string): MergedDocumentItem[] {
    return this.records.map((record, index) => {
      const namePart = namingField && record[namingField] ? String(record[namingField]) : `Record_${index + 1}`;
      const filename = `Document_${namePart.replace(/[^a-zA-Z0-9_\-]/g, '_')}.docx`;
      const mergedContent = this.mergeSingle(record);
      return {
        recordIndex: index,
        filename,
        mergedContent,
      };
    });
  }

  public mergeCombined(pageBreakSeparator = '\n---PAGE-BREAK---\n'): string {
    return this.records.map((record) => this.mergeSingle(record)).join(pageBreakSeparator);
  }
}