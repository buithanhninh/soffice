/**
 * Google Sheets SQL =QUERY Engine for sOffice Sheets.
 * Implements =QUERY(data, [query], [headers]) extending BaseFunction
 * from @univerjs/engine-formula.
 *
 * Supports SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, OFFSET, LABEL,
 * arithmetic expressions, aggregates, string predicates, and 2D ArrayValueObject
 * dynamic array spilling.
 *
 * Author: B??i Th??nh Ninh <https://soffice.caqa.io.vn>
 */

import {
  ArrayValueObject,
  BaseFunction,
  BaseValueObject,
  BooleanValueObject,
  ErrorType,
  ErrorValueObject,
  FunctionType,
  IFunctionService,
  NullValueObject,
  NumberValueObject,
  StringValueObject,
} from '@univerjs/engine-formula';

import type { UniverRuntime } from '../univer-state';

// ============================================================================
// 1. Column Coordinate Helpers
// ============================================================================

export function colLetterToIndex(col: string): number {
  let index = 0;
  const upper = col.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToColLetter(index: number): string {
  let letter = '';
  let temp = index + 1;
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

// ============================================================================
// 2. Tokenizer & Lexer
// ============================================================================

const KEYWORDS = new Set([
  'SELECT', 'WHERE', 'GROUP', 'ORDER', 'BY', 'LIMIT', 'OFFSET', 'LABEL',
  'AND', 'OR', 'NOT', 'IS', 'NULL', 'TRUE', 'FALSE', 'DATE',
  'CONTAINS', 'STARTS', 'ENDS', 'WITH', 'LIKE', 'MATCHES',
  'ASC', 'DESC',
  'SUM', 'AVG', 'COUNT', 'MIN', 'MAX',
]);

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'OP'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN'
  | 'STAR'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string | number;
  raw?: string;
  pos: number;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];
    if (ch === undefined) break;

    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', pos: i++ });
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i++ });
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i++ });
      continue;
    }
    if (ch === '*') {
      tokens.push({ type: 'STAR', value: '*', pos: i++ });
      continue;
    }

    if (ch === '!' && input[i + 1] === '=') {
      tokens.push({ type: 'OP', value: '!=', pos: i });
      i += 2;
      continue;
    }
    if (ch === '<' && input[i + 1] === '>') {
      tokens.push({ type: 'OP', value: '<>', pos: i });
      i += 2;
      continue;
    }
    if (ch === '<' && input[i + 1] === '=') {
      tokens.push({ type: 'OP', value: '<=', pos: i });
      i += 2;
      continue;
    }
    if (ch === '>' && input[i + 1] === '=') {
      tokens.push({ type: 'OP', value: '>=', pos: i });
      i += 2;
      continue;
    }
    if ('=<>+-/%'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch, pos: i++ });
      continue;
    }

    // String literal: '...' (escaped with '' or \')
    if (ch === "'") {
      let str = '';
      i++;
      let closed = false;
      while (i < len) {
        const cur = input[i];
        if (cur === "'") {
          if (input[i + 1] === "'") {
            str += "'";
            i += 2;
            continue;
          }
          closed = true;
          i++;
          break;
        }
        if (cur === '\\' && i + 1 < len) {
          str += input[i + 1] ?? '';
          i += 2;
          continue;
        }
        str += cur ?? '';
        i++;
      }
      if (!closed) throw new Error(`Unterminated string literal at position ${i}`);
      tokens.push({ type: 'STRING', value: str, pos: i });
      continue;
    }

    // Quoted identifier: "..." or `...`
    if (ch === '"' || ch === '`') {
      const q = ch;
      let ident = '';
      i++;
      while (i < len && input[i] !== q) {
        ident += input[i++] ?? '';
      }
      if (input[i] === q) i++;
      tokens.push({ type: 'IDENTIFIER', value: ident, pos: i });
      continue;
    }

    // Number literal
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let numStr = '';
      while (i < len) {
        const c = input[i];
        if (!c || !/[0-9.eE+-]/.test(c)) break;
        if (
          (c === '+' || c === '-') &&
          !/[eE]/.test(numStr[numStr.length - 1] ?? '')
        ) {
          break;
        }
        numStr += c;
        i++;
      }
      const num = Number(numStr);
      if (!Number.isFinite(num)) throw new Error(`Invalid numeric literal: ${numStr}`);
      tokens.push({ type: 'NUMBER', value: num, raw: numStr, pos: i });
      continue;
    }

    // Words (Keywords or Identifiers)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < len) {
        const c = input[i];
        if (!c || !/[a-zA-Z0-9_]/.test(c)) break;
        ident += c;
        i++;
      }
      const upper = ident.toUpperCase();
      if (KEYWORDS.has(upper)) {
        tokens.push({ type: 'KEYWORD', value: upper, raw: ident, pos: i });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, pos: i });
      }
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at position ${i}`);
  }

  tokens.push({ type: 'EOF', value: '', pos: len });
  return tokens;
}

// ============================================================================
// 3. AST Model
// ============================================================================

export interface QueryAst {
  select: ExpressionAst[];
  isSelectAll: boolean;
  where: ExpressionAst | null;
  groupBy: ExpressionAst[] | null;
  orderBy: OrderByItem[] | null;
  limit: number | null;
  offset: number | null;
  labels: Map<string, string>;
}

export interface OrderByItem {
  expr: ExpressionAst;
  direction: 'ASC' | 'DESC';
}

export type ExpressionAst =
  | LiteralAst
  | ColumnAst
  | BinaryOpAst
  | UnaryOpAst
  | AggregateAst
  | StarAst;

export interface LiteralAst {
  type: 'LITERAL';
  value: string | number | boolean | null;
  rawType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'NULL' | 'DATE';
}

export interface ColumnAst {
  type: 'COLUMN';
  name: string;
  colIndex?: number;
}

export interface StarAst {
  type: 'STAR';
}

export interface BinaryOpAst {
  type: 'BINARY_OP';
  op:
    | '+' | '-' | '*' | '/' | '%'
    | '=' | '!=' | '<>' | '<' | '<=' | '>' | '>='
    | 'AND' | 'OR'
    | 'CONTAINS' | 'STARTS WITH' | 'ENDS WITH' | 'LIKE' | 'MATCHES';
  left: ExpressionAst;
  right: ExpressionAst;
}

export interface UnaryOpAst {
  type: 'UNARY_OP';
  op: '-' | 'NOT' | 'IS NULL' | 'IS NOT NULL';
  operand: ExpressionAst;
}

export interface AggregateAst {
  type: 'AGGREGATE';
  func: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  arg: ExpressionAst;
}

export function canonicalExpressionString(expr: ExpressionAst): string {
  if (!expr) return '';
  if (expr.type === 'COLUMN') return expr.name.toUpperCase();
  if (expr.type === 'STAR') return '*';
  if (expr.type === 'LITERAL') return String(expr.value);
  if (expr.type === 'AGGREGATE') return `${expr.func}(${canonicalExpressionString(expr.arg)})`;
  if (expr.type === 'UNARY_OP') return `${expr.op} ${canonicalExpressionString(expr.operand)}`;
  if (expr.type === 'BINARY_OP') {
    return `(${canonicalExpressionString(expr.left)} ${expr.op} ${canonicalExpressionString(expr.right)})`;
  }
  return '';
}

// ============================================================================
// 4. Recursive-Descent Parser
// ============================================================================

export class QueryParser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: 'EOF', value: '', pos: -1 };
  }

  private previous(): Token {
    return this.tokens[this.pos - 1] ?? { type: 'EOF', value: '', pos: -1 };
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private check(type: TokenType, val?: string): boolean {
    if (this.isAtEnd()) return false;
    const t = this.peek();
    if (t.type !== type) return false;
    if (val !== undefined && String(t.value).toUpperCase() !== val.toUpperCase()) return false;
    return true;
  }

  private match(type: TokenType, val?: string): boolean {
    if (this.check(type, val)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private consume(type: TokenType, val?: string, msg?: string): Token {
    if (this.check(type, val)) {
      const tok = this.tokens[this.pos++];
      if (tok) return tok;
    }
    throw new Error(msg || `Expected ${val || type} but received ${this.peek().value}`);
  }

  parse(): QueryAst {
    const ast: QueryAst = {
      select: [],
      isSelectAll: true,
      where: null,
      groupBy: null,
      orderBy: null,
      limit: null,
      offset: null,
      labels: new Map(),
    };

    while (!this.isAtEnd()) {
      if (this.match('KEYWORD', 'SELECT')) {
        ast.isSelectAll = false;
        ast.select = this.parseSelectList();
      } else if (this.match('KEYWORD', 'WHERE')) {
        ast.where = this.parseExpression();
      } else if (this.match('KEYWORD', 'GROUP')) {
        this.consume('KEYWORD', 'BY', "Expected 'BY' after 'GROUP'");
        ast.groupBy = this.parseExpressionList();
      } else if (this.match('KEYWORD', 'ORDER')) {
        this.consume('KEYWORD', 'BY', "Expected 'BY' after 'ORDER'");
        ast.orderBy = this.parseOrderByList();
      } else if (this.match('KEYWORD', 'LIMIT')) {
        const numTok = this.consume('NUMBER', undefined, "Expected number after 'LIMIT'");
        ast.limit = Math.floor(numTok.value as number);
      } else if (this.match('KEYWORD', 'OFFSET')) {
        const numTok = this.consume('NUMBER', undefined, "Expected number after 'OFFSET'");
        ast.offset = Math.floor(numTok.value as number);
      } else if (this.match('KEYWORD', 'LABEL')) {
        this.parseLabels(ast.labels);
      } else {
        throw new Error(`Unexpected keyword or token: ${this.peek().value}`);
      }
    }

    return ast;
  }

  private parseSelectList(): ExpressionAst[] {
    const list: ExpressionAst[] = [];
    do {
      if (this.match('STAR')) {
        list.push({ type: 'STAR' });
      } else {
        list.push(this.parseExpression());
      }
    } while (this.match('COMMA'));
    return list;
  }

  private parseExpressionList(): ExpressionAst[] {
    const list: ExpressionAst[] = [];
    do {
      list.push(this.parseExpression());
    } while (this.match('COMMA'));
    return list;
  }

  private parseOrderByList(): OrderByItem[] {
    const list: OrderByItem[] = [];
    do {
      const expr = this.parseExpression();
      let direction: 'ASC' | 'DESC' = 'ASC';
      if (this.match('KEYWORD', 'DESC')) direction = 'DESC';
      else if (this.match('KEYWORD', 'ASC')) direction = 'ASC';
      list.push({ expr, direction });
    } while (this.match('COMMA'));
    return list;
  }

  private parseLabels(map: Map<string, string>): void {
    do {
      const expr = this.parseExpression();
      const labelTok = this.consume('STRING', undefined, 'Expected string literal for column label');
      map.set(canonicalExpressionString(expr), String(labelTok.value));
    } while (this.match('COMMA'));
  }

  parseExpression(): ExpressionAst {
    return this.parseOr();
  }

  private parseOr(): ExpressionAst {
    let expr = this.parseAnd();
    while (this.match('KEYWORD', 'OR')) {
      const right = this.parseAnd();
      expr = { type: 'BINARY_OP', op: 'OR', left: expr, right };
    }
    return expr;
  }

  private parseAnd(): ExpressionAst {
    let expr = this.parseNot();
    while (this.match('KEYWORD', 'AND')) {
      const right = this.parseNot();
      expr = { type: 'BINARY_OP', op: 'AND', left: expr, right };
    }
    return expr;
  }

  private parseNot(): ExpressionAst {
    if (this.match('KEYWORD', 'NOT')) {
      const operand = this.parseNot();
      return { type: 'UNARY_OP', op: 'NOT', operand };
    }
    return this.parseComparison();
  }

  private parseComparison(): ExpressionAst {
    const expr = this.parseAddition();

    if (this.match('KEYWORD', 'IS')) {
      if (this.match('KEYWORD', 'NOT')) {
        this.consume('KEYWORD', 'NULL', "Expected 'NULL' after 'IS NOT'");
        return { type: 'UNARY_OP', op: 'IS NOT NULL', operand: expr };
      }
      this.consume('KEYWORD', 'NULL', "Expected 'NULL' after 'IS'");
      return { type: 'UNARY_OP', op: 'IS NULL', operand: expr };
    }

    if (this.match('KEYWORD', 'CONTAINS')) {
      const right = this.parseAddition();
      return { type: 'BINARY_OP', op: 'CONTAINS', left: expr, right };
    }
    if (this.match('KEYWORD', 'STARTS')) {
      this.consume('KEYWORD', 'WITH', "Expected 'WITH' after 'STARTS'");
      const right = this.parseAddition();
      return { type: 'BINARY_OP', op: 'STARTS WITH', left: expr, right };
    }
    if (this.match('KEYWORD', 'ENDS')) {
      this.consume('KEYWORD', 'WITH', "Expected 'WITH' after 'ENDS'");
      const right = this.parseAddition();
      return { type: 'BINARY_OP', op: 'ENDS WITH', left: expr, right };
    }
    if (this.match('KEYWORD', 'LIKE')) {
      const right = this.parseAddition();
      return { type: 'BINARY_OP', op: 'LIKE', left: expr, right };
    }
    if (this.match('KEYWORD', 'MATCHES')) {
      const right = this.parseAddition();
      return { type: 'BINARY_OP', op: 'MATCHES', left: expr, right };
    }

    if (
      this.check('OP') &&
      ['=', '!=', '<>', '<', '<=', '>', '>='].includes(String(this.peek().value))
    ) {
      const op = this.tokens[this.pos++]!.value as BinaryOpAst['op'];
      const right = this.parseAddition();
      return { type: 'BINARY_OP', op, left: expr, right };
    }

    return expr;
  }

  private parseAddition(): ExpressionAst {
    let expr = this.parseMultiplication();
    while (this.check('OP') && ['+', '-'].includes(String(this.peek().value))) {
      const op = this.tokens[this.pos++]!.value as '+' | '-';
      const right = this.parseMultiplication();
      expr = { type: 'BINARY_OP', op, left: expr, right };
    }
    return expr;
  }

  private parseMultiplication(): ExpressionAst {
    let expr = this.parseUnary();
    while (
      (this.check('OP') && ['/', '%'].includes(String(this.peek().value))) ||
      this.check('STAR')
    ) {
      const opToken = this.tokens[this.pos++]!;
      const op = opToken.type === 'STAR' ? '*' : (opToken.value as '/' | '%');
      const right = this.parseUnary();
      expr = { type: 'BINARY_OP', op, left: expr, right };
    }
    return expr;
  }

  private parseUnary(): ExpressionAst {
    if (this.check('OP') && this.peek().value === '-') {
      this.pos++;
      const operand = this.parseUnary();
      return { type: 'UNARY_OP', op: '-', operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionAst {
    if (this.match('NUMBER')) {
      return { type: 'LITERAL', value: this.previous().value as number, rawType: 'NUMBER' };
    }
    if (this.match('STRING')) {
      return { type: 'LITERAL', value: this.previous().value as string, rawType: 'STRING' };
    }
    if (this.match('KEYWORD', 'TRUE')) {
      return { type: 'LITERAL', value: true, rawType: 'BOOLEAN' };
    }
    if (this.match('KEYWORD', 'FALSE')) {
      return { type: 'LITERAL', value: false, rawType: 'BOOLEAN' };
    }
    if (this.match('KEYWORD', 'NULL')) {
      return { type: 'LITERAL', value: null, rawType: 'NULL' };
    }
    if (this.match('KEYWORD', 'DATE')) {
      const str = this.consume('STRING', undefined, 'Expected date string literal');
      return { type: 'LITERAL', value: str.value as string, rawType: 'DATE' };
    }

    // Aggregates: SUM, AVG, COUNT, MIN, MAX
    if (
      this.check('KEYWORD') &&
      ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(String(this.peek().value))
    ) {
      const fn = this.tokens[this.pos++]!.value as AggregateAst['func'];
      this.consume('LPAREN', '(', `Expected '(' after ${fn}`);
      let arg: ExpressionAst;
      if (fn === 'COUNT' && this.match('STAR')) {
        arg = { type: 'STAR' };
      } else {
        arg = this.parseExpression();
      }
      this.consume('RPAREN', ')', 'Expected closing parenthesis');
      return { type: 'AGGREGATE', func: fn, arg };
    }

    // Identifiers or unreserved keywords as column names
    if (this.check('IDENTIFIER') || this.check('KEYWORD')) {
      const ident = String(this.tokens[this.pos++]!.value);
      return { type: 'COLUMN', name: ident };
    }

    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', ')', 'Expected closing parenthesis');
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().value}`);
  }
}

