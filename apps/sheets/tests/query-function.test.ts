import {
  ArrayValueObject,
  BooleanValueObject,
  ErrorType,
  ErrorValueObject,
  NumberValueObject,
  StringValueObject,
} from '@univerjs/engine-formula';
import { describe, expect, it } from 'vitest';

import {
  QueryFunction,
  colLetterToIndex,
  createSpillArray,
  executeQueryEngine,
  indexToColLetter,
  tokenize,
} from '../src/renderer/functions/query-function';

// ============================================================================
// Test Fixtures
// ============================================================================

const EMPLOYEE_TABLE: (string | number | boolean | null)[][] = [
  ['Dept', 'Name', 'Salary', 'Active', 'Bonus'],
  ['Engineering', 'Alice', 120000, true, 15000],
  ['Engineering', 'Bob', 110000, true, 10000],
  ['Marketing', 'Charlie', 90000, false, 5000],
  ['Marketing', 'Diana', 95000, true, 8000],
  ['Sales', 'Evan', 85000, true, 12000],
  ['Sales', 'Fiona', 80000, false, null],
];

function runQuery(
  matrix: unknown[][],
  query?: string,
  headers?: number,
  startColumn = 0
): unknown[][] {
  return executeQueryEngine(matrix, query, headers, startColumn);
}

function runQueryFunction(
  data: unknown[][],
  queryString?: string,
  headers?: number,
  startColumn = 0
) {
  const executor = new QueryFunction('QUERY');
  const arr = createSpillArray(data);
  const q = queryString !== undefined ? StringValueObject.create(queryString) : undefined;
  const h = headers !== undefined ? NumberValueObject.create(headers) : undefined;

  // Mock reference if startColumn > 0
  const refMock = {
    isReferenceObject: () => true,
    isError: () => false,
    isArray: () => false,
    getRangeData: () => ({ startColumn, startRow: 0 }),
    toArrayValueObject: () => arr,
  };

  return executor.calculate(
    startColumn > 0 ? (refMock as never) : arr,
    q as never,
    h as never
  );
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Coordinate & Tokenizer Basics', () => {
  it('converts column letters to 0-based indices and back', () => {
    expect(colLetterToIndex('A')).toBe(0);
    expect(colLetterToIndex('B')).toBe(1);
    expect(colLetterToIndex('Z')).toBe(25);
    expect(colLetterToIndex('AA')).toBe(26);

    expect(indexToColLetter(0)).toBe('A');
    expect(indexToColLetter(1)).toBe('B');
    expect(indexToColLetter(25)).toBe('Z');
    expect(indexToColLetter(26)).toBe('AA');
  });

  it('tokenizes SQL clauses, strings, operators, and functions', () => {
    const tokens = tokenize("SELECT A, Col2, SUM(C) WHERE D > 100 AND E = 'Sales'");
    expect(tokens.map((t) => t.type)).toEqual([
      'KEYWORD', 'IDENTIFIER', 'COMMA', 'IDENTIFIER', 'COMMA',
      'KEYWORD', 'LPAREN', 'IDENTIFIER', 'RPAREN',
      'KEYWORD', 'IDENTIFIER', 'OP', 'NUMBER',
      'KEYWORD', 'IDENTIFIER', 'OP', 'STRING', 'EOF',
    ]);
  });
});

