# Test Infrastructure: sOffice Sheets Comprehensive Upgrade

## 1. Overview & Objectives

This document establishes the test architecture, execution harness, and 4-tier requirement-driven E2E test suite for the **sOffice Sheets Comprehensive Upgrade** (`apps/sheets`, `@genoffice/xlsx-gateway`, and `packages/ai-provider`).

The test suite is architected following the Dual-Track E2E Testing methodology:
1. **Opaque-Box & Requirement-Driven**: Tests are derived strictly from user requirements in `ORIGINAL_REQUEST.md` (2026-10-05T01:28:31Z) and the 16-feature inventory in `PROJECT.md`, completely independent of implementation internals.
2. **Progressive Testability**: Tests assert observable external behavior — formula computation results, dynamic array spill ranges, `#SPILL!` lifecycle triggers, SVG DOM structures for charts and sparklines, OpenXML serialized XML tags, AI caching memoization keys, Slicer button states, and script sandbox operation plans.
3. **4-Tier Test Design Methodology**:
   - **Tier 1: Feature Coverage (Category-Partition)**: 80 test cases (16 features × 5 tests/feature) — Primary behavior and happy-path verification of each feature in isolation.
   - **Tier 2: Boundary & Corner Cases (Boundary Value Analysis)**: 80 test cases (16 features × 5 tests/feature) — Extreme bounds, empty inputs, syntax errors, collision edge conditions, division by zero, rate limits, and memory/scale bounds.
   - **Tier 3: Cross-Feature Interactions (Pairwise Combinatorial)**: 16 test cases — Verifies inter-module pipelines, e.g., dynamic arrays into sparklines, SQL `=QUERY` into collision spill engine, AI translations feeding Pivot Tables, and automation scripts driving OpenXML serialization.
   - **Tier 4: Real-World Business Scenarios (Realistic Workloads)**: 8 complete enterprise application tests — Financial P&L waterfalls, CRM sales commission pipelines, e-commerce inventory with sparklines, multilingual HR resume pipelines, logistics warehouse treemaps, executive KPI dashboards, support ticket sentiment pivots, and full OpenXML compliance audits.
   - **Total Coverage**: **184 Test Cases** (Threshold requirement: $\ge 184$).

---

## 2. Test Harness & Environment Architecture

### 2.1 Runtimes & Platforms
- **Primary Execution Environment**: Ubuntu 22.04 LTS x86_64 on VPS `hmu-vm-soffice` (`/home/ubuntu/SOFFICE`), accessible via `ssh -n -o BatchMode=yes hmu-vm-soffice "<command>"`.
- **Node.js Runtime**: v22.23.3 (ESM Modules, Native `node:crypto`, `node:fs`, `node:path`).
- **Test Runner Entrypoint**: `e2e/sheets-all-tiers.mjs`, executed via `node e2e/sheets-all-tiers.mjs`.
- **Artifact Output**: `e2e/sheets-test-results.json` (machine-readable structured test execution report).
- **Zero-Dependency Harness**: The runner executes using native Node.js ESM without requiring external package installations, guaranteeing deterministic execution across local and remote environments.

### 2.2 CLI Options & Filtering
The standalone runner supports granular execution targeting:
- `node e2e/sheets-all-tiers.mjs`: Runs all 184 test cases across all 4 tiers.
- `node e2e/sheets-all-tiers.mjs --tier=1`: Executes only Tier 1 Feature Coverage tests (80 cases).
- `node e2e/sheets-all-tiers.mjs --tier=2`: Executes only Tier 2 Boundary & Corner Case tests (80 cases).
- `node e2e/sheets-all-tiers.mjs --tier=3`: Executes only Tier 3 Cross-Feature Interaction tests (16 cases).
- `node e2e/sheets-all-tiers.mjs --tier=4`: Executes only Tier 4 Real-World Application Scenario tests (8 cases).
- `node e2e/sheets-all-tiers.mjs --feature=N`: Filters tests covering Feature $N$ ($1 \le N \le 16$).
- `node e2e/sheets-all-tiers.mjs --verbose`: Emits detailed assert diffs and payload traces.
- `node e2e/sheets-all-tiers.mjs --json`: Outputs raw JSON results directly to stdout.

---

## 3. Feature Test Matrix (16 Features × 4 Tiers)

| # | Feature | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) | Total Tests |
|---|---------|-------------------|-------------------|------------------------|---------------------|-------------|
| 1 | Dynamic Array & Lookup Functions | 5 cases (T1.1.1 - T1.1.5) | 5 cases (T2.1.1 - T2.1.5) | T3.1, T3.3, T3.16 | S2, S3, S8 | 13 |
| 2 | Google Sheets SQL `=QUERY` Engine | 5 cases (T1.2.1 - T1.2.5) | 5 cases (T2.2.1 - T2.2.5) | T3.2, T3.12 | S5 | 12 |
| 3 | Dynamic Array Spilling & Collision Lifecycle | 5 cases (T1.3.1 - T1.3.5) | 5 cases (T2.3.1 - T2.3.5) | T3.2, T3.10 | S5, S8 | 12 |
| 4 | OpenXML Dynamic Array Metadata Serialization | 5 cases (T1.4.1 - T1.4.5) | 5 cases (T2.4.1 - T2.4.5) | T3.3, T3.13 | S8 | 12 |
| 5 | AI-Native In-Cell Functions | 5 cases (T1.5.1 - T1.5.5) | 5 cases (T2.5.1 - T2.5.5) | T3.4, T3.5, T3.14 | S4, S7 | 13 |
| 6 | In-Cell Formula AI Caching & Loop Guard | 5 cases (T1.6.1 - T1.6.5) | 5 cases (T2.6.1 - T2.6.5) | T3.4, T3.15 | S7 | 12 |
| 7 | sAI Studio Anomaly Detection | 5 cases (T1.7.1 - T1.7.5) | 5 cases (T2.7.1 - T2.7.5) | T3.6 | S1, S3 | 11 |
| 8 | sAI Studio Smart Summarization | 5 cases (T1.8.1 - T1.8.5) | 5 cases (T2.8.1 - T2.8.5) | T3.7 | S1, S6 | 11 |
| 9 | Advanced Business Charts (Waterfall, Treemap, Combo) | 5 cases (T1.9.1 - T1.9.5) | 5 cases (T2.9.1 - T2.9.5) | T3.6, T3.7, T3.9 | S1, S2, S5, S6 | 14 |
| 10 | Mini In-Cell Sparklines (`=SPARKLINE`) | 5 cases (T1.10.1 - T1.10.5) | 5 cases (T2.10.1 - T2.10.5) | T3.1 | S3, S6 | 11 |
| 11 | Interactive Button Slicers | 5 cases (T1.11.1 - T1.11.5) | 5 cases (T2.11.1 - T2.11.5) | T3.8, T3.9 | S2, S4 | 12 |
| 12 | Pivot Table Calculated Fields | 5 cases (T1.12.1 - T1.12.5) | 5 cases (T2.12.1 - T2.12.5) | T3.8, T3.14, T3.16 | S1, S7, S8 | 13 |
| 13 | TypeScript Automation Script Sandbox | 5 cases (T1.13.1 - T1.13.5) | 5 cases (T2.13.1 - T2.13.5) | T3.10, T3.11, T3.15 | S6 | 12 |
| 14 | External Data Import (CSV/TSV, JSON, REST API) | 5 cases (T1.14.1 - T1.14.5) | 5 cases (T2.14.1 - T2.14.5) | T3.5, T3.11, T3.12 | S2, S7, S8 | 13 |
| 15 | Byte-Preserving OpenXML & Typecheck Quality | 5 cases (T1.15.1 - T1.15.5) | 5 cases (T2.15.1 - T2.15.5) | T3.13 | S8 | 11 |
| 16 | Comprehensive E2E Verification & Test Suite | 5 cases (T1.16.1 - T1.16.5) | 5 cases (T2.16.1 - T2.16.5) | Runner Engine | Runner Engine | 10 |
| **Total** | | **80 cases** | **80 cases** | **16 cases** | **8 cases** | **184 cases** |

---

## 4. Tier 1: Feature Coverage (80 Test Cases)

### Feature 1: Dynamic Array & Lookup Functions
- **T1.1.1 (FILTER Functionality)**: `FILTER(data, boolean_include, [if_empty])` filters 2D array rows based on boolean predicate vector, returning matching sub-matrix.
  - *Input*: `data=[[1,"A"],[2,"B"],[3,"A"]]`, `include=[true, false, true]`.
  - *Expected*: `[[1,"A"],[3,"A"]]` (2 rows, 2 columns).
- **T1.1.2 (SORT & SORTBY Functionality)**: `SORT(data, sort_index, sort_order)` sorts 2D matrix by column index ascending (`1`) or descending (`-1`).
  - *Input*: `data=[[10,"Z"],[5,"A"],[20,"M"]]`, `sort_index=0`, `sort_order=1`.
  - *Expected*: `[[5,"A"],[10,"Z"],[20,"M"]]`.
- **T1.1.3 (UNIQUE Functionality)**: `UNIQUE(data)` deduplicates 2D rows, returning unique records preserving initial encounter order.
  - *Input*: `data=[["Apple"],["Banana"],["Apple"],["Orange"],["Banana"]]`.
  - *Expected*: `[["Apple"],["Banana"],["Orange"]]` (3 distinct rows).
- **T1.1.4 (SEQUENCE Functionality)**: `SEQUENCE(rows, cols, start, step)` generates 2D matrix with arithmetic progression.
  - *Input*: `rows=3`, `cols=2`, `start=1`, `step=5`.
  - *Expected*: `[[1, 6], [11, 16], [21, 26]]`.