// ============================================================================
// 5. Query Execution Engine
// ============================================================================

export function resolveColumnIndex(name: string, colCount: number, startColumn = 0): number {
  const upper = name.toUpperCase();
  // ColN (e.g. Col1 -> 0)
  if (/^COL\d+$/.test(upper)) {
    const idx = parseInt(upper.slice(3), 10) - 1;
    if (idx < 0 || idx >= colCount) throw new Error(`Column out of range: ${name}`);
    return idx;
  }
  // Column letter (e.g. A, B, AA)
  if (/^[A-Z]+$/.test(upper)) {
    const sheetIdx = colLetterToIndex(upper);
    if (sheetIdx >= startColumn && sheetIdx < startColumn + colCount) {
      return sheetIdx - startColumn;
    }
    if (sheetIdx >= 0 && sheetIdx < colCount) {
      return sheetIdx;
    }
    throw new Error(`Column not found in data range: ${name}`);
  }
  throw new Error(`Unrecognized column identifier: ${name}`);
}

export function resolveAstColumns(node: ExpressionAst | null | undefined, colCount: number, startCol: number): void {
  if (!node) return;
  if (node.type === 'COLUMN') {
    node.colIndex = resolveColumnIndex(node.name, colCount, startCol);
  } else if (node.type === 'AGGREGATE') {
    resolveAstColumns(node.arg, colCount, startCol);
  } else if (node.type === 'BINARY_OP') {
    resolveAstColumns(node.left, colCount, startCol);
    resolveAstColumns(node.right, colCount, startCol);
  } else if (node.type === 'UNARY_OP') {
    resolveAstColumns(node.operand, colCount, startCol);
  }
}