describe('Feature 2.1: SELECT Projections & Arithmetic', () => {
  it('handles SELECT * returning full table with headers', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT *', 1);
    expect(result.length).toBe(7);
    expect(result[0]).toEqual(['Dept', 'Name', 'Salary', 'Active', 'Bonus']);
    expect(result[1]).toEqual(['Engineering', 'Alice', 120000, true, 15000]);
  });

  it('selects specific column letters and reorders them', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT B, A', 1);
    expect(result[0]).toEqual(['Name', 'Dept']);
    expect(result[1]).toEqual(['Alice', 'Engineering']);
    expect(result[2]).toEqual(['Bob', 'Engineering']);
  });

  it('selects columns via Col1, Col2 notation', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT Col2, Col3', 1);
    expect(result[0]).toEqual(['Name', 'Salary']);
    expect(result[1]).toEqual(['Alice', 120000]);
  });

  it('evaluates arithmetic expressions in SELECT projection', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT B, C * 1.1, C + E', 1);
    expect(result[0]).toEqual(['Name', '(C * 1.1)', '(C + E)']);
    expect(result[1]).toEqual(['Alice', 132000, 135000]);
  });

  it('returns data as-is when query string is omitted or blank', () => {
    const result1 = runQuery(EMPLOYEE_TABLE, '', 1);
    const result2 = runQuery(EMPLOYEE_TABLE, undefined, 1);
    expect(result1).toEqual(EMPLOYEE_TABLE);
    expect(result2).toEqual(EMPLOYEE_TABLE);
  });
});

describe('Feature 2.2: WHERE Filtering & Predicates', () => {
  it('filters by numeric comparisons (=, >, <=, !=)', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT B, C WHERE C >= 110000', 1);
    expect(result.slice(1)).toEqual([
      ['Alice', 120000],
      ['Bob', 110000],
    ]);
  });

  it('filters by string equality and boolean literals', () => {
    const result = runQuery(EMPLOYEE_TABLE, "SELECT B WHERE A = 'Marketing' AND D = TRUE", 1);
    expect(result.slice(1)).toEqual([['Diana']]);
  });

  it('evaluates logical OR and compound expressions', () => {
    const result = runQuery(
      EMPLOYEE_TABLE,
      "SELECT B, A WHERE (A = 'Sales' OR A = 'Marketing') AND C > 85000",
      1
    );
    expect(result.slice(1)).toEqual([
      ['Charlie', 'Marketing'],
      ['Diana', 'Marketing'],
    ]);
  });

  it('supports CONTAINS, STARTS WITH, and ENDS WITH string matches', () => {
    const containsRes = runQuery(EMPLOYEE_TABLE, "SELECT B WHERE B CONTAINS 'li'", 1);
    expect(containsRes.slice(1)).toEqual([['Alice'], ['Charlie']]);

    const startsRes = runQuery(EMPLOYEE_TABLE, "SELECT B WHERE B STARTS WITH 'D'", 1);
    expect(startsRes.slice(1)).toEqual([['Diana']]);

    const endsRes = runQuery(EMPLOYEE_TABLE, "SELECT B WHERE B ENDS WITH 'an'", 1);
    expect(endsRes.slice(1)).toEqual([['Evan']]);
  });

  it('supports IS NULL and IS NOT NULL predicates', () => {
    const nullRes = runQuery(EMPLOYEE_TABLE, 'SELECT B WHERE E IS NULL', 1);
    expect(nullRes.slice(1)).toEqual([['Fiona']]);

    const notNullRes = runQuery(EMPLOYEE_TABLE, 'SELECT B WHERE E IS NOT NULL', 1);
    expect(notNullRes.slice(1).length).toBe(5);
  });
});

describe('Feature 2.3: GROUP BY & Aggregations', () => {
  it('groups by column and computes SUM and AVG', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT A, SUM(C), AVG(C) GROUP BY A', 1);
    expect(result[0]).toEqual(['Dept', 'sum C', 'avg C']);
    expect(result.slice(1)).toEqual([
      ['Engineering', 230000, 115000],
      ['Marketing', 185000, 92500],
      ['Sales', 165000, 82500],
    ]);
  });

  it('computes global aggregates when no GROUP BY is specified', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT COUNT(*), MIN(C), MAX(C), SUM(C)', 1);
    expect(result[0]).toEqual(['count *', 'min C', 'max C', 'sum C']);
    expect(result[1]).toEqual([6, 80000, 120000, 580000]);
  });

  it('handles COUNT of columns ignoring null values', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT COUNT(E)', 1);
    expect(result[1]).toEqual([5]); // Fiona has bonus null
  });
});