- **T1.1.5 (XLOOKUP Functionality)**: `XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode])` performs exact lookup returning matching element or row.
  - *Input*: `lookup_val="B"`, `lookup_arr=["A","B","C"]`, `return_arr=[100, 200, 300]`.
  - *Expected*: `200`.

### Feature 2: Google Sheets SQL `=QUERY` Engine
- **T1.2.1 (QUERY SELECT Clause)**: `QUERY(data, "SELECT Col1, Col3")` projects specific columns by index.
  - *Input*: `data=[["ID","Name","Price"],[1,"Widget",10.5],[2,"Gadget",25.0]]`, `query="SELECT Col1, Col3"`.
  - *Expected*: `[["ID","Price"],[1,10.5],[2,25.0]]`.
- **T1.2.2 (QUERY WHERE Predicate)**: `QUERY(data, "SELECT Col1, Col2 WHERE Col2 > 10")` evaluates numeric filtering conditions.
  - *Input*: `data=[[1, 5], [2, 15], [3, 25]]`, `query="SELECT Col1, Col2 WHERE Col2 > 10"`.
  - *Expected*: `[[2, 15], [3, 25]]`.
- **T1.2.3 (QUERY ORDER BY Clause)**: `QUERY(data, "SELECT Col1, Col2 ORDER BY Col2 DESC")` sorts results descending.
  - *Input*: `data=[["A", 10], ["B", 50], ["C", 20]]`, `query="SELECT Col1, Col2 ORDER BY Col2 DESC"`.
  - *Expected*: `[["B", 50], ["C", 20], ["A", 10]]`.
- **T1.2.4 (QUERY GROUP BY & Aggregation)**: `QUERY(data, "SELECT Col1, sum(Col2) GROUP BY Col1")` groups records and aggregates sums.
  - *Input*: `data=[["East", 100], ["West", 200], ["East", 150]]`, `query="SELECT Col1, sum(Col2) GROUP BY Col1"`.
  - *Expected*: `[["East", 250], ["West", 200]]`.
- **T1.2.5 (QUERY LIMIT & OFFSET Clauses)**: `QUERY(data, "SELECT Col1 LIMIT 2 OFFSET 1")` paginates records accurately.
  - *Input*: `data=[[1], [2], [3], [4], [5]]`, `query="SELECT Col1 LIMIT 2 OFFSET 1"`.
  - *Expected*: `[[2], [3]]`.

### Feature 3: Dynamic Array Spilling & Collision Lifecycle
- **T1.3.1 (Spill Allocation)**: Dynamic array formula occupying top-left cell dynamically claims `m × n` follower cells.
  - *Input*: Formula in `A1` returning $3 \times 2$ array.
  - *Expected*: Bounding box `A1:B3` registered with `spillRange={startRow:0, startCol:0, endRow:2, endCol:1}`.
- **T1.3.2 (Collision Detection)**: Spill target zone containing non-empty user value aborts spill and returns `#SPILL!`.
  - *Input*: Formula in `A1` spilling to `A1:B2`, cell `B2` contains existing text `"Blocked"`.
  - *Expected*: Cell `A1` displays `#SPILL!`, blocking cell `B2` remains `"Blocked"`.
- **T1.3.3 (Reactive Re-Spill)**: Clearing blocking cell automatically resolves `#SPILL!` and restores spilled matrix.
  - *Input*: Cell `B2` cleared to empty `null`/`""`.
  - *Expected*: Cell `A1` transitions from `#SPILL!` to array root, and `A1:B2` populates with calculated values.
- **T1.3.4 (Follower Cell Protection)**: Follower cells within active spill range are protected from direct formula detachment.
  - *Input*: Inspect follower cell metadata at `A2`.
  - *Expected*: `isFollower=true`, `rootCell="A1"`.
- **T1.3.5 (Root Cell Mutation Teardown)**: Clearing or deleting root formula cell cleanly vacates all follower cells.
  - *Input*: Delete formula in `A1`.
  - *Expected*: Follower cells `A2`, `B1`, `B2` revert to blank with zero ghost values.

### Feature 4: OpenXML Dynamic Array Metadata Serialization
- **T1.4.1 (Prefix Serialization)**: Dynamic array functions serialize with `_xlfn._xlws.` and future functions with `_xlfn.`.
  - *Input*: Formula `=SORTBY(A1:A5, B1:B5)`.
  - *Expected*: Serialized XML contains `_xlfn._xlws.SORTBY(A1:A5, B1:B5)`.
- **T1.4.2 (Cell cm="1" Dynamic Model Marker)**: Cells containing dynamic array formulas serialize with `cm="1"`.
  - *Input*: Cell containing `=UNIQUE(A1:A10)`.
  - *Expected*: Sheet XML tag `<c r="C1" cm="1"><f t="array"...>`.
- **T1.4.3 (Array Tag ref Dimension Attribute)**: Spilling formula serializes `<f t="array" ref="...">` with explicit spill bounding box.
  - *Input*: Formula in `C1` spilling to `C1:D5`.
  - *Expected*: `<f t="array" ref="C1:D5">_xlfn._xlws.UNIQUE(A1:B5)</f>`.
- **T1.4.4 (Deserialization Marker Stripping)**: Opening XML file containing `_xlfn._xlws.` strips storage markers for display.
  - *Input*: Stored XML formula `_xlfn._xlws.SEQUENCE(5)`.
  - *Expected*: Clean UI formula string `=SEQUENCE(5)`.
- **T1.4.5 (QUERY Function Spill Registration)**: Custom `=QUERY` function is registered in `SPILL_FUNCTIONS` set.
  - *Input*: Formula `=QUERY(A1:D10, "SELECT Col1")`.
  - *Expected*: `spillsDynamicArray("QUERY(A1:D10, ...)") === true`.

### Feature 5: AI-Native In-Cell Functions
- **T1.5.1 (=AI Formula Dispatch)**: `=AI(prompt, cell_or_range)` constructs valid `aiChat` request with context.
  - *Input*: `=AI("Summarize in 3 words", A1)`, where `A1="Annual revenue increased 40% year over year"`.
  - *Expected*: Request object with `{ prompt: "Summarize in 3 words", context: "Annual revenue increased 40% year over year" }`.
- **T1.5.2 (=AI Range Table Formatting)**: `=AI` with 2D range formats tabular grid into structured Markdown table.
  - *Input*: Range `A1:B2` with values `[["Item","Qty"],["Widget",5]]`.
  - *Expected*: Context contains `"| Item | Qty |\n| --- | --- |\n| Widget | 5 |"`.
- **T1.5.3 (=AI_EXTRACT Pattern Extraction)**: `=AI_EXTRACT(pattern, text)` dispatches extraction prompt.
  - *Input*: `=AI_EXTRACT("email", "Contact us at support@soffice.caqa.io.vn or sales@soffice.caqa.io.vn")`.
  - *Expected*: Returns array `["support@soffice.caqa.io.vn", "sales@soffice.caqa.io.vn"]`.
- **T1.5.4 (=AI_TRANSLATE Target Language)**: `=AI_TRANSLATE(text, target_lang)` dispatches translation request.
  - *Input*: `=AI_TRANSLATE("Bảng tính", "en")`.
  - *Expected*: Request has `{ function: "AI_TRANSLATE", text: "Bảng tính", targetLang: "en" }`, returns `"Spreadsheet"`.
- **T1.5.5 (AsyncCustomFunction Promise Contract)**: AI custom functions inherit `AsyncCustomFunction` returning unresolved promise during fetch.
  - *Input*: Invoke `=AI(...)`.
  - *Expected*: Returns Promise that resolves to `StringValueObject` upon completion.

### Feature 6: In-Cell Formula AI Caching & Loop Guard
- **T1.6.1 (Deterministic Cache Key Generation)**: Cache key uses formula coordinates and SHA-256 hash of canonical formula + arguments.
  - *Input*: Unit `"unit-1"`, Sheet `"sheet-0"`, Row `2`, Col `3`, Formula `=AI("test", "context")`.
  - *Expected*: Key format `"unit-1:sheet-0:2:3:<hash>"`.
- **T1.6.2 (Memoized Cache Hit)**: Secondary calculation with identical cache key returns cached value without network dispatch.
  - *Input*: Request identical key from `AiFormulaCache`.
  - *Expected*: Cached value returned, upstream mock call count remains 1.
- **T1.6.3 (In-Flight Promise Joining)**: Multiple cells executing identical AI formula join the pending promise.
  - *Input*: Dispatch 5 concurrent requests with identical prompt and context.
  - *Expected*: Upstream request dispatched once, all 5 promises resolve with identical value.
- **T1.6.4 (Precedent Cell Invalidation)**: Editing cell referenced by `=AI` formula invalidates corresponding cache entry.
  - *Input*: Cache populated for `B1` referencing `A1`. Cell `A1` modified.
  - *Expected*: Cache key for `B1` evicted, recomputation triggered.
- **T1.6.5 (Cache Persistence Serialization)**: Cached AI values serialize into workbook cell values for instantaneous reload.
  - *Input*: Save workbook containing resolved `=AI` formulas.
  - *Expected*: Cell contains cached string value `<v>Resolved Text</v>`, avoiding blank re-fetch on startup.

### Feature 7: sAI Studio Anomaly Detection
- **T1.7.1 (IQR Outlier Screening)**: Calculates Quartiles Q1, Q3, and fences $Q1 - 1.5 \times IQR$ and $Q3 + 1.5 \times IQR$.
  - *Input*: Dataset `[10, 12, 11, 13, 12, 14, 11, 95]`.
  - *Expected*: Q1=11, Q3=13.5, IQR=2.5, Upper Fence=17.25. Outlier `95` detected.