export function evaluateScalarExpr(expr: ExpressionAst, rowValues: unknown[]): unknown {
  if (expr.type === 'LITERAL') return expr.value;
  if (expr.type === 'COLUMN') {
    return expr.colIndex !== undefined ? rowValues[expr.colIndex] : null;
  }
  if (expr.type === 'UNARY_OP') {
    const val = evaluateScalarExpr(expr.operand, rowValues);
    if (expr.op === '-') return -Number(val);
    if (expr.op === 'NOT') return !val;
    if (expr.op === 'IS NULL') return val === null || val === undefined || val === '';
    if (expr.op === 'IS NOT NULL') return val !== null && val !== undefined && val !== '';
  }
  if (expr.type === 'BINARY_OP') {
    const l = evaluateScalarExpr(expr.left, rowValues);
    const r = evaluateScalarExpr(expr.right, rowValues);
    switch (expr.op) {
      case 'AND': return Boolean(l && r);
      case 'OR': return Boolean(l || r);
      case '=': return l === r || String(l) === String(r);
      case '!=':
      case '<>': return l !== r && String(l) !== String(r);
      case '<': return (l as number) < (r as number);
      case '<=': return (l as number) <= (r as number);
      case '>': return (l as number) > (r as number);
      case '>=': return (l as number) >= (r as number);
      case '+': return Number(l) + Number(r);
      case '-': return Number(l) - Number(r);
      case '*': return Number(l) * Number(r);
      case '/': return Number(r) === 0 ? null : Number(l) / Number(r);
      case '%': return Number(l) % Number(r);
      case 'CONTAINS': return String(l ?? '').includes(String(r ?? ''));
      case 'STARTS WITH': return String(l ?? '').startsWith(String(r ?? ''));
      case 'ENDS WITH': return String(l ?? '').endsWith(String(r ?? ''));
      case 'LIKE': {
        const pattern = '^' + String(r).replace(/%/g, '.*').replace(/_/g, '.') + '$';
        return new RegExp(pattern, 'i').test(String(l ?? ''));
      }
      case 'MATCHES': return new RegExp(String(r)).test(String(l ?? ''));
    }
  }
  return null;
}

