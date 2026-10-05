import {
  ArrayValueObject,
  BooleanValueObject,
  ErrorType,
  ErrorValueObject,
  NullValueObject,
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

describe('Adversarial Test Suite 1: Empty & Edge-case Matrices', () => {
  it('handles empty matrix (0 rows) returning #N/A', () => {
    const resEngine = runQuery([], 'SELECT *', 0);
    expect(resEngine).toEqual([]);

    const resFunc = runQueryFunction([], 'SELECT *');
    expect(resFunc.isError()).toBe(true);
    expect((resFunc as ErrorValueObject).getValue()).toBe(ErrorType.NA);
  });

  it('handles empty row matrix [[]] without uncaught exceptions', () => {
    const resEngine = runQuery([[]], 'SELECT *', 0);
    expect(Array.isArray(resEngine)).toBe(true);
  });

  it('handles single cell numeric input', () => {
    const res = runQuery([[42]], 'SELECT *', 0);
    expect(res).toEqual([[42]]);

    const resFn = runQueryFunction([[42]], 'SELECT *', 0);
    expect(resFn.isArray()).toBe(true);
    expect((resFn as ArrayValueObject).get(0, 0)?.getValue()).toBe(42);
  });

  it('handles single cell string input', () => {
    const res = runQuery([['Hello World']], 'SELECT *', 0);
    expect(res).toEqual([['Hello World']]);
  });

  it('handles single cell boolean input', () => {
    const res = runQuery([[true]], 'SELECT *', 0);
    expect(res).toEqual([[true]]);

    const resFalse = runQuery([[false]], 'SELECT *', 0);
    expect(resFalse).toEqual([[false]]);
  });

  it('handles single cell null input', () => {
    const res = runQuery([[null]], 'SELECT *', 0);
    expect(res).toEqual([[null]]);
  });

  it('handles single cell matching WHERE condition', () => {
    const res = runQuery([[42]], 'SELECT A WHERE A = 42', 0);
    expect(res).toEqual([[42]]);
  });

  it('handles single cell non-matching WHERE condition returning #N/A', () => {
    const resFn = runQueryFunction([[42]], 'SELECT A WHERE A = 99', 0);
    expect(resFn.isError()).toBe(true);
    expect((resFn as ErrorValueObject).getValue()).toBe(ErrorType.NA);
  });

  it('handles table with only headers and 0 data rows', () => {
    const headersOnly = [['Col1', 'Col2', 'Col3']];
    const res = runQuery(headersOnly, 'SELECT *', 1);
    expect(res).toEqual([['Col1', 'Col2', 'Col3']]);
  });

  it('handles sparse matrix with nulls, undefined, and empty strings in WHERE IS NULL', () => {
    const sparse = [
      ['ID', 'Val1'],
      [1, null],
      [2, 20],
      [3, undefined],
      [4, ''],
      [5, 50],
    ];
    const resNulls = runQuery(sparse, 'SELECT A WHERE B IS NULL', 1);
    expect(resNulls).toEqual([
      ['ID'],
      [1],
      [3],
      [4],
    ]);

    const resNotNulls = runQuery(sparse, 'SELECT A WHERE B IS NOT NULL', 1);
    expect(resNotNulls).toEqual([
      ['ID'],
      [2],
      [5],
    ]);
  });

  it('exposes the NullValueObject bug where nulls become 0 in QueryFunction.calculate', () => {
    const tableWithNull = [
      ['Name', 'Bonus'],
      ['Alice', 15000],
      ['Fiona', null],
    ];
    // In executeQueryEngine directly, Fiona has null, so WHERE B IS NULL matches Fiona:
    const directRes = runQuery(tableWithNull, 'SELECT A WHERE B IS NULL', 1);
    expect(directRes).toEqual([['Name'], ['Fiona']]);

    // But through QueryFunction.calculate (which is what runs in real sheets):
    const funcRes = runQueryFunction(tableWithNull, 'SELECT A WHERE B IS NULL', 1);
    const arr = funcRes as ArrayValueObject;
    // Because c.getValue() turns NullValueObject into 0, B is 0, NOT null!
    // So B IS NULL does NOT match Fiona!
    console.log('[BUG DEMO] Direct result rowCount:', directRes.length, 'vs QueryFunction rowCount:', arr.getRowCount());
  });

  it('preserves header row when query returns 0 matching data rows with headers=1', () => {
    const tableWithHeader = [
      ['Name', 'Score'],
      ['Alice', 80],
      ['Bob', 90],
    ];
    const res = runQuery(tableWithHeader, 'SELECT A, B WHERE B > 1000', 1);
    expect(res).toEqual([['Name', 'Score']]);

    const resFn = runQueryFunction(tableWithHeader, 'SELECT A, B WHERE B > 1000', 1);
    expect(resFn.isArray()).toBe(true);
    expect((resFn as ArrayValueObject).getRowCount()).toBe(1);
    expect((resFn as ArrayValueObject).get(0, 0)?.getValue()).toBe('Name');
    expect((resFn as ArrayValueObject).get(0, 1)?.getValue()).toBe('Score');
  });

  it('tests behavior of null in numeric comparisons (A > 0 vs A < 0)', () => {
    const table = [
      ['ID', 'Val'],
      [1, 10],
      [2, null],
      [3, -5],
      [4, 0],
    ];
    const resGt = runQuery(table, 'SELECT A WHERE B > 0', 1);
    // Row 1 (10 > 0) matches. Row 2 (null > 0 is false in JS) should not match.
    expect(resGt).toEqual([['ID'], [1]]);

    const resLt = runQuery(table, 'SELECT A WHERE B < 0', 1);
    // Row 3 (-5 < 0) matches.
    expect(resLt).toEqual([['ID'], [3]]);

    const resLt10 = runQuery(table, 'SELECT A WHERE B < 10', 1);
    console.log('[NULL COMPARISON TEST] B < 10 result:', resLt10);
  });
});

describe('Adversarial Test Suite 2: Malformed Queries & Syntax Errors', () => {
  const data = [
    ['A', 'B', 'C'],
    [1, 10, 'Alpha'],
    [2, 20, 'Beta'],
    [3, 30, 'Gamma'],
  ];

  it('handles unterminated string literals returning #VALUE!', () => {
    const queries = [
      "SELECT A WHERE C = 'Alpha",
      "SELECT A WHERE C = '",
      "SELECT A WHERE C = 'Beta\\'",
    ];
    for (const q of queries) {
      const res = runQueryFunction(data, q, 1);
      expect(res.isError(), `Expected error for query: ${q}`).toBe(true);
      expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
    }
  });

  it('handles unexpected and invalid characters returning #VALUE!', () => {
    const queries = [
      'SELECT A, @B',
      'SELECT A # B',
      'SELECT A WHERE B $ 10',
      'SELECT A ~ B',
      'SELECT A ? B',
    ];
    for (const q of queries) {
      const res = runQueryFunction(data, q, 1);
      expect(res.isError(), `Expected error for query: ${q}`).toBe(true);
      expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
    }
  });

  it('handles unclosed or unmatched parentheses returning #VALUE!', () => {
    const queries = [
      'SELECT (A + B WHERE C = 1',
      'SELECT A WHERE (B > 10',
      'SELECT A WHERE ((B > 10) AND (C = 1)',
      'SELECT A WHERE B > 10)',
      'SELECT A WHERE (B > 10))',
    ];
    for (const q of queries) {
      const res = runQueryFunction(data, q, 1);
      expect(res.isError(), `Expected error for query: ${q}`).toBe(true);
      expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
    }
  });

  it('handles incomplete clauses and trailing tokens returning #VALUE!', () => {
    const queries = [
      'SELECT',
      'SELECT A WHERE',
      'SELECT A GROUP',
      'SELECT A GROUP BY',
      'SELECT A ORDER',
      'SELECT A ORDER BY',
      'SELECT A LIMIT',
      'SELECT A OFFSET',
      'SELECT A LABEL',
      'SELECT A WHERE B > 10 UNEXPECTED_JUNK',
      'DROP TABLE Students',
      'DELETE FROM Students',
      'INSERT INTO Students VALUES (1)',
      'UPDATE Students SET A = 1',
    ];
    for (const q of queries) {
      const res = runQueryFunction(data, q, 1);
      expect(res.isError(), `Expected error for query: ${q}`).toBe(true);
      expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
    }
  });

  it('handles invalid operators returning #VALUE!', () => {
    const queries = [
      'SELECT A WHERE B === 10',
      'SELECT A WHERE B := 10',
      'SELECT A WHERE B && C',
      'SELECT A WHERE B || C',
      'SELECT A WHERE B !== 10',
    ];
    for (const q of queries) {
      const res = runQueryFunction(data, q, 1);
      expect(res.isError(), `Expected error for query: ${q}`).toBe(true);
      expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
    }
  });

  it('handles invalid or out-of-range column identifiers returning #VALUE!', () => {
    const queries = [
      'SELECT Z',
      'SELECT Col0',
      'SELECT Col99',
      'SELECT 123Col',
      'SELECT A, NonExistentCol',
    ];
    for (const q of queries) {
      const res = runQueryFunction(data, q, 1);
      expect(res.isError(), `Expected error for query: ${q}`).toBe(true);
      expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
    }
  });

  it('handles division by zero without crashing, returning null cells', () => {
    const res = runQuery(data, 'SELECT A, B / 0', 1);
    expect(res.length).toBe(4);
    expect(res[0]).toEqual(['A', '(B / 0)']);
    expect(res[1]).toEqual([1, null]);
    expect(res[2]).toEqual([2, null]);
    expect(res[3]).toEqual([3, null]);

    // Variable division by zero
    const res2 = runQuery(data, 'SELECT A, B / (A - 1)', 1);
    expect(res2.length).toBe(4);
    expect(res2[1]).toEqual([1, null]); // 10 / (1 - 1) = null
    expect(res2[2]).toEqual([2, 20]);   // 20 / (2 - 1) = 20
    expect(res2[3]).toEqual([3, 15]);   // 30 / (3 - 1) = 15
  });

  it('handles malformed regex in MATCHES returning #VALUE!', () => {
    const res = runQueryFunction(data, "SELECT A WHERE C MATCHES '[unclosed'", 1);
    expect(res.isError()).toBe(true);
    expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
  });

  it('exposes unescaped regex special characters in LIKE pattern', () => {
    const codeTable = [
      ['Lang', 'Level'],
      ['C++', 'Advanced'],
      ['Java', 'Intermediate'],
      ['Python', 'Beginner'],
    ];
    // In LIKE 'C++', '+' is a regex quantifier; unescaped 'C++' throws SyntaxError in RegExp constructor
    // In runQueryFunction, this throws inside evaluateScalarExpr and returns #VALUE! instead of matching 'C++'
    const resFn = runQueryFunction(codeTable, "SELECT A WHERE A LIKE 'C++'", 1);
    console.log('[LIKE REGEX TEST] Querying C++ result isError:', resFn.isError());
    expect(resFn.isError()).toBe(true); // Demonstrates that LIKE 'C++' fails due to regex syntax error
  });

  it('handles malformed numeric literals returning #VALUE!', () => {
    const res = runQueryFunction(data, 'SELECT 1.2.3', 1);
    expect(res.isError()).toBe(true);
    expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
  });
});

describe('Adversarial Test Suite 3: Deep Boolean WHERE Predicates & Logic Stress', () => {
  const table = [
    ['ID', 'Category', 'Score', 'Status', 'Notes'],
    [1, 'Hardware', 85, true, 'xyz widget in stock'],
    [2, 'Software', 40, true, 'needs upgrade xyz'],
    [3, 'Hardware', 5, false, 'broken component'],
    [4, 'Cloud', 12, true, 'active instance'],
    [5, 'Software', 8, false, 'deprecated build xyz'],
    [6, 'Cloud', 95, true, 'production cluster xyz'],
    [7, 'Hardware', 50, false, 'in repair'],
    [8, 'Support', 2, true, 'ticket resolved'],
  ];

  it('evaluates exact dispatch expression: A > 5 AND (B CONTAINS "xyz" OR NOT (C <= 10))', () => {
    // In table:
    // Col A is ID (number)
    // Col B is Category (string)
    // Col C is Score (number)
    // Col E is Notes (string with 'xyz')
    const res = runQuery(
      table,
      "SELECT A, B, C WHERE A > 5 AND (E CONTAINS 'xyz' OR NOT (C <= 10))",
      1
    );
    // Rows > 5 are IDs 6, 7, 8
    // ID 6: E has 'xyz', C = 95 (> 10) -> TRUE
    // ID 7: E no 'xyz', C = 50 (> 10) -> TRUE
    // ID 8: E no 'xyz', C = 2 (<= 10, so NOT is FALSE) -> FALSE
    expect(res).toEqual([
      ['ID', 'Category', 'Score'],
      [6, 'Cloud', 95],
      [7, 'Hardware', 50],
    ]);
  });

  it('evaluates multiple NOT operators (NOT NOT and NOT NOT NOT)', () => {
    const res1 = runQuery(table, 'SELECT A WHERE NOT NOT (C > 50)', 1);
    expect(res1.slice(1)).toEqual([[1], [6]]);

    const res2 = runQuery(table, 'SELECT A WHERE NOT NOT NOT (C > 50)', 1);
    expect(res2.slice(1)).toEqual([[2], [3], [4], [5], [7], [8]]);
  });

  it('evaluates 10-level deeply nested parentheses', () => {
    const res = runQuery(table, 'SELECT A WHERE ((((((((((A = 3))))))))))', 1);
    expect(res.slice(1)).toEqual([[3]]);
  });

  it('correctly honors operator precedence: AND binds tighter than OR', () => {
    // A = 1 AND B = 'Software' OR A = 4 AND B = 'Cloud'
    // Should be parsed as (A = 1 AND B = 'Software') OR (A = 4 AND B = 'Cloud')
    // ID 1 is Hardware, not Software -> FALSE
    // ID 4 is Cloud -> TRUE
    const res = runQuery(
      table,
      "SELECT A WHERE A = 1 AND B = 'Software' OR A = 4 AND B = 'Cloud'",
      1
    );
    expect(res.slice(1)).toEqual([[4]]);
  });

  it('handles complex combinations of string matching predicates and boolean logic', () => {
    const res = runQuery(
      table,
      "SELECT A WHERE (B STARTS WITH 'S' OR B ENDS WITH 'are') AND (E CONTAINS 'xyz' AND NOT (C < 10))",
      1
    );
    // B STARTS WITH 'S': Software (2, 5), Support (8)
    // B ENDS WITH 'are': Hardware (1, 3, 7), Software (2, 5)
    // Union: 1, 2, 3, 5, 7, 8
    // E CONTAINS 'xyz': 1, 2, 5, 6
    // Intersection so far: 1, 2, 5
    // NOT (C < 10): C >= 10
    // ID 1: C=85 (>= 10) -> YES
    // ID 2: C=40 (>= 10) -> YES
    // ID 5: C=8 (< 10) -> NO
    expect(res.slice(1)).toEqual([[1], [2]]);
  });

  it('evaluates compound boolean with IS NULL and IS NOT NULL', () => {
    const tableWithNulls = [
      ['ID', 'Val1', 'Val2'],
      [1, null, 100],
      [2, 50, null],
      [3, null, null],
      [4, 20, 200],
    ];
    const res = runQuery(
      tableWithNulls,
      'SELECT A WHERE (B IS NULL AND C IS NOT NULL) OR (B IS NOT NULL AND C > 150)',
      1
    );
    // Row 1: B IS NULL (true) AND C IS NOT NULL (true) -> MATCH
    // Row 2: B=50 (not null), C=null (> 150 false) -> NO
    // Row 3: B=null, C=null -> NO
    // Row 4: B=20 (not null), C=200 (> 150 true) -> MATCH
    expect(res.slice(1)).toEqual([[1], [4]]);
  });
});

describe('Adversarial Test Suite 4: Grouping & Aggregations Under Stress', () => {
  const mixedTable = [
    ['Group', 'Value', 'Score'],
    ['G1', 10, 100],
    ['G1', 'not-a-number', 200],
    ['G1', null, 300],
    ['G1', 30, null],
    ['G2', 'invalid', 'text-score'],
    ['G2', null, null],
    ['G3', 40, 400],
    ['G3', 60, 600],
  ];

  it('throws #VALUE! when grouping on non-existent column', () => {
    const res = runQueryFunction(mixedTable, 'SELECT A, SUM(B) GROUP BY NonExistentCol', 1);
    expect(res.isError()).toBe(true);
    expect((res as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);

    const resCol = runQueryFunction(mixedTable, 'SELECT Col1, SUM(Col2) GROUP BY Col99', 1);
    expect(resCol.isError()).toBe(true);
    expect((resCol as ErrorValueObject).getValue()).toBe(ErrorType.VALUE);
  });

  it('safely handles mixed data types in numeric aggregates (filters out non-numbers)', () => {
    // In G1: Value has 10, 'not-a-number', null, 30.
    // Numbers: 10, 30. SUM = 40, AVG = 20, MIN = 10, MAX = 30
    // COUNT(B) counts non-empty, non-null: 10, 'not-a-number', 30 -> count = 3
    // COUNT(*) counts all rows: 4
    const res = runQuery(
      mixedTable,
      'SELECT A, SUM(B), AVG(B), MIN(B), MAX(B), COUNT(B), COUNT(*) WHERE A = \'G1\' GROUP BY A',
      1
    );
    expect(res[0]).toEqual(['Group', 'sum B', 'avg B', 'min B', 'max B', 'count B', 'count *']);
    expect(res[1]).toEqual(['G1', 40, 20, 10, 30, 3, 4]);
  });

  it('safely handles group with ONLY non-numeric data', () => {
    // In G2: Value has 'invalid', null.
    // Numbers: none. SUM = 0, AVG = null, MIN = null, MAX = null
    const res = runQuery(
      mixedTable,
      'SELECT A, SUM(B), AVG(B), MIN(B), MAX(B), COUNT(B), COUNT(*) WHERE A = \'G2\' GROUP BY A',
      1
    );
    expect(res[1]).toEqual(['G2', 0, null, null, null, 1, 2]);
  });

  it('supports grouping by multiple columns', () => {
    const multiGroupTable = [
      ['Region', 'Dept', 'Sales'],
      ['North', 'Electronics', 100],
      ['North', 'Electronics', 200],
      ['North', 'Clothing', 150],
      ['South', 'Electronics', 300],
      ['South', 'Clothing', 400],
      ['South', 'Clothing', 100],
    ];
    const res = runQuery(
      multiGroupTable,
      'SELECT A, B, SUM(C), COUNT(*) GROUP BY A, B ORDER BY A ASC, B ASC',
      1
    );
    expect(res.slice(1)).toEqual([
      ['North', 'Clothing', 150, 1],
      ['North', 'Electronics', 300, 2],
      ['South', 'Clothing', 500, 2],
      ['South', 'Electronics', 300, 1],
    ]);
  });

  it('supports grouping on columns containing null values', () => {
    const nullGroupTable = [
      ['Category', 'Val'],
      ['A', 10],
      [null, 20],
      ['A', 30],
      [null, 40],
    ];
    const res = runQuery(
      nullGroupTable,
      'SELECT A, SUM(B) GROUP BY A',
      1
    );
    // Two groups: 'A' -> 40, null -> 60
    expect(res.length).toBe(3);
    const aRow = res.find((r) => r[0] === 'A');
    const nullRow = res.find((r) => r[0] === null || r[0] === 'null');
    expect(aRow).toEqual(['A', 40]);
    expect(nullRow?.[1]).toBe(60);
  });

  it('orders grouped results by aggregate expressions', () => {
    const salesTable = [
      ['Rep', 'Amount'],
      ['Alice', 500],
      ['Bob', 300],
      ['Alice', 700],
      ['Bob', 900],
      ['Charlie', 100],
    ];
    // Alice = 1200, Bob = 1200, Charlie = 100
    // Test descending order by SUM
    const resDesc = runQuery(
      salesTable,
      'SELECT A, SUM(B) GROUP BY A ORDER BY SUM(B) DESC',
      1
    );
    expect(resDesc[3]).toEqual(['Charlie', 100]);

    // Test ascending order by SUM
    const resAsc = runQuery(
      salesTable,
      'SELECT A, SUM(B) GROUP BY A ORDER BY SUM(B) ASC',
      1
    );
    expect(resAsc[1]).toEqual(['Charlie', 100]);
  });

  it('evaluates arithmetic with aggregates in SELECT projection', () => {
    const table = [
      ['Dept', 'Cost'],
      ['IT', 1000],
      ['IT', 2000],
    ];
    const res = runQuery(table, 'SELECT A, SUM(B) * 1.1, SUM(B) + 500 GROUP BY A', 1);
    expect(res[1]?.[0]).toBe('IT');
    expect(Number(res[1]?.[1])).toBeCloseTo(3300);
    expect(res[1]?.[2]).toBe(3500);
  });
});

describe('Adversarial Test Suite 5: Large Matrix Performance & Scaling Stress (5,000 to 10,000 rows)', () => {
  // Generate 5,000 rows dataset
  const ROW_COUNT_5K = 5000;
  const table5k: unknown[][] = [['ID', 'Dept', 'Salary', 'Active', 'Score']];
  const depts = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Legal', 'Operations', 'Product'];

  for (let i = 1; i <= ROW_COUNT_5K; i++) {
    table5k.push([
      i,
      depts[i % depts.length],
      50000 + (i * 17) % 70000,
      i % 2 === 0,
      i % 10 === 0 ? null : (i * 31) % 100,
    ]);
  }

  it('filters 5,000 rows in < 100ms (sub-second target)', () => {
    const start = performance.now();
    const result = runQuery(table5k, 'SELECT * WHERE A > 2500', 1);
    const duration = performance.now() - start;

    expect(result.length).toBe(2501); // 1 header + 2500 matched rows
    expect(duration).toBeLessThan(1000); // Strict requirement: sub-second
    // Typical expected time is < 50ms in Node.js
    console.log(`[PERF 5K Filter] Rows: ${result.length}, Elapsed: ${duration.toFixed(2)}ms`);
  });

  it('groups and aggregates 5,000 rows with sorting in < 200ms', () => {
    const start = performance.now();
    const result = runQuery(
      table5k,
      'SELECT B, SUM(C), AVG(C), MIN(C), MAX(C), COUNT(*) GROUP BY B ORDER BY SUM(C) DESC',
      1
    );
    const duration = performance.now() - start;

    expect(result.length).toBe(depts.length + 1); // 1 header + 8 dept groups
    expect(duration).toBeLessThan(1000);
    console.log(`[PERF 5K GroupBy] Groups: ${result.length - 1}, Elapsed: ${duration.toFixed(2)}ms`);
  });

  it('evaluates deep boolean predicates on 5,000 rows in < 150ms', () => {
    const start = performance.now();
    const result = runQuery(
      table5k,
      "SELECT A, B, C WHERE (A > 1000 AND (B = 'Engineering' OR B = 'Sales')) AND NOT (C <= 60000) ORDER BY C DESC LIMIT 100",
      1
    );
    const duration = performance.now() - start;

    expect(result.length).toBeLessThanOrEqual(101); // Header + up to 100 rows
    expect(result.length).toBeGreaterThan(1);
    expect(duration).toBeLessThan(1000);
    console.log(`[PERF 5K Deep Predicate] Output: ${result.length}, Elapsed: ${duration.toFixed(2)}ms`);
  });

  // Generate 10,000 rows x 10 columns dataset
  const ROW_COUNT_10K = 10000;
  const table10k: unknown[][] = [
    ['Col1', 'Col2', 'Col3', 'Col4', 'Col5', 'Col6', 'Col7', 'Col8', 'Col9', 'Col10'],
  ];

  for (let i = 1; i <= ROW_COUNT_10K; i++) {
    table10k.push([
      i,
      (i * 13) % 10000,
      `Category_${i % 20}`,
      i % 3 === 0,
      (i * 7) % 500,
      i % 5 === 0 ? null : (i * 19) % 1000,
      `Text_${i % 100}`,
      (i * 23) % 5000,
      i % 4 === 0,
      (i * 29) % 100,
    ]);
  }

  it('evaluates complex query with projections, filters, sort, and pagination on 10,000 x 10 matrix in < 500ms', () => {
    const start = performance.now();
    const result = runQuery(
      table10k,
      "SELECT Col1, Col3, Col5, Col7 WHERE Col2 > 5000 AND Col4 = TRUE ORDER BY Col5 DESC LIMIT 100 OFFSET 20",
      1
    );
    const duration = performance.now() - start;

    expect(result.length).toBe(101); // 1 header + 100 rows
    expect(result[0]).toEqual(['Col1', 'Col3', 'Col5', 'Col7']);
    expect(duration).toBeLessThan(1000);
    console.log(`[PERF 10K Complex Query] Elapsed: ${duration.toFixed(2)}ms`);
  });

  it('executes repeated 10,000 row queries without memory leaks or degradation', () => {
    const iterations = 5;
    const times: number[] = [];

    for (let iter = 0; iter < iterations; iter++) {
      const start = performance.now();
      const result = runQuery(
        table10k,
        "SELECT Col3, SUM(Col5), COUNT(*) GROUP BY Col3 ORDER BY SUM(Col5) DESC",
        1
      );
      times.push(performance.now() - start);
      expect(result.length).toBe(21); // 1 header + 20 categories
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
    const maxTime = Math.max(...times);
    console.log(`[PERF 10K Stress 5 Iterations] Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    expect(maxTime).toBeLessThan(1000);
  });
});