- **T1.7.2 (Z-Score Standard Deviation)**: Calculates mean $\mu$ and standard deviation $\sigma$ for normal distribution anomaly screening.
  - *Input*: Values `[10, 10, 10, 10, 100]`.
  - *Expected*: Value `100` has $|Z| > 1.7$ (flagged).
- **T1.7.3 (Amber Moderate Severity)**: Outliers with $2.0 \le |Z| < 3.0$ receive amber alert level.
  - *Input*: Data point with $Z = 2.4$.
  - *Expected*: `{ severity: "amber", code: "MODERATE_OUTLIER" }`.
- **T1.7.4 (Red Severe Severity)**: Outliers with $|Z| \ge 3.0$ receive red alert level.
  - *Input*: Data point with $Z = 3.8$.
  - *Expected*: `{ severity: "red", code: "CRITICAL_OUTLIER" }`.
- **T1.7.5 (Diagnostic Report Prompt Generation)**: Formats outlier coordinates and statistical fences into diagnostic summary prompt.
  - *Input*: Outlier at cell `C4` (Value: 9500, Expected: 100-250).
  - *Expected*: Report string specifies `"Cell C4: value 9500 deviates by +37.8 standard deviations from cluster mean 175"`.

### Feature 8: sAI Studio Smart Summarization
- **T1.8.1 (Data Profiling Metrics)**: Computes statistical profile for selected range (rows, cols, numeric count, null count, mean, min, max).
  - *Input*: Numeric column `[10, 20, 30, 40]`.
  - *Expected*: `{ count: 4, sum: 100, mean: 25, min: 10, max: 40, nulls: 0 }`.
- **T1.8.2 (KPI Extraction)**: Identifies primary summary metrics (Total Revenue, Peak Value, Growth Rate) from tabular columns.
  - *Input*: Table with `"Sales"` and `"Cost"` headers.
  - *Expected*: Generates KPI summary cards for `"Total Sales"`, `"Total Cost"`, and `"Net Margin"`.
- **T1.8.3 (Executive Narrative Prompt Construction)**: Assembles structured executive summary prompt containing computed KPI facts.
  - *Input*: Profile data with KPIs.
  - *Expected*: Prompt contains `"Executive Summary Request"`, profiling tables, and structured JSON output schema instructions.
- **T1.8.4 (Insert Summary Sheet Operation Batch)**: "Insert Summary Sheet" builds atomic `WorkbookOperation[]` creating `"Executive Summary"` tab.
  - *Input*: Trigger summary sheet insertion.
  - *Expected*: Operation array includes `AddSheetOperation { name: "Executive Summary" }` and `SetCellValuesOperation`.
- **T1.8.5 (Summary Table Formatting DSL)**: Applies structured styling (header dark background, bold totals, KPI cards) to generated summary tab.
  - *Input*: Format summary sheet layout.
  - *Expected*: Title cell has `fontSize: 16, bold: true`; KPI tiles have border and background accents.

### Feature 9: Advanced Business Charts (Waterfall, Treemap, Combo)
- **T1.9.1 (Waterfall Chart Cumulative Deltas)**: Waterfall engine calculates cumulative base positions, positive additions, negative subtractions, and totals.
  - *Input*: Items `[("Revenue", 100), ("COGS", -40), ("OpEx", -30), ("Net", 30)]`.
  - *Expected*: Bases `[0, 60, 30, 0]`, Bar heights `[100, 40, 30, 30]`, Types `["positive", "negative", "negative", "total"]`.
- **T1.9.2 (Waterfall SVG Connector Lines)**: Generates SVG `<line>` coordinates connecting preceding bar top/bottom to next bar base.
  - *Input*: Bar 1 ends at $y=60$, Bar 2 begins at $y=60$.
  - *Expected*: Connector line attributes `x1=bar1.right, y1=60, x2=bar2.left, y2=60`.
- **T1.9.3 (Treemap Squarified Partitioning)**: Squarified treemap layout partitions rectangles optimizing aspect ratio $\approx 1.0$.
  - *Input*: Weights `[6, 6, 4, 3, 2, 2, 1]` within container $w=600, h=400$.
  - *Expected*: Partitioned rectangles total exact bounding area (240,000 $px^2$), all aspect ratios $\ge 1.0$ and $< 3.0$.
- **T1.9.4 (Combo Chart Dual Y-Axes)**: Computes independent left Y-scale for volume bars and right Y-scale for percentage line.
  - *Input*: Primary series `[1000, 2500, 4000]`, Secondary series `[0.10, 0.25, 0.40]`.
  - *Expected*: Left axis bounds $[0, 4000]$, Right axis bounds $[0.0, 0.40]$ (or $0\%-40\%$).
- **T1.9.5 (Ribbon Insert Chart Dispatch)**: Ribbon chart menu click registers `WorkbookVisualObject` with chart type and cell anchor coordinates.
  - *Input*: Insert Waterfall chart on range `A1:B5`.
  - *Expected*: Visual object registered with `kind: "chart"`, `chartType: "waterfall"`, `anchor: { fromRow: 0, fromCol: 3, toRow: 15, toCol: 10 }`.

### Feature 10: Mini In-Cell Sparklines (`=SPARKLINE`)
- **T1.10.1 (Sparkline Options Parsing)**: Parses options key-value object or range (`charttype`, `color`, `linewidth`).
  - *Input*: `=SPARKLINE(A1:A5, {"charttype", "line"; "color", "#107c41"; "linewidth", 2})`.
  - *Expected*: `{ charttype: "line", color: "#107c41", linewidth: 2 }`.
- **T1.10.2 (Line Sparkline SVG Polyline Path)**: Generates normalized SVG `<path d="M... L...">` within cell viewport ($w=120, h=24$).
  - *Input*: Values `[10, 30, 20, 50]`.
  - *Expected*: Path string begins with `M 0,` and ends with `L 120,`, with correctly scaled Y coordinates.
- **T1.10.3 (Column Sparkline SVG Rects)**: Generates SVG `<rect>` elements scaled proportionally to min/max data range.
  - *Input*: Values `[10, 20, 5, 15]`.
  - *Expected*: 4 `<rect>` elements with proportional heights and uniform horizontal spacing.
- **T1.10.4 (Stacked / Win-Loss Sparkline)**: Generates positive and negative blocks split along central baseline.
  - *Input*: Values `[1, -1, 1, 1, -1]`.
  - *Expected*: Positive bars extend upward from baseline ($y_{base}$), negative bars extend downward.
- **T1.10.5 (Float DOM In-Cell Binding)**: Binds sparkline SVG component to cell coordinate via Univer Float DOM manager.
  - *Input*: `=SPARKLINE(A1:D1)` entered in cell `E1`.
  - *Expected*: Float DOM registered at `row: 0, col: 4` with component key `"SparklineSvg"`.

### Feature 11: Interactive Button Slicers
- **T1.11.1 (Distinct Item Extraction)**: Slicer engine extracts sorted unique values from target table column.
  - *Input*: Column values `["North", "South", "North", "East", "West", "South"]`.
  - *Expected*: Slicer items `["East", "North", "South", "West"]` (4 buttons).
- **T1.11.2 (Single Item Toggle Filter)**: Clicking button toggles filter and dispatches table row filter predicate.
  - *Input*: Click button `"North"`.
  - *Expected*: Filter criteria `{ column: "Region", selected: ["North"] }`, non-matching rows masked.
- **T1.11.3 (Multi-Select Mode)**: Selecting multiple items filters table rows with logical OR.
  - *Input*: Select `"North"` and `"East"`.
  - *Expected*: Filter criteria includes both items, rows matching either remain visible.
- **T1.11.4 (Clear Filter Reset)**: Clicking "Clear Filter" icon resets all selections and unhides all rows.
  - *Input*: Click Clear Filter button.
  - *Expected*: Slicer selection empty (`selected: []`), 100% of rows visible.
- **T1.11.5 (Slicer Visual State)**: Active buttons render with pressed styling and badge reflects active item count.
  - *Input*: Inspect active slicer state with 2 items chosen.
  - *Expected*: Selected buttons have `aria-pressed="true"` / `active` class; header shows active filter badge.

### Feature 12: Pivot Table Calculated Fields
- **T1.12.1 (Formula Tokenizer)**: Tokenizes calculated field expression into identifiers, operators, and numbers.
  - *Input*: `='Revenue' * 1.1 - 'Expense'`.
  - *Expected*: Tokens `[FIELD("Revenue"), MUL, NUM(1.1), SUB, FIELD("Expense")]`.
- **T1.12.2 (Recursive-Descent AST Construction)**: Parses tokens into arithmetic AST respecting operator precedence (`*`, `/` over `+`, `-`).
  - *Input*: `='A' + 'B' * 'C'`.
  - *Expected*: Root node `BinaryExpr(+)` with left `FIELD("A")` and right `BinaryExpr(*, FIELD("B"), FIELD("C"))`.
- **T1.12.3 (Row Summary Aggregation Evaluator)**: Evaluates calculated field AST against aggregated row totals.
  - *Input*: AST for `='Profit' / 'Revenue'`, row data `{ Profit: 250, Revenue: 1000 }`.
  - *Expected*: Evaluates to `0.25` ($25\%$).
- **T1.12.4 (Pivot Field List Registration)**: Registers calculated measure into Pivot Table field list under Values area.
  - *Input*: Add calculated field `"Margin Rate"`.
  - *Expected*: Pivot table structure includes `"Margin Rate"` in values list alongside source fields.
- **T1.12.5 (CalculatedFieldDialog Validation)**: Validates field name uniqueness and formula syntax.
  - *Input*: Submit dialog with valid name `"Gross Margin"` and valid formula `='Sales' - 'COGS'`.
  - *Expected*: Validation succeeds (`isValid: true`, `errors: []`).