export function containsAggregate(node: ExpressionAst | null | undefined): boolean {
  if (!node) return false;
  if (node.type === 'AGGREGATE') return true;
  if (node.type === 'BINARY_OP') return containsAggregate(node.left) || containsAggregate(node.right);
  if (node.type === 'UNARY_OP') return containsAggregate(node.operand);
  return false;
}

export function evaluateAggregateExpr(
  expr: ExpressionAst,
  groupRows: unknown[][],
  representative: unknown[]
): unknown {
  if (expr.type === 'AGGREGATE') {
    const fn = expr.func;
    if (fn === 'COUNT') {
      if (expr.arg.type === 'STAR') return groupRows.length;
      return groupRows.filter((r) => {
        const v = evaluateScalarExpr(expr.arg, r);
        return v !== null && v !== undefined && v !== '';
      }).length;
    }
    const values = groupRows
      .map((r) => evaluateScalarExpr(expr.arg, r))
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    if (fn === 'SUM') return values.reduce((acc, x) => acc + x, 0);
    if (fn === 'AVG') return values.length === 0 ? null : values.reduce((acc, x) => acc + x, 0) / values.length;
    if (fn === 'MIN') return values.length === 0 ? null : Math.min(...values);
    if (fn === 'MAX') return values.length === 0 ? null : Math.max(...values);
  }
  if (expr.type === 'BINARY_OP') {
    const l = evaluateAggregateExpr(expr.left, groupRows, representative);
    const r = evaluateAggregateExpr(expr.right, groupRows, representative);
    switch (expr.op) {
      case '+': return Number(l) + Number(r);
      case '-': return Number(l) - Number(r);
      case '*': return Number(l) * Number(r);
      case '/': return Number(r) === 0 ? null : Number(l) / Number(r);
      case '%': return Number(l) % Number(r);
    }
  }
  return evaluateScalarExpr(expr, representative);
}