describe('Feature 2.4: ORDER BY, LIMIT, and OFFSET', () => {
  it('sorts rows descending and ascending', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT B, C ORDER BY C DESC', 1);
    expect(result[1]).toEqual(['Alice', 120000]);
    expect(result[6]).toEqual(['Fiona', 80000]);
  });

  it('sorts grouped queries by aggregate value', () => {
    const result = runQuery(
      EMPLOYEE_TABLE,
      'SELECT A, SUM(C) GROUP BY A ORDER BY SUM(C) ASC',
      1
    );
    expect(result.slice(1)).toEqual([
      ['Sales', 165000],
      ['Marketing', 185000],
      ['Engineering', 230000],
    ]);
  });

  it('applies LIMIT and OFFSET pagination correctly', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT B ORDER BY C DESC LIMIT 2 OFFSET 1', 1);
    expect(result.slice(1)).toEqual([['Bob'], ['Diana']]);
  });
});

describe('Feature 2.5: LABEL Column Renaming', () => {
  it('renames aggregate and standard column headers', () => {
    const result = runQuery(
      EMPLOYEE_TABLE,
      "SELECT A, SUM(C) GROUP BY A LABEL A 'Department Name', SUM(C) 'Total Payroll'",
      1
    );
    expect(result[0]).toEqual(['Department Name', 'Total Payroll']);
  });

  it('respects headers=0 parameter suppressing header row', () => {
    const result = runQuery(EMPLOYEE_TABLE, 'SELECT A, B', 0);
    expect(result.length).toBe(7); // all 7 data rows, no header row
    expect(result[0]).toEqual(['Dept', 'Name']);
  });
});

describe('Feature 2.6: Univer Spill & Error Handling', () => {
  it('returns a 2D ArrayValueObject triggering Univer automatic spill', () => {
    const valueObj = runQueryFunction(EMPLOYEE_TABLE, 'SELECT A, B WHERE C > 100000', 1);
    expect(valueObj.isArray()).toBe(true);
    const arr = valueObj as ArrayValueObject;
    expect(arr.getRowCount()).toBe(3); // header + 2 engineering rows
    expect(arr.getColumnCount()).toBe(2);
    expect(arr.get(0, 0)?.getValue()).toBe('Dept');
    expect(arr.get(1, 0)?.getValue()).toBe('Engineering');
    expect(arr.get(1, 1)?.getValue()).toBe('Alice');
  });

  it('resolves sheet coordinate startColumn for sub-range queries', () => {
    // Range starts at Column C (startColumn = 2): [Salary, Active, Bonus]
    const subTable = [
      ['Salary', 'Active', 'Bonus'],
      [120000, true, 15000],
      [110000, true, 10000],
    ];
    // Querying with sheet column letter C
    const result = runQuery(subTable, 'SELECT C WHERE C > 115000', 1, 2);
    expect(result[0]).toEqual(['Salary']);
    expect(result[1]).toEqual([120000]);
  });

  it('returns #VALUE! error on syntax errors', () => {
    const result = runQueryFunction(EMPLOYEE_TABLE, 'SELECT A WHERE');
    expect(result.isError()).toBe(true);
    expect((result as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
  });

  it('returns #VALUE! error when referencing out of bounds column', () => {
    const result = runQueryFunction(EMPLOYEE_TABLE, 'SELECT Z');
    expect(result.isError()).toBe(true);
    expect((result as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
  });

  it('returns #N/A when query has 0 matching rows and headers=0', () => {
    const result = runQueryFunction(EMPLOYEE_TABLE, 'SELECT * WHERE C = 999999', 0);
    expect(result.isError()).toBe(true);
    expect((result as ErrorValueObject).getValue()).toBe(ErrorType.NA);
  });
});