### Feature 13: TypeScript Automation Script Sandbox
- **T1.13.1 (Sandbox Worker Initialization)**: Web Worker boots isolated sandbox and handles `RUN_SCRIPT` messages.
  - *Input*: Post `{ type: "RUN_SCRIPT", code: "const x = 10;" }`.
  - *Expected*: Worker responds with `{ ok: true, logs: [], operations: [] }`.
- **T1.13.2 (SpreadsheetApp API Execution)**: Executes `SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue(42)`.
  - *Input*: Post script code.
  - *Expected*: Returns operation `SetCellValueOperation { cell: "A1", value: 42 }`.
- **T1.13.3 (Atomic Operation Plan Collector)**: Collects multiple API calls into single atomic `WorkbookOperation[]` plan.
  - *Input*: Script updates 3 cells and sets 1 background color.
  - *Expected*: `operations.length === 4`, grouped under single transaction id.
- **T1.13.4 (Atomic Undo Integration)**: Script operation plan applied via `applyOpPlan` registers single unified undo entry.
  - *Input*: Execute 4-operation batch, then invoke `undo()`.
  - *Expected*: Single undo step reverts all 4 cell changes atomically.
- **T1.13.5 (Console Log Redirection)**: Sandbox captures `console.log` calls into `ScriptOutput.logs`.
  - *Input*: Script contains `console.log("Processing row", 1); console.log("Done");`.
  - *Expected*: `logs` array contains `["Processing row 1", "Done"]`.

### Feature 14: External Data Import (CSV/TSV, JSON, REST API)
- **T1.14.1 (Delimiter Auto-Sniffing)**: Delimiter sniffer detects comma `,`, tab `\t`, semicolon `;`, or pipe `|`.
  - *Input*: Sample `"Name\tAge\tCity\nAlice\t30\tParis"`.
  - *Expected*: Detected delimiter is `"\t"` (tab).
- **T1.14.2 (RFC 4180 CSV Parsing)**: Parses quoted fields with embedded commas and escaped quotes `""`.
  - *Input*: `"\"Bui, Thanh Ninh\",\"Software \"\"Architect\"\"\",100\n"`.
  - *Expected*: Row `["Bui, Thanh Ninh", "Software \"Architect\"", "100"]`.
- **T1.14.3 (JSON Flattener to 2D Table)**: Flattens nested JSON object array into 2D table with composite column headers.
  - *Input*: `[{"user": {"name": "Alice"}, "score": 95}, {"user": {"name": "Bob"}, "score": 88}]`.
  - *Expected*: Headers `["user.name", "score"]`, Rows `[["Alice", 95], ["Bob", 88]]`.
- **T1.14.4 (REST API Connector Request)**: Dispatches IPC fetch request and transforms JSON response into tabular grid.
  - *Input*: Mock endpoint returning `[{ id: 1, val: "A" }, { id: 2, val: "B" }]`.
  - *Expected*: Matrix `[["id","val"],[1,"A"],[2,"B"]]`.
- **T1.14.5 (Target Range Placement)**: Inserts imported 2D matrix into active sheet at designated anchor coordinate (`A1`).
  - *Input*: Place $3 \times 2$ table at anchor cell `B2`.
  - *Expected*: Occupies range `B2:C4`.

### Feature 15: Byte-Preserving OpenXML & Typecheck Quality
- **T1.15.1 (OpenXML Package Integrity)**: Serialized `.xlsx` package contains valid ZIP structure and required OpenXML parts.
  - *Input*: Inspect generated package zip entries.
  - *Expected*: Contains `[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/worksheets/sheet1.xml`.
- **T1.15.2 (ECMA-376 Worksheet Schema Compliance)**: Worksheet XML conforms to ECMA-376 element hierarchy (`sheetData` inside `worksheet`).
  - *Input*: Validate serialized `sheet1.xml`.
  - *Expected*: Root element is `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`.
- **T1.15.3 (Shared Strings Table Deduplication)**: `xl/sharedStrings.xml` stores unique strings with reference indices.
  - *Input*: 5 cells containing string `"sOffice"`.
  - *Expected*: Single `<si><t>sOffice</t></si>` entry in sharedStrings table, cells reference index `0`.
- **T1.15.4 (Defined Names & Sheet Tab Preservation)**: Named ranges and sheet properties survive roundtrip serialization.
  - *Input*: Workbook with defined name `"TaxRate" = 0.08` and sheet tab `"Financials"`.
  - *Expected*: Re-opened package contains defined name and sheet tab intact.
- **T1.15.5 (Monorepo Typecheck Clean Pass)**: Monorepo workspaces pass TypeScript compiler check with 0 diagnostics.
  - *Input*: Run typecheck audit across workspaces.
  - *Expected*: 0 compilation errors across `apps/sheets` and `@genoffice/xlsx-gateway`.

### Feature 16: Comprehensive E2E Verification & Test Suite
- **T1.16.1 (Master Runner Suite Execution)**: Runner executes all 4 test tiers and generates summary report.
  - *Input*: Execute `node e2e/sheets-all-tiers.mjs`.
  - *Expected*: All suites execute in sequential order with timing metrics.
- **T1.16.2 (Tier Filtering CLI Options)**: Runner supports `--tier=N` flag to isolate specific tiers.
  - *Input*: Execute with `--tier=1`.
  - *Expected*: Executes exactly Tier 1 tests, skips Tiers 2, 3, 4.
- **T1.16.3 (Feature Filtering CLI Option)**: Runner supports `--feature=N` flag to isolate specific features.
  - *Input*: Execute with `--feature=2`.
  - *Expected*: Executes only tests mapped to Feature 2 (Google Sheets SQL `=QUERY`).
- **T1.16.4 (JSON Report Serialization)**: Serializes machine-readable execution report to `e2e/sheets-test-results.json`.
  - *Input*: Complete runner execution.
  - *Expected*: Output file exists and parses valid JSON containing `{ summary, tiers, cases }`.
- **T1.16.5 (Clean Exit Code 0 Contract)**: Runner process exits with code 0 on complete pass, code 1 on failure.
  - *Input*: All tests passing.
  - *Expected*: Process exit code is `0`.

---

## 5. Tier 2: Boundary & Corner Cases (80 Test Cases)

### Feature 1: Dynamic Array & Lookup Functions
- **T2.1.1 (FILTER No Match Fallback)**: `FILTER` with zero matching rows returns optional third argument fallback or `#CALC!`.
  - *Input*: `data=[[1],[2]]`, `include=[false, false]`, `if_empty="No Match"`.
  - *Expected*: `"No Match"`.
- **T2.1.2 (XLOOKUP Mismatched Array Lengths)**: `XLOOKUP` when lookup array and return array have mismatched dimensions returns `#VALUE!`.
  - *Input*: `lookup_val="A"`, `lookup_arr=["A","B"]`, `return_arr=[1, 2, 3]`.
  - *Expected*: `#VALUE!`.
- **T2.1.3 (SEQUENCE Boundary Parameters)**: `SEQUENCE` with zero rows, negative step, or fractional start.
  - *Input*: `rows=3`, `cols=1`, `start=10.5`, `step=-2.5`.
  - *Expected*: `[[10.5], [8.0], [5.5]]`.
- **T2.1.4 (TEXTSPLIT Multiple & Empty Delimiters)**: `TEXTSPLIT` with consecutive delimiters respects `ignore_empty=true`.
  - *Input*: `text="A,,,B,C"`, `delimiter=","`, `ignore_empty=true`.
  - *Expected*: `[["A", "B", "C"]]` (empty tokens suppressed).
- **T2.1.5 (WRAPROWS Trailing Padding Value)**: `WRAPROWS` with irregular item count fills trailing gap with specified `pad_with` value.
  - *Input*: `vector=[1, 2, 3, 4, 5]`, `wrap_count=2`, `pad_with="#N/A"`.
  - *Expected*: `[[1, 2], [3, 4], [5, "#N/A"]]`.

### Feature 2: Google Sheets SQL `=QUERY` Engine
- **T2.2.1 (QUERY Syntax Error Handling)**: Unclosed quotes or invalid SQL keywords produce clean `#VALUE!` parse error without throwing uncaught exceptions.
  - *Input*: `query="SELECT WHERE Col1 >"`.
  - *Expected*: Error `#VALUE! (Syntax error in query: unexpected WHERE)`.
- **T2.2.2 (QUERY Empty Range Input)**: Querying an empty range `[[]]` or 0-row dataset returns empty result safely.
  - *Input*: `data=[]`, `query="SELECT Col1"`.
  - *Expected*: `[]`.
- **T2.2.3 (QUERY Null/Blank Values in Aggregations)**: Aggregating columns with blank/null cells computes sums and averages ignoring nulls.
  - *Input*: `data=[["A", 10], ["A", null], ["A", 20]]`, `query="SELECT Col1, avg(Col2) GROUP BY Col1"`.
  - *Expected*: `[["A", 15]]` (average of 10 and 20).
- **T2.2.4 (QUERY Custom Header Relabeling)**: `LABEL Col1 'Identifier'` modifies header text while preserving data rows.
  - *Input*: `query="SELECT Col1 LABEL Col1 'Custom ID'"`.
  - *Expected*: Header row is `["Custom ID"]`.
- **T2.2.5 (QUERY LIMIT 0 Edge Case)**: `LIMIT 0` returns empty dataset with column headers only.
  - *Input*: `query="SELECT Col1, Col2 LIMIT 0"`.
  - *Expected*: Header row `["Col1", "Col2"]` with 0 data rows.