export function executeQueryEngine(
  rawMatrix: unknown[][],
  queryString: string | undefined,
  headersParam: number | undefined,
  startColumn = 0
): unknown[][] {
  const rowCount = rawMatrix.length;
  if (rowCount === 0) return [];
  const colCount = rawMatrix[0]?.length || 0;
  const firstRow = rawMatrix[0];

  // 1. Header Row Extraction
  let headersCount = 0;
  if (typeof headersParam === 'number' && headersParam >= 0) {
    headersCount = Math.floor(headersParam);
  } else {
    // Auto-detection: row 0 is text strings and rows below contain numbers/booleans
    if (rowCount > 1 && firstRow && firstRow.every((c) => typeof c === 'string')) {
      const hasNumberBelow = rawMatrix.slice(1).some((row) =>
        row.some((c) => typeof c === 'number' || typeof c === 'boolean')
      );
      if (hasNumberBelow || (queryString && queryString.trim() !== '')) {
        headersCount = 1;
      }
    }
  }

  const sourceHeaders = headersCount > 0 && firstRow ? firstRow.map((c) => String(c ?? '')) : [];
  const dataRows = rawMatrix.slice(headersCount);

  // Return raw rows if query string is empty
  if (!queryString || queryString.trim() === '') {
    return headersCount > 0 ? [sourceHeaders, ...dataRows] : dataRows;
  }

  // 2. Parse Query
  const tokens = tokenize(queryString);
  const parser = new QueryParser(tokens);
  const ast = parser.parse();

  // Resolve AST columns
  if (ast.select) ast.select.forEach((s) => resolveAstColumns(s, colCount, startColumn));
  if (ast.where) resolveAstColumns(ast.where, colCount, startColumn);
  if (ast.groupBy) ast.groupBy.forEach((g) => resolveAstColumns(g, colCount, startColumn));
  if (ast.orderBy) ast.orderBy.forEach((o) => resolveAstColumns(o.expr, colCount, startColumn));

  // 3. WHERE Filtering
  let filteredRows = dataRows;
  if (ast.where) {
    filteredRows = filteredRows.filter((row) => Boolean(evaluateScalarExpr(ast.where!, row)));
  }

  // 4. Grouping & Aggregates
  const hasAggregates =
    (ast.select && ast.select.some((s) => containsAggregate(s))) ||
    (ast.orderBy && ast.orderBy.some((o) => containsAggregate(o.expr)));
  const hasGroupBy = Boolean(ast.groupBy && ast.groupBy.length > 0);

  interface GroupEntry {
    rows: unknown[][];
    representative: unknown[];
  }
  let groups: GroupEntry[] = [];

  if (hasGroupBy || hasAggregates) {
    if (hasGroupBy) {
      const map = new Map<string, unknown[][]>();
      for (const row of filteredRows) {
        const key = ast.groupBy!.map((g) => String(evaluateScalarExpr(g, row))).join('|||');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(row);
      }
      for (const rows of map.values()) {
        groups.push({ rows, representative: rows[0] ?? [] });
      }
    } else {
      groups.push({ rows: filteredRows, representative: filteredRows[0] ?? [] });
    }
  }

  // 5. ORDER BY Sorting
  if (ast.orderBy && ast.orderBy.length > 0) {
    if (hasGroupBy || hasAggregates) {
      groups.sort((a, b) => {
        for (const item of ast.orderBy!) {
          const valA = evaluateAggregateExpr(item.expr, a.rows, a.representative);
          const valB = evaluateAggregateExpr(item.expr, b.rows, b.representative);
          let cmp = 0;
          if (typeof valA === 'number' && typeof valB === 'number') cmp = valA - valB;
          else cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
          if (cmp !== 0) return item.direction === 'DESC' ? -cmp : cmp;
        }
        return 0;
      });
    } else {
      filteredRows.sort((a, b) => {
        for (const item of ast.orderBy!) {
          const valA = evaluateScalarExpr(item.expr, a);
          const valB = evaluateScalarExpr(item.expr, b);
          let cmp = 0;
          if (typeof valA === 'number' && typeof valB === 'number') cmp = valA - valB;
          else cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
          if (cmp !== 0) return item.direction === 'DESC' ? -cmp : cmp;
        }
        return 0;
      });
    }
  }

  // 6. OFFSET & LIMIT
  if (hasGroupBy || hasAggregates) {
    if (ast.offset) groups = groups.slice(ast.offset);
    if (ast.limit !== null && ast.limit !== undefined) groups = groups.slice(0, ast.limit);
  } else {
    if (ast.offset) filteredRows = filteredRows.slice(ast.offset);
    if (ast.limit !== null && ast.limit !== undefined) filteredRows = filteredRows.slice(0, ast.limit);
  }

  // 7. SELECT Projection
  const itemsToProject: ExpressionAst[] =
    ast.isSelectAll || (ast.select.length === 1 && ast.select[0]?.type === 'STAR')
      ? (hasGroupBy
          ? ast.groupBy!
          : Array.from({ length: colCount }, (_, idx): ColumnAst => ({
              type: 'COLUMN',
              colIndex: idx,
              name: indexToColLetter(idx),
            })))
      : ast.select;

  const projectedRows: unknown[][] = [];
  if (hasGroupBy || hasAggregates) {
    for (const group of groups) {
      const rowResult: unknown[] = [];
      for (const sel of itemsToProject) {
        rowResult.push(evaluateAggregateExpr(sel, group.rows, group.representative));
      }
      projectedRows.push(rowResult);
    }
  } else {
    for (const row of filteredRows) {
      const rowResult: unknown[] = [];
      for (const sel of itemsToProject) {
        rowResult.push(evaluateScalarExpr(sel, row));
      }
      projectedRows.push(rowResult);
    }
  }

  // 8. Headers & LABEL Construction
  const headerRow: string[] = [];
  let allLabelsEmpty = ast.labels.size > 0;

  for (const item of itemsToProject) {
    const canon = canonicalExpressionString(item);
    if (ast.labels.has(canon)) {
      const lbl = ast.labels.get(canon)!;
      headerRow.push(lbl);
      if (lbl !== '') allLabelsEmpty = false;
    } else {
      allLabelsEmpty = false;
      if (item.type === 'COLUMN' && item.colIndex !== undefined) {
        headerRow.push(sourceHeaders[item.colIndex] ?? item.name);
      } else if (item.type === 'AGGREGATE') {
        headerRow.push(`${item.func.toLowerCase()} ${canonicalExpressionString(item.arg)}`);
      } else {
        headerRow.push(canon);
      }
    }
  }

  const resultMatrix: unknown[][] = [];
  if (headersCount > 0 && !allLabelsEmpty) {
    resultMatrix.push(headerRow);
  }
  for (const r of projectedRows) {
    resultMatrix.push(r);
  }

  return resultMatrix;
}

