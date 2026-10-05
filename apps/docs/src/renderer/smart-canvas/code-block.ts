/**
 * Syntax-Highlighted Code Block Engine for sOffice Docs.
 * Supports multi-language code snippets with token coloring, line numbers, and copy action.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'sql'
  | 'bash'
  | 'cpp'
  | 'java'
  | 'rust'
  | 'go'
  | 'plaintext';

export interface CodeBlockData {
  language: SupportedLanguage;
  code: string;
  showLineNumbers?: boolean;
}

export interface SyntaxToken {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'operator' | 'function' | 'text';
  text: string;
}

const KEYWORDS_BY_LANG: Record<string, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch',
    'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export',
    'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof',
  ],
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch',
    'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export',
    'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof',
    'type', 'interface', 'readonly', 'private', 'public', 'protected', 'implements', 'enum',
  ],
  python: [
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'import',
    'from', 'as', 'class', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield',
    'async', 'await', 'pass', 'None', 'True', 'False', 'is', 'not', 'and', 'or', 'in',
  ],
  sql: [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'INSERT INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON',
    'AS', 'AND', 'OR', 'NOT', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'LIMIT', 'OFFSET',
  ],
};

export const CodeBlockEngine = {
  tokenize(code: string, language: SupportedLanguage = 'javascript'): SyntaxToken[] {
    if (!code) return [];
    const tokens: SyntaxToken[] = [];
    const langKeywords = new Set(
      (KEYWORDS_BY_LANG[language] || KEYWORDS_BY_LANG.javascript || []).map((k) => k.toLowerCase())
    );

    let cursor = 0;
    while (cursor < code.length) {
      // 1. Line Comments
      if (
        (code.startsWith('//', cursor) && language !== 'python') ||
        (code.startsWith('#', cursor) && (language === 'python' || language === 'bash')) ||
        (code.startsWith('--', cursor) && language === 'sql')
      ) {
        let end = code.indexOf('\n', cursor);
        if (end === -1) end = code.length;
        tokens.push({ type: 'comment', text: code.slice(cursor, end) });
        cursor = end;
        continue;
      }

      // 2. Multi-line Comments (/* ... */)
      if (code.startsWith('/*', cursor)) {
        let end = code.indexOf('*/', cursor + 2);
        if (end === -1) end = code.length;
        else end += 2;
        tokens.push({ type: 'comment', text: code.slice(cursor, end) });
        cursor = end;
        continue;
      }

      // 3. String literals ("...", '...', `...`)
      const char = code[cursor]!;
      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        let end = cursor + 1;
        while (end < code.length) {
          if (code[end] === '\\') {
            end += 2;
            continue;
          }
          if (code[end] === quote) {
            end++;
            break;
          }
          end++;
        }
        tokens.push({ type: 'string', text: code.slice(cursor, end) });
        cursor = end;
        continue;
      }

      // 4. Numbers
      if (/[0-9]/.test(char) && (cursor === 0 || /[^a-zA-Z0-9_]/.test(code[cursor - 1]!))) {
        let end = cursor + 1;
        while (end < code.length && /[0-9.xXa-fA-F_]/.test(code[end]!)) end++;
        tokens.push({ type: 'number', text: code.slice(cursor, end) });
        cursor = end;
        continue;
      }

      // 5. Identifiers & Keywords
      if (/[a-zA-Z_]/.test(char)) {
        let end = cursor + 1;
        while (end < code.length && /[a-zA-Z0-9_]/.test(code[end]!)) end++;
        const word = code.slice(cursor, end);
        if (langKeywords.has(word.toLowerCase())) {
          tokens.push({ type: 'keyword', text: word });
        } else if (end < code.length && code[end] === '(') {
          tokens.push({ type: 'function', text: word });
        } else {
          tokens.push({ type: 'text', text: word });
        }
        cursor = end;
        continue;
      }

      // 6. Operators & Punctuation
      if (/[+\-*/%=<>!&|^~?:;.,(){}[\]]/.test(char)) {
        tokens.push({ type: 'operator', text: char });
        cursor++;
        continue;
      }

      // 7. Whitespace / Newlines
      tokens.push({ type: 'text', text: char });
      cursor++;
    }

    return tokens;
  },

  renderHtml(data: CodeBlockData): string {
    const tokens = this.tokenize(data.code, data.language);
    const highlighted = tokens
      .map((t) => {
        const escaped = t.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        if (t.type === 'text') return escaped;
        return `<span class="token-${t.type}">${escaped}</span>`;
      })
      .join('');

    const lines = highlighted.split('\n');
    const numbered = lines
      .map((line, idx) => `<span class="line-number">${idx + 1}</span><span class="line-content">${line}</span>`)
      .join('\n');

    return `
<div class="doc-code-block" data-language="${data.language}">
  <div class="code-block-header">
    <span class="code-lang-label">${data.language.toUpperCase()}</span>
    <button class="code-copy-btn" title="Sao chép mã">Copy</button>
  </div>
  <pre><code>${data.showLineNumbers !== false ? numbered : highlighted}</code></pre>
</div>`.trim();
  },
};