### Feature 3: Dynamic Array Spilling & Collision Lifecycle
- **T2.3.1 (Worksheet Edge Overflow Spill)**: Formula near sheet edge spilling beyond column 16,384 (`XFD`) or row 1,048,576 triggers `#SPILL!`.
  - *Input*: Formula in cell at column 16,380 spilling 10 columns wide.
  - *Expected*: Returns `#SPILL!` (spill range exceeds worksheet boundary).
- **T2.3.2 (Whitespace Cell Spill Collision)**: Spill encountering a cell containing whitespace string `" "` triggers `#SPILL!` collision.
  - *Input*: Cell in spill trajectory contains single space `" "`.
  - *Expected*: Root formula returns `#SPILL!`.
- **T2.3.3 (Merged Cell Spill Block)**: Spill encountering merged cell range in target zone raises `#SPILL!`.
  - *Input*: Cells `B2:C2` are merged; formula in `A2` spills across row 2.
  - *Expected*: Root formula returns `#SPILL!`.
- **T2.3.4 (Cyclic Spill Reference Collision)**: Two dynamic array formulas whose spill ranges intersect fail cleanly to `#SPILL!` without recursion.
  - *Input*: Formula A in `A1` spills to `B2`, Formula B in `B1` spills to `A2`.
  - *Expected*: Both formulas resolve to `#SPILL!` without call stack exhaustion.
- **T2.3.5 (Follower Ghost Cleanup on Load)**: Follower cells saved in `.xlsx` are cleared on workbook load to avoid self-blocking spill.
  - *Input*: File loaded with cached values in follower cells `A2:A5` under root `A1`.
  - *Expected*: Follower cells are marked ephemeral, allowing `A1` to re-spill without false collision.

### Feature 4: OpenXML Dynamic Array Metadata Serialization
- **T2.4.1 (Nested Dynamic Array Prefixing)**: Nested calls `_xlws.SORT(_xlws.UNIQUE(...))` prefix each function without double prefixes like `_xlfn._xlfn.`.
  - *Input*: Formula `=SORT(UNIQUE(FILTER(A1:A10, B1:B10)))`.
  - *Expected*: Serialized string contains `_xlfn._xlws.SORT(_xlfn._xlws.UNIQUE(_xlfn._xlws.FILTER(...)))`.
- **T2.4.2 (String Literal Immunity)**: String literals containing function names (e.g. `="FILTER"`) are never modified by marker injection.
  - *Input*: Formula `="FILTER" & " - " & "SORT"`.
  - *Expected*: Serialized string remains `="FILTER" & " - " & "SORT"`.
- **T2.4.3 (Structured Reference Preservation)**: Formulas with table structured references preserve brackets and columns intact.
  - *Input*: `=SORT(Table1[[#Data],[Revenue]])`.
  - *Expected*: `_xlfn._xlws.SORT(Table1[[#Data],[Revenue]])`.
- **T2.4.4 (Case Normalization)**: Lowercase formulas like `=sort(unique(a1:a5))` normalize to canonical uppercase storage tokens.
  - *Input*: `=sort(unique(a1:a5))`.
  - *Expected*: `_xlfn._xlws.SORT(_xlfn._xlws.UNIQUE(a1:a5))`.
- **T2.4.5 (Scalar Formula Marker Omission)**: Standard scalar formulas (e.g. `=SUM(A1:A10)`) serialize without `cm="1"` or `t="array"`.
  - *Input*: `=SUM(A1:A10)`.
  - *Expected*: `<f>SUM(A1:A10)</f>` with cell attribute `cm` omitted.

### Feature 5: AI-Native In-Cell Functions
- **T2.5.1 (Empty Prompt / Blank Cell)**: `=AI("", A1)` or `=AI("prompt", "")` with empty input returns empty string without network request.
  - *Input*: Empty prompt `""`.
  - *Expected*: Returns `""` immediately.
- **T2.5.2 (Missing BYOK API Key Error Contract)**: In-cell AI formula when API key is missing returns `#AUTH_REQUIRED!`.
  - *Input*: Execute `=AI(...)` with empty OpenAI and Gemini keys.
  - *Expected*: Cell displays `#AUTH_REQUIRED!`.
- **T2.5.3 (Upstream 429 Rate Limit Error Contract)**: AI provider rate limit response triggers `#RATE_LIMIT!` with retry metadata.
  - *Input*: Mock provider returns HTTP 429 Too Many Requests.
  - *Expected*: Cell displays `#RATE_LIMIT!`.
- **T2.5.4 (Multiline & Special Character Sanitization)**: Prompts with newlines, quotes, and emojis are sanitized in JSON payloads.
  - *Input*: `=AI("Review: \"Great product!\" \n Newline ✨", A1)`.
  - *Expected*: JSON payload escapes quotes and newlines cleanly without parse errors.
- **T2.5.5 (Oversized Range Context Truncation)**: Selecting massive range (10,000 cells) truncates to token budget with truncation notice.
  - *Input*: Range containing 10,000 rows passed to `=AI`.
  - *Expected*: Context capped at maximum token character budget (e.g. 16,000 chars) with `[...truncated]` suffix.

### Feature 6: In-Cell Formula AI Caching & Loop Guard
- **T2.6.1 (100-Cell Concurrent Burst Deduplication)**: Burst recalculation of 100 identical `=AI` formulas fires exactly 1 network request.
  - *Input*: 100 cells evaluated concurrently with identical arguments.
  - *Expected*: Upstream request count is exactly 1.
- **T2.6.2 (Formula Text Modification Cache Eviction)**: Editing formula text in cell coordinate invalidates existing cache entry.
  - *Input*: Cell formula changed from `=AI("Summarize", A1)` to `=AI("Translate", A1)`.
  - *Expected*: New cache key generated, old cached value not returned.
- **T2.6.3 (Network Failure Promise Cleanup)**: Upstream network error clears in-flight promise to allow user-initiated retry.
  - *Input*: Network call rejects with error.
  - *Expected*: In-flight promise removed from queue; subsequent recalculation attempts fresh call.
- **T2.6.4 (LRU Cache Bounded Memory Guard)**: Cache eviction limits total entries to 10,000 items, evicting oldest entries first.
  - *Input*: Insert 10,001 distinct cache entries.
  - *Expected*: Cache size remains $\le 10,000$, oldest item is evicted.
- **T2.6.5 (Whitespace Normalization in Prompt Hash)**: Prompts differing only in leading/trailing whitespace normalize to identical hash.
  - *Input*: Compare hash of `"Summarize"` vs `"  Summarize  "`.
  - *Expected*: Normalized hashes match.

### Feature 7: sAI Studio Anomaly Detection
- **T2.7.1 (Zero Variance Uniform Dataset)**: Uniform dataset (all values equal) handles standard deviation $\sigma = 0$ without divide-by-zero crash.
  - *Input*: Values `[100, 100, 100, 100, 100]`.
  - *Expected*: $\sigma = 0$, Outliers count = 0, no `NaN` or `Infinity`.
- **T2.7.2 (Non-Numeric Cell Filtering)**: Selected range containing strings, dates, and booleans filters non-numeric items before screening.
  - *Input*: Range `[10, "N/A", 20, true, 30]`.
  - *Expected*: Analyzes numeric subset `[10, 20, 30]`, non-numeric cells ignored without error.
- **T2.7.3 (Small Sample Fallback $N < 4$)**: Dataset with fewer than 4 numeric entries falls back to min/max range check.
  - *Input*: Values `[10, 50]`.
  - *Expected*: Returns `{ note: "Insufficient data for IQR", sampleSize: 2 }`.
- **T2.7.4 (Extreme Floating Point Values Handling)**: Range containing `NaN` or `Infinity` quarantines invalid numbers gracefully.
  - *Input*: Values `[10, 20, NaN, 30, Infinity]`.
  - *Expected*: Evaluates valid numbers `[10, 20, 30]` without calculation failure.
- **T2.7.5 (10,000-Row Performance Guard)**: Screening 10,000 numbers completes within 50ms performance budget.
  - *Input*: 10,000 pseudo-random numbers with 5 injected outliers.
  - *Expected*: Execution duration $< 50$ms, all 5 outliers detected.

### Feature 8: sAI Studio Smart Summarization
- **T2.8.1 (Completely Empty Selection Guard)**: Running summarization on empty selection displays informative notice without creating blank tab.
  - *Input*: Empty selection range `null`.
  - *Expected*: Returns error `{ ok: false, error: "Selection range contains no data" }`.
- **T2.8.2 (Single-Column Numeric Summary)**: Summarizing a single column of numbers generates single-metric KPI card cleanly.
  - *Input*: Single column `[100, 200, 300]`.
  - *Expected*: Generates summary tab with single metric card (Total: 600, Avg: 200).
- **T2.8.3 (Mixed Column Data Type Preservation)**: Table with text, currency, percentage, and date columns formats cards appropriately.
  - *Input*: Columns with currency (`$1,000`) and percentage (`15%`).
  - *Expected*: Summarized totals retain currency symbol and percentage format.
- **T2.8.4 (100-Column Wide Table Aggregation)**: Wide table with 100 columns aggregates summary metrics without prompt overflow.
  - *Input*: Table with 100 numeric columns.
  - *Expected*: Profiles all 100 columns; LLM prompt summarizes top 10 key drivers.
- **T2.8.5 (Auto-Increment Sheet Name Collision Guard)**: If `"Executive Summary"` already exists, subsequent sheet names become `"Executive Summary 2"`.
  - *Input*: Workbook already has sheet named `"Executive Summary"`.
  - *Expected*: Newly inserted sheet is named `"Executive Summary 2"`.

### Feature 9: Advanced Business Charts (Waterfall, Treemap, Combo)
- **T2.9.1 (All-Negative Waterfall Deltas)**: Waterfall chart where all intermediate changes are negative renders bars extending downward from decreasing bases.
  - *Input*: Start 100, deltas `[-20, -30, -40]`, Final 10.
  - *Expected*: All delta bars render with negative delta styling; final total bar rests on zero baseline.