// ============================================================================
// 6. Univer Engine Formula Subclass & Value Object Serialization
// ============================================================================

export function toBaseValueObject(val: unknown): BaseValueObject {
  if (val && typeof val === 'object' && 'isValueObject' in (val as Record<string, unknown>)) {
    return val as BaseValueObject;
  }
  if (val === null || val === undefined || val === '') {
    return NullValueObject.create();
  }
  if (typeof val === 'number') {
    return NumberValueObject.create(val);
  }
  if (typeof val === 'boolean') {
    return BooleanValueObject.create(val);
  }
  return StringValueObject.create(String(val));
}

export function createSpillArray(matrix: unknown[][]): ArrayValueObject {
  const valueObjects: BaseValueObject[][] = matrix.map((row) => row.map(toBaseValueObject));
  return ArrayValueObject.create({
    calculateValueList: valueObjects,
    rowCount: valueObjects.length,
    columnCount: valueObjects[0]?.length || 0,
    unitId: '',
    sheetId: '',
    row: -1,
    column: -1,
  });
}

export class QueryFunction extends BaseFunction {
  override needsReferenceObject = true;
  override minParams = 1;
  override maxParams = 3;

  override calculate(
    rawData: BaseValueObject,
    rawQuery?: BaseValueObject,
    rawHeaders?: BaseValueObject
  ): BaseValueObject {
    if (!rawData) return ErrorValueObject.create(ErrorType.VALUE);
    if (rawData.isError()) return rawData;
    if (rawQuery?.isError()) return rawQuery;
    if (rawHeaders?.isError()) return rawHeaders;

    // 1. Extract 2D Data Matrix and startColumn
    let startColumn = 0;
    let arrayVal: ArrayValueObject | null = null;

    if (rawData.isReferenceObject?.()) {
      const ref = rawData as unknown as {
        getRangeData?(): { startColumn?: number };
        toArrayValueObject?(): ArrayValueObject;
      };
      startColumn = ref.getRangeData?.()?.startColumn ?? 0;
      arrayVal = ref.toArrayValueObject ? ref.toArrayValueObject() : null;
    } else if (rawData.isArray?.()) {
      arrayVal = rawData as ArrayValueObject;
    }

    let matrix: unknown[][];
    if (arrayVal) {
      matrix = arrayVal.getArrayValue().map((row) => row.map((c) => (c ? c.getValue() : null)));
    } else {
      matrix = [[rawData.getValue()]];
    }

    // 2. Query string & headers
    const queryString = rawQuery && !rawQuery.isNull() ? String(rawQuery.getValue()) : '';
    const headersCount =
      rawHeaders && !rawHeaders.isNull() ? Number(rawHeaders.getValue()) : undefined;

    // 3. Execution
    try {
      const outputMatrix = executeQueryEngine(matrix, queryString, headersCount, startColumn);
      if (outputMatrix.length === 0) {
        return ErrorValueObject.create(ErrorType.NA);
      }
      return createSpillArray(outputMatrix);
    } catch {
      return ErrorValueObject.create(ErrorType.VALUE);
    }
  }
}

