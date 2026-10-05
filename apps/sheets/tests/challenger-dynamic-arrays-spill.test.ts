/**
 * Empirical Challenger Stress Test Suite: Dynamic Array Spilling Lifecycle
 * Milestone M1 - sOffice Sheets
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  Univer,
  LocaleType,
  LogLevel,
  UniverInstanceType,
  ICommandService,
  IUniverInstanceService,
  UndoCommand,
  RedoCommand,
} from '@univerjs/core'
import {
  FormulaDataModel,
  UniverFormulaEnginePlugin,
} from '@univerjs/engine-formula'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { installQueryFunction } from '../src/renderer/functions/query-function'

describe('CHALLENGER STRESS SUITE: Dynamic Array Spilling Lifecycle', () => {
  let univer: Univer
  let commandService: ICommandService
  let workbook: any
  let sheet: any
  let formulaDataModel: FormulaDataModel
  let queryDisposable: { dispose(): void } | null = null

  const settle = (ms = 1200) => new Promise((resolve) => setTimeout(resolve, ms))

  beforeEach(() => {
    univer = new Univer({ logLevel: LogLevel.ERROR, locale: LocaleType.EN_US, locales: {} })
    univer.registerPlugin(UniverFormulaEnginePlugin)
    univer.registerPlugin(UniverSheetsPlugin)
    univer.registerPlugin(UniverSheetsFormulaPlugin)
    const injector = univer.__getInjector()

    univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
      id: 'wb-challenger-spill',
      sheetOrder: ['sheet1'],
      name: 'Challenger Spill Stress',
      styles: {},
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          rowCount: 20,
          columnCount: 20,
          cellData: {
            // Seed sample data in A1:B4 (rows 0..3, cols 0..1)
            0: { 0: { v: 40 }, 1: { v: 'Alpha' } },
            1: { 0: { v: 10 }, 1: { v: 'Beta' } },
            2: { 0: { v: 30 }, 1: { v: 'Gamma' } },
            3: { 0: { v: 20 }, 1: { v: 'Delta' } },
            // Seed duplicate data in C1:C6 (rows 0..5, col 2)
            4: { 2: { v: 20 } },
            5: { 2: { v: 10 } },
          },
        },
      },
    })

    commandService = injector.get(ICommandService)
    formulaDataModel = injector.get(FormulaDataModel)
    workbook = injector.get(IUniverInstanceService).getUnit('wb-challenger-spill')
    sheet = workbook.getSheetBySheetId('sheet1')

    queryDisposable = installQueryFunction({ univer } as any)
  })

  afterEach(() => {
    queryDisposable?.dispose()
    univer?.dispose()
  })

  // ==========================================================================
  // 1. NESTED DYNAMIC ARRAYS
  // ==========================================================================
  it('1.1 computes and spills nested FILTER(SORT(...))', async () => {
    // Put =FILTER(SORT(A1:B4, 1, 1), {TRUE; FALSE; TRUE; FALSE}) in D1 (0, 3)
    // Sorted by col A: row0=10 (Beta), row1=20 (Delta), row2=30 (Gamma), row3=40 (Alpha)
    // Filter {1; 0; 1; 0} picks row0 (10, Beta) and row2 (30, Gamma)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 3, endColumn: 3 },
      value: { 0: { 3: { f: '=FILTER(SORT(A1:B4, 1, 1), {TRUE; FALSE; TRUE; FALSE})' } } },
    })
    await settle()

    const d1 = sheet.getCell(0, 3)
    expect(d1?.v).toBe(10)
    expect(sheet.getCell(0, 4)?.v).toBe('Beta')
    expect(sheet.getCell(1, 3)?.v).toBe(30)
    expect(sheet.getCell(1, 4)?.v).toBe('Gamma')

    const ranges = formulaDataModel.getArrayFormulaRange()['wb-challenger-spill']?.['sheet1']
    expect(ranges?.[0]?.[3]).toEqual({
      startRow: 0,
      startColumn: 3,
      endRow: 1,
      endColumn: 4,
    })
  })

  it('1.2 computes and spills nested QUERY(SORT(...))', async () => {
    // Enter =QUERY(SORT(A1:B4, 1, 1), "SELECT Col1, Col2 WHERE Col1 >= 20") in D1 (0, 3)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 3, endColumn: 3 },
      value: { 0: { 3: { f: '=QUERY(SORT(A1:B4, 1, 1), "SELECT Col1, Col2 WHERE Col1 >= 20")' } } },
    })
    await settle()

    const d1 = sheet.getCell(0, 3)
    expect(d1?.v).toBe(20)
    expect(sheet.getCell(0, 4)?.v).toBe('Delta')
    expect(sheet.getCell(1, 3)?.v).toBe(30)
    expect(sheet.getCell(1, 4)?.v).toBe('Gamma')
    expect(sheet.getCell(2, 3)?.v).toBe(40)
    expect(sheet.getCell(2, 4)?.v).toBe('Alpha')

    const ranges = formulaDataModel.getArrayFormulaRange()['wb-challenger-spill']?.['sheet1']
    expect(ranges?.[0]?.[3]).toEqual({
      startRow: 0,
      startColumn: 3,
      endRow: 2,
      endColumn: 4,
    })
  })

  it('1.3 computes and spills nested UNIQUE(SORT(...)) on duplicate data', async () => {
    // Populate duplicate column C: C1:C6 = [30, 10, 30, 20, 20, 10]
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 5, startColumn: 2, endColumn: 2 },
      value: {
        0: { 2: { v: 30 } },
        1: { 2: { v: 10 } },
        2: { 2: { v: 30 } },
        3: { 2: { v: 20 } },
        4: { 2: { v: 20 } },
        5: { 2: { v: 10 } },
      },
    })
    await settle()

    // Formula in D1: =UNIQUE(SORT(C1:C6)) -> sorted: 10, 10, 20, 20, 30, 30 -> unique: 10, 20, 30
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 3, endColumn: 3 },
      value: { 0: { 3: { f: '=UNIQUE(SORT(C1:C6))' } } },
    })
    await settle()

    expect(sheet.getCell(0, 3)?.v).toBe(10)
    expect(sheet.getCell(1, 3)?.v).toBe(20)
    expect(sheet.getCell(2, 3)?.v).toBe(30)
    expect(sheet.getCell(3, 3)).toBeUndefined()
  })

  // ==========================================================================
  // 2. OBSTACLE COLLISIONS & MULTI-DIRECTIONAL BLOCKING
  // ==========================================================================
  it('2.1 handles multi-directional obstacle blocking and partial vs full unblocking', async () => {
    // Spill target: D1 (0, 3) with =SEQUENCE(3, 3) covering rows 0..2, cols 3..5
    // Place obstacle 1 at E1 (0, 4) [horizontal obstacle]
    // Place obstacle 2 at D3 (2, 3) [vertical obstacle]
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 2, startColumn: 3, endColumn: 5 },
      value: {
        0: { 4: { v: 'Block-Right' } },
        2: { 3: { v: 'Block-Bottom' } },
      },
    })

    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 3, endColumn: 3 },
      value: { 0: { 3: { f: '=SEQUENCE(3, 3)' } } },
    })
    await settle()

    // Must trigger #SPILL!
    expect(sheet.getCell(0, 3)?.v).toBe('#SPILL!')
    expect(sheet.getCell(0, 4)?.v).toBe('Block-Right')
    expect(sheet.getCell(2, 3)?.v).toBe('Block-Bottom')
    expect(sheet.getCell(0, 5)).toBeUndefined()
    expect(sheet.getCell(1, 3)).toBeUndefined()

    // Clear only horizontal obstacle -> STILL #SPILL! due to vertical obstacle
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 4, endColumn: 4 },
      value: { 0: { 4: { v: null } } },
    })
    await settle()
    expect(sheet.getCell(0, 3)?.v).toBe('#SPILL!')

    // Clear vertical obstacle -> Now completely unblocked, must cleanly re-spill!
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 2, endRow: 2, startColumn: 3, endColumn: 3 },
      value: { 2: { 3: { v: null } } },
    })
    await settle()
    expect(sheet.getCell(0, 3)?.v).toBe(1)
    expect(sheet.getCell(0, 4)?.v).toBe(2)
    expect(sheet.getCell(0, 5)?.v).toBe(3)
    expect(sheet.getCell(1, 3)?.v).toBe(4)
    expect(sheet.getCell(2, 3)?.v).toBe(7)
    expect(sheet.getCell(2, 5)?.v).toBe(9)
  })

  // ==========================================================================
  // 3. SHEET BOUNDARY OVERFLOW & EDGE COLLISIONS
  // ==========================================================================
  it('3.1 detects grid boundary overflow at bottom-right corner without crashing', async () => {
    // Sheet size is 20x20 (rows 0..19, cols 0..19)
    // Formula at T20 (row 19, col 19) attempting to spill 2x2 =SEQUENCE(2, 2)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 19, endRow: 19, startColumn: 19, endColumn: 19 },
      value: { 19: { 19: { f: '=SEQUENCE(2, 2)' } } },
    })
    await settle()

    const t20 = sheet.getCell(19, 19)
    expect(['#SPILL!', '#REF!']).toContain(t20?.v)
  })

  it('3.2 detects vertical boundary overflow at bottom row', async () => {
    // Formula at row 18, col 0 attempting to spill 5 rows down =SEQUENCE(5, 1)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 18, endRow: 18, startColumn: 0, endColumn: 0 },
      value: { 18: { 0: { f: '=SEQUENCE(5, 1)' } } },
    })
    await settle()

    const cell = sheet.getCell(18, 0)
    expect(['#SPILL!', '#REF!']).toContain(cell?.v)
  })

  it('3.3 detects horizontal boundary overflow at right column', async () => {
    // Formula at row 0, col 18 attempting to spill 5 columns right =SEQUENCE(1, 5)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 18, endColumn: 18 },
      value: { 0: { 18: { f: '=SEQUENCE(1, 5)' } } },
    })
    await settle()

    const cell = sheet.getCell(0, 18)
    expect(['#SPILL!', '#REF!']).toContain(cell?.v)
  })

  // ==========================================================================
  // 4. FROZEN PANES & COLLISION INTEGRITY
  // ==========================================================================
  it('4.1 spills cleanly across frozen pane split boundary', async () => {
    // Execute set-frozen command
    await commandService.executeCommand('sheet.command.set-frozen', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      startRow: 2,
      startColumn: 2,
      ySplit: 2,
      xSplit: 2,
    })
    await settle()

    // Formula at (0, 5) spilling 4x4 into frozen and non-frozen zones
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 5, endColumn: 5 },
      value: { 0: { 5: { f: '=SEQUENCE(4, 4)' } } },
    })
    await settle()

    // Formula at (0, 5) spans rows 0..3 (across freeze row split 2)
    expect(sheet.getCell(0, 5)?.v).toBe(1)
    expect(sheet.getCell(1, 5)?.v).toBe(5)
    expect(sheet.getCell(2, 5)?.v).toBe(9)
    expect(sheet.getCell(3, 5)?.v).toBe(13)
    expect(sheet.getCell(3, 8)?.v).toBe(16)
  })

  // ==========================================================================
  // 5. RAPID MUTATIONS, CONSECUTIVE STRESS CYCLES, AND UNDO/REDO
  // ==========================================================================
  it('5.1 rapid deletion, restoration, and re-spill consistency', async () => {
    // Baseline spill =SEQUENCE(2, 2) at D1 (0, 3)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-challenger-spill',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 3, endColumn: 3 },
      value: { 0: { 3: { f: '=SEQUENCE(2, 2)' } } },
    })
    await settle()
    expect(sheet.getCell(0, 3)?.v).toBe(1)
    expect(sheet.getCell(1, 4)?.v).toBe(4)

    // Run 5 rapid cycles of blocking obstacle placement and deletion
    for (let i = 0; i < 5; i++) {
      // Place blocker at E2 (1, 4)
      await commandService.executeCommand('sheet.command.set-range-values', {
        unitId: 'wb-challenger-spill',
        subUnitId: 'sheet1',
        range: { startRow: 1, endRow: 1, startColumn: 4, endColumn: 4 },
        value: { 1: { 4: { v: `Blocker-${i}` } } },
      })
      await settle(800)
      expect(sheet.getCell(0, 3)?.v).toBe('#SPILL!')
      expect(sheet.getCell(1, 4)?.v).toBe(`Blocker-${i}`)

      // Rapidly delete blocker
      await commandService.executeCommand('sheet.command.set-range-values', {
        unitId: 'wb-challenger-spill',
        subUnitId: 'sheet1',
        range: { startRow: 1, endRow: 1, startColumn: 4, endColumn: 4 },
        value: { 1: { 4: { v: null } } },
      })
      await settle(800)
      expect(sheet.getCell(0, 3)?.v).toBe(1)
      expect(sheet.getCell(0, 4)?.v).toBe(2)
      expect(sheet.getCell(1, 3)?.v).toBe(3)
      expect(sheet.getCell(1, 4)?.v).toBe(4)
    }

    // Verify FormulaDataModel maintained exact bounding box throughout
    const ranges = formulaDataModel.getArrayFormulaRange()['wb-challenger-spill']?.['sheet1']
    expect(ranges?.[0]?.[3]).toEqual({
      startRow: 0,
      startColumn: 3,
      endRow: 1,
      endColumn: 4,
    })
  }, 25000)
})