- **T2.9.2 (Single-Item Treemap Aspect Ratio)**: Treemap with single data item renders 100% full-viewport rectangle.
  - *Input*: Single category with value 100, viewport $w=500, h=300$.
  - *Expected*: Single rect with $x=0, y=0, width=500, height=300$.
- **T2.9.3 (Zero and Negative Weight Treemap Filtering)**: Data items with weights $\le 0$ are filtered out before layout calculation.
  - *Input*: Weights `[50, 0, -10, 30]`.
  - *Expected*: Treemap partitions only positive weights `[50, 30]`.
- **T2.9.4 (Missing Secondary Axis Series)**: Combo chart with missing secondary axis data renders primary axis bars cleanly.
  - *Input*: Primary series defined, secondary series empty `[]`.
  - *Expected*: Renders primary bar chart cleanly without SVG NaN coordinate errors.
- **T2.9.5 (Zero-Dimension Viewport Guard)**: Collapsed chart container ($w \le 0$ or $h \le 0$) suppresses SVG rendering without throwing.
  - *Input*: Viewport dimensions $w=0, h=0$.
  - *Expected*: Renders empty `<svg width="0" height="0"></svg>` safely.

### Feature 10: Mini In-Cell Sparklines (`=SPARKLINE`)
- **T2.10.1 (Empty Data Array Guard)**: `=SPARKLINE({})` or blank cell range renders empty SVG without error.
  - *Input*: Empty range.
  - *Expected*: Renders empty SVG element safely.
- **T2.10.2 (Single Data Point Centered Dot)**: Single numeric value renders centered point or single centered column bar.
  - *Input*: Values `[25]`.
  - *Expected*: Renders valid SVG without division-by-zero coordinate NaN.
- **T2.10.3 (Uniform Constant Data Series)**: Series with identical values (e.g. `[10, 10, 10]`) centers horizontal line at cell midpoint.
  - *Input*: Values `[10, 10, 10]`, cell height 24.
  - *Expected*: Polyline Y-coordinates are all $y = 12$ (midpoint).
- **T2.10.4 (NaN / Null / String Ingestion Handling)**: Series containing non-numeric strings or `null` skips or interpolates missing points.
  - *Input*: Values `[10, null, 30]`.
  - *Expected*: Line connects valid points or breaks path without NaN attributes.
- **T2.10.5 (Extreme Narrow Cell Aspect Ratio)**: Extremely narrow cell ($w=10, h=24$) clamps minimum bar width to 1px.
  - *Input*: 5 columns in 10px width.
  - *Expected*: Rect widths are $\ge 1$px and render within viewBox.

### Feature 11: Interactive Button Slicers
- **T2.11.1 (High Cardinality Virtualization / Search)**: Column with 1,000+ distinct values enables search filter in slicer panel.
  - *Input*: 1,000 distinct city names.
  - *Expected*: Slicer data model supports search query filtering item list.
- **T2.11.2 (Explicit (Blanks) Button Item)**: Column with blank/null cells generates explicit `(Blanks)` clickable button.
  - *Input*: Column values `["A", null, "B", ""]`.
  - *Expected*: Slicer items include `"(Blanks)"`.
- **T2.11.3 (Pivot Table Cache Filtering)**: Slicer attached to Pivot Table filters Pivot Cache rather than raw worksheet rows.
  - *Input*: Toggle slicer button attached to Pivot Table.
  - *Expected*: Pivot recomputation filter updated; grid displays recomputed summary.
- **T2.11.4 (Multiple Slicers Conjunction AND Logic)**: Applying selections across multiple slicers applies logical AND intersection.
  - *Input*: Slicer 1 (Region="East"), Slicer 2 (Category="Hardware").
  - *Expected*: Only rows matching both `Region="East"` AND `Category="Hardware"` remain visible.
- **T2.11.5 (Dynamic Table Row Insertion Refresh)**: Inserting new rows into source table dynamically updates slicer item list.
  - *Input*: Row with new region `"Central"` added to source table.
  - *Expected*: Slicer button list includes `"Central"`.

### Feature 12: Pivot Table Calculated Fields
- **T2.12.1 (Division by Zero `#DIV/0!` Handling)**: Formula dividing by zero (e.g. `='Profit' / 'Revenue'` where Revenue=0) returns `#DIV/0!`.
  - *Input*: Formula `='A' / 'B'`, row values `{ A: 100, B: 0 }`.
  - *Expected*: Evaluates to `"#DIV/0!"`.
- **T2.12.2 (Circular Reference Detection)**: Circular dependency between calculated fields raises `#CIRCULAR!` error.
  - *Input*: Field1 references Field2, Field2 references Field1.
  - *Expected*: AST evaluator detects cycle and returns `#CIRCULAR!`.
- **T2.12.3 (Special Characters in Field Names)**: Field names with spaces and symbols `='Total Sales (USD)' - 'Tax Rate %'` parse correctly.
  - *Input*: Formula with escaped single quotes.
  - *Expected*: AST resolves correct fields without tokenizer syntax errors.
- **T2.12.4 (Unknown Field Name `#NAME?` Error)**: Referencing non-existent field returns `#NAME?`.
  - *Input*: Formula `='UnknownField' * 2`.
  - *Expected*: Evaluates to `"#NAME?"`.
- **T2.12.5 (Empty Formula Validation)**: Blank or whitespace-only formula in dialog raises validation error.
  - *Input*: Formula `""` or `"   "`.
  - *Expected*: Validation returns `{ isValid: false, error: "Formula cannot be empty" }`.

### Feature 13: TypeScript Automation Script Sandbox
- **T2.13.1 (5000ms Watchdog Infinite Loop Guard)**: Infinite loop script (`while(true){}`) is terminated by sandbox timeout.
  - *Input*: Script code `while(true) {}`.
  - *Expected*: Execution aborted after 5000ms with timeout error.
- **T2.13.2 (Restricted Global Access Sandbox Guard)**: Attempts to access `window`, `document`, `fetch`, or `localStorage` are blocked.
  - *Input*: Script code `fetch("https://evil.com")`.
  - *Expected*: Throws reference or security error (`fetch is not defined`).
- **T2.13.3 (Syntax and Runtime Error Capture)**: Syntax errors in user script are captured and returned in `ScriptOutput.error`.
  - *Input*: Script code `const x = ;`.
  - *Expected*: Returns `{ ok: false, error: "Unexpected token ';'" }`.
- **T2.13.4 (10,000-Operation Batch Budget)**: Massive script updating 10,000 cells executes efficiently without memory leak.
  - *Input*: Script loop modifying 10,000 cells.
  - *Expected*: Batch plan generated with 10,000 operations within memory limits.
- **T2.13.5 (Empty Script No-Op Handling)**: Empty script or comment-only script executes with 0 operations and success status.
  - *Input*: Script code `"// just comments"`.
  - *Expected*: Returns `{ ok: true, operations: [], logs: [] }`.

### Feature 14: External Data Import (CSV/TSV, JSON, REST API)
- **T2.14.1 (Malformed CSV Unmatched Quotes Recovery)**: CSV with unclosed trailing quote recovers gracefully without infinite loop.
  - *Input*: `"Name,Age\n\"Alice,30\nBob,25"`.
  - *Expected*: Parses available records without infinite parser hang.
- **T2.14.2 (50,000-Row Chunked Parsing Guard)**: Large CSV parses in streaming chunks without memory exhaustion.
  - *Input*: 50,000 rows CSV data stream.
  - *Expected*: Parsed successfully into table model within memory budget.
- **T2.14.3 (Polymorphic Heterogeneous JSON Schema Union)**: JSON records with differing property sets produce unified column union.
  - *Input*: `[{"id": 1, "a": 10}, {"id": 2, "b": 20}]`.
  - *Expected*: Headers `["id", "a", "b"]`, Rows `[[1, 10, null], [2, null, 20]]`.
- **T2.14.4 (REST API HTTP 404/500 Error Handling)**: REST connector encountering HTTP error returns clear diagnostic message.
  - *Input*: Mock endpoint returns HTTP 404 Not Found.
  - *Expected*: Returns error `{ ok: false, error: "HTTP 404: Endpoint not found" }`.
- **T2.14.5 (Zero-Byte File Empty Payload Guard)**: Importing 0-byte file displays warning without corrupting active sheet.
  - *Input*: 0-byte file input.
  - *Expected*: Returns warning `{ ok: false, error: "File is empty" }`.

### Feature 15: Byte-Preserving OpenXML & Typecheck Quality
- **T2.15.1 (Zero Data Cell Empty Worksheet XML)**: Serializing sheet with 0 cells produces minimal valid XML accepted by Excel.
  - *Input*: Empty worksheet.
  - *Expected*: Valid `<worksheet><sheetData/></worksheet>` XML.
- **T2.15.2 (XML Special Character Escaping)**: Strings with `&`, `<`, `>`, `"`, `'` are escaped into `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`.
  - *Input*: Cell text `"Tom & Jerry <10> 'Special' \"Quotes\""`.
  - *Expected*: Serialized XML properly escapes all 5 entities.
- **T2.15.3 (Unknown Extension Byte Preservation)**: Custom XML parts and `<extLst>` extensions from source file are preserved byte-for-byte.
  - *Input*: OpenXML file with custom XML part.
  - *Expected*: Resaved file retains custom XML part with matching MD5 hash.
- **T2.15.4 (Calculation Chain Integrity Guard)**: Dynamic array formula serialization does not corrupt `<calcChain>`.
  - *Input*: Workbook with complex formulas and dynamic arrays.
  - *Expected*: Calculation chain references formula cells accurately.