// ============================================================================
// 7. Univer Registration & Disposable Installation
// ============================================================================

export function installQueryFunction(runtime: UniverRuntime): { dispose(): void } {
  const functionService = runtime.univer.__getInjector().get(IFunctionService);
  const name = 'QUERY';
  const original = functionService.getExecutor(name) ?? undefined;
  const executor = new QueryFunction(name);

  functionService.registerExecutors(executor);

  const descDisposable = functionService.registerDescriptions({
    functionName: name,
    functionType: FunctionType.Lookup,
    description: 'Runs a Google Visualization API query language query across an array or range.',
    abstract: 'Runs a Google Visualization API query across an array or range.',
    functionParameter: [
      {
        name: 'data',
        detail: 'The range of cells to perform the query on.',
        example: 'A1:E20',
        require: 1,
        repeat: 0,
      },
      {
        name: 'query',
        detail: 'The query to perform, written in the query language.',
        example: '"SELECT A, SUM(B) WHERE C > 100 GROUP BY A"',
        require: 0,
        repeat: 0,
      },
      {
        name: 'headers',
        detail: 'The number of header rows at top of data. Optional; if omitted or -1, auto-detected.',
        example: '1',
        require: 0,
        repeat: 0,
      },
    ],
  });

  const timer = setTimeout(() => {
    if (functionService.getExecutor(name) !== executor) {
      functionService.registerExecutors(executor);
    }
  }, 0);

  return {
    dispose() {
      clearTimeout(timer);
      descDisposable.dispose();
      if (original) functionService.registerExecutors(original);
      else functionService.unregisterExecutors(name);
    },
  };
}
