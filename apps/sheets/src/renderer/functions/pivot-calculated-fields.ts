/**
 * Pivot Table Calculated Fields Evaluator for sOffice Sheets.
 * Evaluates custom user formulas applied to Pivot Table summary records.
 * Uses Shunting-Yard tokenization and reverse polish notation execution.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface FormulaToken {
  type: 'FIELD' | 'NUM' | 'OP' | 'LPAREN' | 'RPAREN';
  value: string | number;
}

export const PivotFormulaEngine = {
  tokenize(formula: string): FormulaToken[] {
    const tokens: FormulaToken[] = [];
    let cursor = 0;

    while (cursor < formula.length) {
      const char = formula[cursor]!;
      if (/\s/.test(char)) {
        cursor++;
        continue;
      }

      if (char === "'") {
        let end = cursor + 1;
        while (end < formula.length && formula[end] !== "'") end++;
        tokens.push({ type: 'FIELD', value: formula.slice(cursor + 1, end) });
        cursor = end + 1;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        let end = cursor + 1;
        while (end < formula.length && /[0-9.]/.test(formula[end]!)) end++;
        tokens.push({ type: 'NUM', value: parseFloat(formula.slice(cursor, end)) });
        cursor = end;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        cursor++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        cursor++;
        continue;
      }

      if (['+', '-', '*', '/'].includes(char)) {
        tokens.push({ type: 'OP', value: char });
        cursor++;
        continue;
      }

      // Unquoted identifier fallback
      if (/[a-zA-Z_]/.test(char)) {
        let end = cursor + 1;
        while (end < formula.length && /[a-zA-Z0-9_]/.test(formula[end]!)) end++;
        tokens.push({ type: 'FIELD', value: formula.slice(cursor, end) });
        cursor = end;
        continue;
      }

      cursor++;
    }

    return tokens;
  },

  evaluate(formula: string, rowContext: Record<string, number>): number | string {
    if (!formula || !formula.trim()) {
      throw new Error('Formula cannot be empty');
    }

    const tokens = this.tokenize(formula);
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const outputQueue: FormulaToken[] = [];
    const opStack: FormulaToken[] = [];

    for (const t of tokens) {
      if (t.type === 'NUM' || t.type === 'FIELD') {
        outputQueue.push(t);
      } else if (t.type === 'LPAREN') {
        opStack.push(t);
      } else if (t.type === 'RPAREN') {
        while (opStack.length > 0 && opStack[opStack.length - 1]!.type !== 'LPAREN') {
          outputQueue.push(opStack.pop()!);
        }
        if (opStack.length > 0 && opStack[opStack.length - 1]!.type === 'LPAREN') {
          opStack.pop();
        }
      } else if (t.type === 'OP') {
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1]!.type === 'OP' &&
          (precedence[String(opStack[opStack.length - 1]!.value)] ?? 0) >=
            (precedence[String(t.value)] ?? 0)
        ) {
          outputQueue.push(opStack.pop()!);
        }
        opStack.push(t);
      }
    }

    while (opStack.length > 0) {
      outputQueue.push(opStack.pop()!);
    }

    const evalStack: (number | string)[] = [];
    for (const t of outputQueue) {
      if (t.type === 'NUM') {
        evalStack.push(Number(t.value));
      } else if (t.type === 'FIELD') {
        const fieldName = String(t.value);
        if (!(fieldName in rowContext)) {
          return '#NAME?';
        }
        evalStack.push(rowContext[fieldName] ?? 0);
      } else if (t.type === 'OP') {
        const b = evalStack.pop();
        const a = evalStack.pop();

        if (typeof a === 'string') return a;
        if (typeof b === 'string') return b;
        if (a === undefined || b === undefined) return '#VALUE!';

        if (t.value === '+') evalStack.push(a + b);
        else if (t.value === '-') evalStack.push(a - b);
        else if (t.value === '*') evalStack.push(a * b);
        else if (t.value === '/') {
          if (b === 0) return '#DIV/0!';
          evalStack.push(a / b);
        }
      }
    }

    return evalStack.length > 0 ? (evalStack[0] ?? 0) : 0;
  },

  checkCircular(
    fieldName: string,
    formula: string,
    allCalculatedFields: Record<string, string>,
    visited = new Set<string>()
  ): boolean {
    if (visited.has(fieldName)) return true;
    visited.add(fieldName);

    const tokens = this.tokenize(formula);
    for (const t of tokens) {
      if (t.type === 'FIELD') {
        const dep = String(t.value);
        if (dep === fieldName) return true;
        if (dep in allCalculatedFields) {
          if (this.checkCircular(dep, allCalculatedFields[dep]!, allCalculatedFields, new Set(visited))) {
            return true;
          }
        }
      }
    }
    return false;
  },
};