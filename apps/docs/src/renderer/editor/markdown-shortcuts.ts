/**
 * Markdown Keyboard Speed Shortcuts & Auto-Formatting for sOffice Docs.
 * Translates standard Markdown typing syntax into structured document nodes in real time.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface MarkdownTriggerMatch {
  type: 'heading' | 'blockquote' | 'bullet_list' | 'ordered_list' | 'checklist' | 'hr';
  level?: number;
  consumedText: string;
}

export const MarkdownShortcuts = {
  /**
   * Evaluates if the line prefix matches a Markdown block shortcut.
   */
  matchBlockPrefix(lineText: string): MarkdownTriggerMatch | null {
    // 1. Headings: # to ######
    const headingMatch = lineText.match(/^(#{1,6})\s$/);
    if (headingMatch && headingMatch[1]) {
      return {
        type: 'heading',
        level: headingMatch[1].length,
        consumedText: headingMatch[0],
      };
    }

    // 2. Blockquote: >
    if (lineText === '> ') {
      return { type: 'blockquote', consumedText: '> ' };
    }

    // 3. Bullet List: - or *
    if (lineText === '- ' || lineText === '* ') {
      return { type: 'bullet_list', consumedText: lineText };
    }

    // 4. Numbered List: 1.
    const numMatch = lineText.match(/^(\d+)\.\s$/);
    if (numMatch) {
      return { type: 'ordered_list', consumedText: numMatch[0] };
    }

    // 5. Checklist: [] or [ ]
    if (lineText === '[] ' || lineText === '[ ] ') {
      return { type: 'checklist', consumedText: lineText };
    }

    // 6. Horizontal Rule: --- or ***
    if (lineText === '---' || lineText === '***') {
      return { type: 'hr', consumedText: lineText };
    }

    return null;
  },

  /**
   * Evaluates inline markdown pairs: **bold**, *italic*, ~strike~, `code`.
   */
  parseInlineMarkdown(text: string): { type: string; innerText: string } | null {
    const boldMatch = text.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch && boldMatch[1]) return { type: 'bold', innerText: boldMatch[1] };

    const italicMatch = text.match(/^\*(.+?)\*$/);
    if (italicMatch && italicMatch[1]) return { type: 'italic', innerText: italicMatch[1] };

    const strikeMatch = text.match(/^~(.+?)~$/);
    if (strikeMatch && strikeMatch[1]) return { type: 'strike', innerText: strikeMatch[1] };

    const codeMatch = text.match(/^`(.+?)`$/);
    if (codeMatch && codeMatch[1]) return { type: 'code', innerText: codeMatch[1] };

    return null;
  },
};