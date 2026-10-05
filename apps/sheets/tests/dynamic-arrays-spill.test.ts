/**
 * Dynamic Array Spilling & Collision Lifecycle Test Suite
 *
 * Validates:
 * 1. Single cell dynamic array formula spilling into rectangular grid.
 * 2. Collision detection triggering #SPILL! when follower cells are blocked.
 * 3. Auto-clearing #SPILL! and populating values when blocking cells are deleted.
 * 4. Reactive collision introduction on an active spilled range and recovery.
 * 5. Mutual collision when two dynamic array formulas overlap.
 */
import {
  ICommandService,
  IUniverInstanceService,
  LocaleType,
  LogLevel,
  Univer,
  UniverInstanceType,
} from '@univerjs/core'
import { FormulaDataModel, UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('Dynamic Arrays & Spill Lifecycle', () => {
  let univer: Univer
  let commandService: ICommandService
  let workbook: any
  let sheet: any
  let formulaDataModel: FormulaDataModel

  const settle = (ms = 1200) => new Promise((resolve) => setTimeout(resolve, ms))

  beforeEach(() => {
    univer = new Univer({ logLevel: LogLevel.ERROR, locale: LocaleType.EN_US, locales: {} })
    univer.registerPlugin(UniverFormulaEnginePlugin)
    univer.registerPlugin(UniverSheetsPlugin)
    univer.registerPlugin(UniverSheetsFormulaPlugin)
    const injector = univer.__getInjector()

    univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
      id: 'wb-spill-test',
      sheetOrder: ['sheet1'],
      name: 'Dynamic Array Spill Test',
      styles: {},
      sheets: {
        sheet1: { id: 'sheet1', name: 'Sheet1', rowCount: 20, columnCount: 20, cellData: {} },
      },
    })

    commandService = injector.get(ICommandService)
    formulaDataModel = injector.get(FormulaDataModel)
    workbook = injector.get(IUniverInstanceService).getUnit('wb-spill-test')
    sheet = workbook.getSheetBySheetId('sheet1')
  })

  afterEach(() => {
    univer?.dispose()
  })

  it('1. spills single cell formula into rectangular grid', async () => {
    // Enter =SEQUENCE(3, 2) in A1 (row 0, col 0)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
      value: { 0: { 0: { f: '=SEQUENCE(3, 2)' } } },
    })
    await settle()

    // 1. Anchor cell A1 holds formula and top-left value
    const a1 = sheet.getCell(0, 0)
    expect(a1?.f).toBe('=SEQUENCE(3, 2)')
    expect(a1?.v).toBe(1)

    // 2. Follower cells receive spilled values in 3x2 rectangular grid
    expect(sheet.getCell(0, 1)?.v).toBe(2) // B1
    expect(sheet.getCell(1, 0)?.v).toBe(3) // A2
    expect(sheet.getCell(1, 1)?.v).toBe(4) // B2
    expect(sheet.getCell(2, 0)?.v).toBe(5) // A3
    expect(sheet.getCell(2, 1)?.v).toBe(6) // B3

    // 3. Cells outside spill boundary remain unpopulated
    expect(sheet.getCell(0, 2)).toBeUndefined() // C1
    expect(sheet.getCell(3, 0)).toBeUndefined() // A4

    // 4. FormulaDataModel tracks exact bounding box
    const ranges = formulaDataModel.getArrayFormulaRange()['wb-spill-test']?.['sheet1']
    expect(ranges?.[0]?.[0]).toEqual({
      startRow: 0,
      startColumn: 0,
      endRow: 2,
      endColumn: 1,
    })
  })

  it('2. detects collision and triggers #SPILL! when follower cells are blocked', async () => {
    // 1. Pre-populate blocking obstacle in follower cell B2 (row 1, col 1)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
      value: { 1: { 1: { v: 'Blocking Obstacle' } } },
    })

    // 2. Enter =SEQUENCE(3, 2) in A1 (row 0, col 0)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
      value: { 0: { 0: { f: '=SEQUENCE(3, 2)' } } },
    })
    await settle()

    // 3. Anchor cell A1 must show #SPILL! error
    const a1 = sheet.getCell(0, 0)
    expect(a1?.v).toBe('#SPILL!')

    // 4. Blocking cell must not be overwritten
    expect(sheet.getCell(1, 1)?.v).toBe('Blocking Obstacle')

    // 5. Follower cells must NOT be populated with partial spill data
    expect(sheet.getCell(0, 1)).toBeUndefined()
    expect(sheet.getCell(1, 0)).toBeUndefined()
  })

  it('3. auto-clears #SPILL! and populates values when blocking cells are deleted', async () => {
    // 1. Place obstacle in follower cell B1 (row 0, col 1)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 1, endColumn: 1 },
      value: { 0: { 1: { v: 'Temporary Blocker' } } },
    })

    // 2. Set formula in A1 -> triggers #SPILL!
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
      value: { 0: { 0: { f: '=SEQUENCE(2, 2)' } } },
    })
    await settle()
    expect(sheet.getCell(0, 0)?.v).toBe('#SPILL!')

    // 3. Clear the blocking cell
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 1, endColumn: 1 },
      value: { 0: { 1: { v: null } } },
    })
    await settle()

    // 4. Anchor must automatically clear #SPILL! and populate full 2x2 grid
    expect(sheet.getCell(0, 0)?.v).toBe(1)
    expect(sheet.getCell(0, 1)?.v).toBe(2)
    expect(sheet.getCell(1, 0)?.v).toBe(3)
    expect(sheet.getCell(1, 1)?.v).toBe(4)
  })

  it('4. reacts to post-spill obstacle and re-spills upon obstacle removal', async () => {
    // 1. Spills cleanly
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
      value: { 0: { 0: { f: '=SEQUENCE(2, 2)' } } },
    })
    await settle()
    expect(sheet.getCell(0, 0)?.v).toBe(1)
    expect(sheet.getCell(1, 1)?.v).toBe(4)

    // 2. User enters value into active follower B2 (1, 1)
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
      value: { 1: { 1: { v: 'Interruption' } } },
    })
    await settle()
    expect(sheet.getCell(0, 0)?.v).toBe('#SPILL!')
    expect(sheet.getCell(1, 1)?.v).toBe('Interruption')

    // 3. User clears the obstacle from B2
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
      value: { 1: { 1: { v: null } } },
    })
    await settle()
    expect(sheet.getCell(0, 0)?.v).toBe(1)
    expect(sheet.getCell(1, 1)?.v).toBe(4)
  })

  it('5. triggers #SPILL! when two dynamic array formulas collide', async () => {
    // 1. Formula 1 at A1 (0, 0) spills into A1:B2
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
      value: { 0: { 0: { f: '=SEQUENCE(2, 2)' } } },
    })
    await settle()
    expect(sheet.getCell(0, 0)?.v).toBe(1)

    // 2. Formula 2 placed at B2 (1, 1) attempting to spill B2:C3 overlaps Formula 1
    await commandService.executeCommand('sheet.command.set-range-values', {
      unitId: 'wb-spill-test',
      subUnitId: 'sheet1',
      range: { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
      value: { 1: { 1: { f: '=SEQUENCE(2, 2)' } } },
    })
    await settle()

    // 3. Formula 1 at A1 detects collision and transitions to #SPILL!
    expect(sheet.getCell(0, 0)?.v).toBe('#SPILL!')
    expect(sheet.getCell(1, 1)?.v).toBe(1)
  })
})