- **T2.15.5 (Non-ASCII Sheet Name & Unicode UTF-8)**: Sheet named `"Báo Cáo Tài Chính 📊"` serializes with UTF-8 encoding.
  - *Input*: Sheet name with Vietnamese diacritics and emoji.
  - *Expected*: `<sheet name="Báo Cáo Tài Chính 📊" .../>` preserves characters.

### Feature 16: Comprehensive E2E Verification & Test Suite
- **T2.16.1 (Failure Isolation Stack Trace Capture)**: Test assertion failure captures error message and stack trace without aborting suite.
  - *Input*: Mock failing assertion in test runner.
  - *Expected*: Test recorded as `FAILED`, runner continues executing remaining tests.
- **T2.16.2 (Headless CI/CD Non-TTY Guard)**: Test runner executes under non-interactive CI without hanging on TTY input.
  - *Input*: Run with redirected stdin (`< /dev/null`).
  - *Expected*: Completes execution unattended.
- **T2.16.3 (Memory Bounded Stability Across 184 Tests)**: RSS memory usage remains stable throughout full suite run.
  - *Input*: Measure memory before and after running 184 tests.
  - *Expected*: Memory delta remains within acceptable bounds ($< 50$MB heap delta).
- **T2.16.4 (Idempotent Sequential Execution)**: Running full suite twice in same process produces identical pass/fail tallies.
  - *Input*: Execute suite iteration 1 then iteration 2.
  - *Expected*: Both iterations produce identical results.
- **T2.16.5 (Minimal Node.js Runtime Compatibility)**: Runner executes on clean Node.js runtime without external devDependencies.
  - *Input*: Execute runner with only core standard modules.
  - *Expected*: Runs cleanly without module resolution errors.

---

## 6. Tier 3: Cross-Feature Interactions (16 Test Cases)

- **T3.1 (Dynamic Array FILTER + In-Cell Sparkline)**: `FILTER` extracts sub-series dynamically and pipes into in-cell `=SPARKLINE(FILTER(...))`.
  - *Features*: F1 (Dynamic Arrays) + F10 (In-Cell Sparklines).
  - *Scenario*: Monthly sales table filtered by Product category `"Electronics"`; sparkline in header cell renders SVG polyline reflecting filtered data points.
  - *Expected*: Sparkline path recalculates dynamically when filter criteria changes.
- **T3.2 (Google Sheets SQL `=QUERY` + Dynamic Array Spilling)**: `=QUERY` evaluates multi-row projection and triggers dynamic array spill engine.
  - *Features*: F2 (SQL Query Engine) + F3 (Spill Collision Lifecycle).
  - *Scenario*: `=QUERY(A1:D20, "SELECT Col1, Col3 WHERE Col2 > 50")` in `F1` spills across `F1:G8`. If `G4` is occupied, `F1` shows `#SPILL!`. Clearing `G4` re-spills immediately.
  - *Expected*: Full `#SPILL!` collision lifecycle verified on SQL query output.
- **T3.3 (Dynamic Array Formulas + OpenXML Serialization)**: Modern formulas (`SEQUENCE`, `SORTBY`, `UNIQUE`) serialize with `_xlws.` markers and `t="array"`.
  - *Features*: F1 (Dynamic Arrays) + F4 (OpenXML Serialization).
  - *Scenario*: Sheet contains `=SORTBY(UNIQUE(A1:A10), B1:B10)`. Save to `.xlsx`, inspect XML, and reload.
  - *Expected*: Stored XML has `_xlfn._xlws.SORTBY(_xlfn._xlws.UNIQUE(...))` and `cm="1"`; reloaded sheet displays clean formula without markers.
- **T3.4 (AI In-Cell Function + Formula Cache Memoization)**: In-cell `=AI` formula memoizes in `AiFormulaCache`, preventing recalculation loops.
  - *Features*: F5 (AI Functions) + F6 (AI Formula Caching).
  - *Scenario*: Sheet with 20 `=AI("Classify", A1:A20)` formulas triggers workbook calculation cycle twice.
  - *Expected*: First cycle resolves via API; second cycle returns memoized values in $< 1$ms with 0 network calls.
- **T3.5 (CSV External Data Import + AI Entity Extraction)**: Imported customer survey CSV text fed into `=AI_EXTRACT` for email and phone extraction.
  - *Features*: F14 (Data Import) + F5 (AI Functions).
  - *Scenario*: Import raw customer feedback CSV into `A1:B100`. Column C applies `=AI_EXTRACT("email", B1:B100)`.
  - *Expected*: Extracted emails populate column C cleanly.
- **T3.6 (Anomaly Detection + Advanced Waterfall Chart)**: Statistical anomaly detection flags financial variance outliers, highlighted in Waterfall Chart.
  - *Features*: F7 (Anomaly Detection) + F9 (Advanced Charts).
  - *Scenario*: Monthly variance dataset analyzed with IQR screening; outlier month flagged in red and highlighted in SVG Waterfall chart.
  - *Expected*: Outlier bar in Waterfall chart displays highlighted accent color and annotation.
- **T3.7 (Smart Summarization + Squarified Treemap Chart)**: Smart Summarization computes category hierarchy totals, rendered directly in Treemap Chart.
  - *Features*: F8 (Smart Summarization) + F9 (Advanced Charts).
  - *Scenario*: Summarization generates category breakdown table; 1-click Insert Chart creates Squarified Treemap from summary data.
  - *Expected*: Treemap SVG rects match summarized category weight proportions.
- **T3.8 (Button Slicer + Pivot Table Calculated Fields)**: Slicer button clicks filter Pivot Table data, and Calculated Fields re-evaluate dynamic ratios.
  - *Features*: F11 (Button Slicers) + F12 (Pivot Calculated Fields).
  - *Scenario*: Slicer filters by Department `"Engineering"`; calculated field `="Budget Variance" / "Headcount"` recalculates dynamically for filtered subset.
  - *Expected*: Calculated field reflects filtered department aggregation instantly.
- **T3.9 (Button Slicer + Advanced Combo Chart)**: Interactive Slicer toggles filter source table, instantly updating dual-axis series in Combo Chart.
  - *Features*: F11 (Button Slicers) + F9 (Advanced Charts).
  - *Scenario*: Slicer filters by Year `"2025"`; Combo chart updates left axis (Revenue bars) and right axis (Margin % line) without chart reload.
  - *Expected*: Both primary and secondary SVG series redraw with filtered data points.
- **T3.10 (TypeScript Automation Script + Dynamic Array Spilling)**: Automation script writes `=SEQUENCE(10, 5)` into sheet, triggering dynamic spill engine.
  - *Features*: F13 (Automation Sandbox) + F3 (Spill Collision Lifecycle).
  - *Scenario*: Script executes `getRange("A1").setFormula("=SEQUENCE(10, 5)")`.
  - *Expected*: Atomic operation plan applied, engine allocates $10 \times 5$ spill range `A1:E10`.
- **T3.11 (TypeScript Automation Script + External Data Import)**: Script automates CSV import and applies conditional formatting rules.
  - *Features*: F13 (Automation Sandbox) + F14 (Data Import).
  - *Scenario*: Script fetches CSV from endpoint, converts to matrix, and applies bold header formatting.
  - *Expected*: Single atomic undo transaction restores sheet to pre-import state.
- **T3.12 (External JSON Import + Google Sheets SQL `=QUERY`)**: JSON API response flattened to 2D table and queried using `=QUERY`.
  - *Features*: F14 (Data Import) + F2 (SQL Query Engine).
  - *Scenario*: JSON user list imported to `A1:D50`. In `F1`, `=QUERY(A1:D50, "SELECT Col1, Col3 WHERE Col4 = 'Active' ORDER BY Col2")` executes.
  - *Expected*: Filtered and sorted subset appears in `F1:G25`.
- **T3.13 (OpenXML Serialization + Byte-Preserving Roundtrip)**: Dynamic array workbook serialized to `.xlsx`, re-opened, and asserted for byte fidelity.
  - *Features*: F4 (Dynamic Array Metadata) + F15 (Byte-Preserving Quality).
  - *Scenario*: Workbook containing `FILTER`, `SORT`, `QUERY`, custom formatting, and metadata saved and reloaded.
  - *Expected*: Zero loss of formulas, formatting, or XML namespaces across save/load cycle.
- **T3.14 (In-Cell AI Translation + Pivot Table Aggregation)**: Multilingual product categories translated via `=AI_TRANSLATE` and summarized in Pivot Table.
  - *Features*: F5 (AI Functions) + F12 (Pivot Table Engine).
  - *Scenario*: Column of French product categories translated to English via `=AI_TRANSLATE`; Pivot Table groups sales by translated category.
  - *Expected*: Pivot Table groups items by resolved English categories correctly.
- **T3.15 (In-Cell Formula AI Loop Guard + Automation Script Batch)**: Large batch updates from TypeScript Script do not trigger recalculation storm in AI loop guard.
  - *Features*: F6 (AI Loop Guard) + F13 (Automation Sandbox).
  - *Scenario*: Script updates 500 cells in workbook containing dependent `=AI` formulas.
  - *Expected*: AI formulas join debounced recalculation batch; 0 duplicate upstream requests fired.
- **T3.16 (Dynamic Array XLOOKUP + Pivot Table Calculated Field)**: Currency conversion rates retrieved via `=XLOOKUP` used inside Pivot Table Calculated Field.
  - *Features*: F1 (Dynamic Arrays) + F12 (Pivot Calculated Fields).
  - *Scenario*: Lookup table has exchange rates; calculated field `='Amount' * 'EUR_Rate'` evaluates in Pivot values.
  - *Expected*: Converted amounts calculate accurately across all pivot rows.

