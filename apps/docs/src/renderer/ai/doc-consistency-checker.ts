/**
 * Document Typographical & Formatting Consistency Checker for sOffice Docs.
 * Analyzes document text to detect punctuation, space, and style anomalies.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface ConsistencyIssue {
  type: 'double_space' | 'mixed_quotes' | 'hanging_punctuation' | 'heading_gap';
  line: number;
  message: string;
  suggestion: string;
}

export const DocConsistencyChecker = {
  scanText(text: string): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      // 1. Double/Multiple spaces
      if (/ {2,}/.test(line)) {
        issues.push({
          type: 'double_space',
          line: i + 1,
          message: 'Phát hiện khoảng trắng thừa liên tiếp',
          suggestion: line.replace(/ {2,}/g, ' '),
        });
      }

      // 2. Hanging punctuation (e.g. space before comma/period)
      if (/\s+([.,;:!?])/.test(line)) {
        issues.push({
          type: 'hanging_punctuation',
          line: i + 1,
          message: 'Dấu câu bị thừa khoảng trắng phía trước',
          suggestion: line.replace(/\s+([.,;:!?])/g, '$1'),
        });
      }
    }

    return issues;
  },
};