---

## 7. Tier 4: Real-World Business Scenarios (8 Realistic Application Tests)

- **T4.1 (Corporate Financial P&L Statement)**:
  - *Business Domain*: Corporate Finance & Accounting.
  - *Workflow*:
    1. Import quarterly trial balance table with Revenue, COGS, Operating Expenses, and Taxes.
    2. Add Pivot Table with Calculated Fields for Gross Margin % (`=('Revenue'-'COGS')/'Revenue'`) and Operating Margin %.
    3. Run sAI Studio Anomaly Detection on expense lines, detecting unexpected travel expense spike ($Z = 3.2$, red alert).
    4. Generate Advanced Waterfall Chart visualizing EBITDA progression from Gross Revenue to Net Income.
    5. Trigger sAI Studio Smart Summarization, inserting an "Executive Summary" tab with KPI tiles.
  - *Expected*: All calculations, outlier detections, SVG waterfall coordinates, and executive summary sheet generate with 100% precision.

- **T4.2 (Enterprise Sales Pipeline & Commission Management)**:
  - *Business Domain*: Sales Operations & Compensation.
  - *Workflow*:
    1. Ingest multi-representative sales CSV dataset with Region, Rep Name, Deal Size, and Close Date.
    2. Place interactive Button Slicers for Region (`North`, `South`, `East`, `West`) and Quarter (`Q1`, `Q2`, `Q3`, `Q4`).
    3. Calculate commission tiers using modern dynamic array formulas `=SORTBY(FILTER(Data, Quota_Met), Deal_Size, -1)`.
    4. Render Advanced Combo Chart displaying Quota vs Actual Revenue (left axis bars) and Attainment % (right axis line).
  - *Expected*: Toggling slicers filters table rows instantly, re-evaluates dynamic commission arrays, and redraws dual-axis chart.

- **T4.3 (Global E-Commerce Multi-Currency Inventory)**:
  - *Business Domain*: Retail & Supply Chain.
  - *Workflow*:
    1. Product catalogue table with SKU, Category, Local Currency Price, and 30-day daily stock history.
    2. Use `=XLOOKUP` to fetch live exchange rates and `=UNIQUE` to extract product categories.
    3. Embed in-cell mini Sparklines (`=SPARKLINE(Stock_History, {"charttype", "line"})`) showing inventory velocity per SKU.
    4. Run Anomaly Detection to flag pricing errors where local price deviates significantly from USD standard.
  - *Expected*: Lookups resolve, sparklines render vector SVG paths inside cells, and pricing outliers highlight in amber/red.

- **T4.4 (Multilingual HR Recruitment & Talent Sourcing)**:
  - *Business Domain*: Human Resources & Talent Acquisition.
  - *Workflow*:
    1. Ingest unstructured candidate resume submissions containing contact info, skills, and multilingual self-descriptions.
    2. Use `=AI_EXTRACT("email", Cell)` and `=AI_EXTRACT("phone", Cell)` to parse contact details into structured columns.
    3. Use `=AI_TRANSLATE(Bio_Cell, "en")` to translate foreign language resumes into English.
    4. Create Pivot Table with Department Slicers to review applicant pipeline by experience level.
  - *Expected*: Contact details parsed cleanly, bios translated into English, and slicer buttons filter applicant review table.

- **T4.5 (Supply Chain Logistics & Warehouse Bay Allocation)**:
  - *Business Domain*: Logistics & Fulfillment Operations.
  - *Workflow*:
    1. Import freight tracking log with Order ID, Origin, Destination, Pallets, and Transit Delay Days.
    2. Execute Google Sheets SQL `=QUERY(A1:E500, "SELECT Col1, Col3, Col4 WHERE Col5 > 3 ORDER BY Col5 DESC")` to isolate delayed shipments.
    3. Verify dynamic array spill lifecycle: spill output expands across destination grid with collision checks.
    4. Construct Squarified Treemap Chart displaying warehouse space allocation by product family.
  - *Expected*: SQL query filters delayed orders, spill range renders without collision, and Treemap rectangles partition space proportionally.

- **T4.6 (C-Suite Executive KPI Dashboard Automation)**:
  - *Business Domain*: Executive Management & Reporting.
  - *Workflow*:
    1. Execute TypeScript Automation Script in isolated Web Worker sandbox to build full executive dashboard.
    2. Script creates `"Dashboard"` sheet, formats header cards, calculates Trailing Twelve Months (TTM) KPIs, and generates 12-month Sparklines.
    3. Script inserts Combo Chart plotting Monthly Revenue vs Operating Margin %.
    4. Verify atomic undo: invoking `undo()` removes all generated sheets and dashboard elements in single step.
  - *Expected*: Script produces valid `WorkbookOperation[]` plan, dashboard renders completely, and atomic undo succeeds cleanly.

- **T4.7 (Customer Support Ticket Sentiment & Analytics)**:
  - *Business Domain*: Customer Experience & Support.
  - *Workflow*:
    1. Import customer support tickets from JSON API payload via External Data Import connector.
    2. Classify ticket sentiment using in-cell `=AI("Classify sentiment as Positive, Neutral, or Negative", Text_Cell)`.
    3. Verify `AiFormulaCache` memoizes classifications to prevent redundant API calls on sheet refresh.
    4. Construct Pivot Table aggregating ticket volume by Category and Sentiment, with calculated field for First-Contact Resolution Rate.
  - *Expected*: JSON parsed into table, sentiment classified and cached, and Pivot Table calculates resolution rates accurately.

- **T4.8 (Audit & Compliance OpenXML Exchange Cycle)**:
  - *Business Domain*: Enterprise IT & Compliance.
  - *Workflow*:
    1. Create financial compliance workbook containing dynamic arrays (`FILTER`, `SORT`, `SEQUENCE`), `=QUERY`, and Pivot Table with Calculated Fields.
    2. Serialize workbook to OpenXML `.xlsx` package with full `_xlws.` prefixes, `cm="1"`, `<f t="array">`, and `XLDAPR` metadata.
    3. Validate package ZIP structure and ECMA-376 XML schema conformity.
    4. Reload workbook and verify byte-preserving roundtrip fidelity with 0 lost formulas or corrupted styles.
  - *Expected*: Package opens cleanly in Microsoft Excel 365 and Google Sheets with zero repair warnings or `#NAME?` errors.

---

## 8. Authoritative Expected Output Derivation & Oracle Baseline

Every test case across Tiers 1-4 derives its expected output from authoritative sources:
1. **Mathematical & Statistical Algorithms**:
   - IQR: Fences $Q1 - 1.5 \times IQR$ and $Q3 + 1.5 \times IQR$ calculated using standard rank interpolation ($p = 0.25, 0.75$).
   - Z-Score: Standardized metric $Z = \frac{x - \mu}{\sigma}$ with population/sample standard deviation.
   - Treemap: Squarified layout algorithm (Bruls, Huizing, van Wijk) maintaining aspect ratio $\approx 1.0$.
   - Waterfall: Cumulative baseline progression $B_{i} = B_{i-1} + \Delta_{i-1}$ with anchor pillars.
2. **OpenXML Standards & Microsoft Excel Specifications**:
   - ECMA-376 5th Edition (Office Open XML File Formats).
   - Microsoft Open Specifications `[MS-XLSX]` & `[MS-OE376]` for future storage markers (`_xlfn._xlws.`).
   - Dynamic array cell attribute `cm="1"` and formula tag `<f t="array" ref="...">`.
3. **Google Sheets Query Language Grammar**:
   - Google Visualization API Query Language version 0.7 (`SELECT`, `WHERE`, `ORDER BY`, `GROUP BY`, `LIMIT`, `OFFSET`, `LABEL`).
4. **RFC Specifications**:
   - RFC 4180 for CSV parsing (escaped quotes `""`, line breaks, delimiter detection).
5. **sOffice Project Contracts**:
   - `PROJECT.md § Interface Contracts`: AI Formula Cache Key `${unitId}:${sheetId}:${row}:${col}:${hash(formula + args)}`.
   - Script Sandbox Contract: `ScriptOutput { ok, operations, logs, error }`.

---

## 9. Test Execution & Reporting Harness

### 9.1 Running the Suite
Execute the master runner on VPS `hmu-vm-soffice`:
```bash
# Full test suite execution (184 test cases)
cd /home/ubuntu/SOFFICE && node e2e/sheets-all-tiers.mjs

# Tier-specific runs
node e2e/sheets-all-tiers.mjs --tier=1   # 80 Feature Coverage tests
node e2e/sheets-all-tiers.mjs --tier=2   # 80 Boundary & Corner tests
node e2e/sheets-all-tiers.mjs --tier=3   # 16 Cross-Feature tests
node e2e/sheets-all-tiers.mjs --tier=4   # 8 Real-World tests

# Feature-specific run
node e2e/sheets-all-tiers.mjs --feature=1  # Feature 1 Dynamic Arrays
```

### 9.2 Machine-Readable JSON Output
The runner writes `e2e/sheets-test-results.json` containing:
```json
{
  "timestamp": "2026-10-05T02:35:00Z",
  "summary": {
    "total": 184,
    "passed": 184,
    "failed": 0,
    "passRate": "100.0%",
    "durationMs": 1420
  },
  "tiers": {
    "tier1": { "total": 80, "passed": 80, "failed": 0 },
    "tier2": { "total": 80, "passed": 80, "failed": 0 },
    "tier3": { "total": 16, "passed": 16, "failed": 0 },
    "tier4": { "total": 8, "passed": 8, "failed": 0 }
  },
  "cases": [ ... ]
}
```

The runner exits with code `0` on 100% pass, and code `1` if any test fails, enabling direct integration into CI/CD quality gates.
