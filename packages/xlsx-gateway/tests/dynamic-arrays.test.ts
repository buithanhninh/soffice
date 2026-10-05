import { describe, expect, it } from 'vitest'

import { csvToXlsxBuffer } from '../src/gateway/csv-import'
import {
  SPILL_FUNCTIONS,
  spillsDynamicArray,
  withFutureFunctionMarkers,
  XLWS_FUNCTIONS,
} from '../src/gateway/future-functions'
import {
  applyCellEditsToXlsx,
  createBufferEntrySource,
  dynamicArrayCellMetaIndex,
} from '../src/gateway/xlsx-gateway'

async function getSheetXml(buffer: Buffer, sheet = 'sheet1'): Promise<string> {
  const source = await createBufferEntrySource(buffer)
  return source.readText(`xl/worksheets/${sheet}.xml`)
}

async function hasMetadata(buffer: Buffer): Promise<boolean> {
  const source = await createBufferEntrySource(buffer)
  return source.has('xl/metadata.xml')
}

async function getMetadataXml(buffer: Buffer): Promise<string> {
  const source = await createBufferEntrySource(buffer)
  return source.readText('xl/metadata.xml')
}

async function getWorkbookRelsXml(buffer: Buffer): Promise<string> {
  const source = await createBufferEntrySource(buffer)
  return source.readText('xl/_rels/workbook.xml.rels')
}

async function getContentTypesXml(buffer: Buffer): Promise<string> {
  const source = await createBufferEntrySource(buffer)
  return source.readText('[Content_Types].xml')
}

describe('OpenXML future functions prefixing (_xlws. and _xlfn.)', () => {
  it('prefixes modern dynamic array functions with _xlfn._xlws.', () => {
    expect(withFutureFunctionMarkers('=FILTER(A1:A10, B1:B10>0)')).toBe(
      '=_xlfn._xlws.FILTER(A1:A10, B1:B10>0)',
    )
    expect(withFutureFunctionMarkers('=SORT(A1:A10)')).toBe('=_xlfn._xlws.SORT(A1:A10)')
    expect(withFutureFunctionMarkers('=SORTBY(A1:A10, B1:B10)')).toBe(
      '=_xlfn._xlws.SORTBY(A1:A10, B1:B10)',
    )
    expect(withFutureFunctionMarkers('=UNIQUE(A1:A10)')).toBe('=_xlfn._xlws.UNIQUE(A1:A10)')
    expect(withFutureFunctionMarkers('=SEQUENCE(10, 2)')).toBe('=_xlfn._xlws.SEQUENCE(10, 2)')
    expect(withFutureFunctionMarkers('=RANDARRAY(5, 5)')).toBe('=_xlfn._xlws.RANDARRAY(5, 5)')
    expect(withFutureFunctionMarkers('=XLOOKUP(A1, B1:B10, C1:C10)')).toBe(
      '=_xlfn._xlws.XLOOKUP(A1, B1:B10, C1:C10)',
    )
    expect(withFutureFunctionMarkers('=XMATCH(A1, B1:B10)')).toBe('=_xlfn._xlws.XMATCH(A1, B1:B10)')
  })

  it('normalizes lowercase names to canonical uppercase with _xlws. marker', () => {
    expect(withFutureFunctionMarkers('=sortby(a1:a10, b1:b10)')).toBe(
      '=_xlfn._xlws.SORTBY(a1:a10, b1:b10)',
    )
    expect(withFutureFunctionMarkers('=unique(a1:a10)')).toBe('=_xlfn._xlws.UNIQUE(a1:a10)')
    expect(withFutureFunctionMarkers('=sequence(5)')).toBe('=_xlfn._xlws.SEQUENCE(5)')
    expect(withFutureFunctionMarkers('=randarray(3, 3)')).toBe('=_xlfn._xlws.RANDARRAY(3, 3)')
    expect(withFutureFunctionMarkers('=xlookup(a1, b1:b5, c1:c5)')).toBe(
      '=_xlfn._xlws.XLOOKUP(a1, b1:b5, c1:c5)',
    )
    expect(withFutureFunctionMarkers('=xmatch(a1, b1:b5)')).toBe('=_xlfn._xlws.XMATCH(a1, b1:b5)')
  })

  it('leaves already marked calls untouched', () => {
    expect(withFutureFunctionMarkers('=_xlfn._xlws.UNIQUE(A1:A10)')).toBe(
      '=_xlfn._xlws.UNIQUE(A1:A10)',
    )
    expect(withFutureFunctionMarkers('=_xlfn.UNIQUE(A1:A10)')).toBe('=_xlfn.UNIQUE(A1:A10)')
    expect(withFutureFunctionMarkers('=_xlws.SORTBY(A1:A10, B1:B10)')).toBe(
      '=_xlws.SORTBY(A1:A10, B1:B10)',
    )
  })

  it('leaves string literals containing function names intact', () => {
    expect(withFutureFunctionMarkers('=IF(A1="UNIQUE", "SORTBY", "FILTER")')).toBe(
      '=IF(A1="UNIQUE", "SORTBY", "FILTER")',
    )
  })

  it('prefixes general future functions with standard _xlfn.', () => {
    expect(withFutureFunctionMarkers('=TEXTSPLIT(A1, ",")')).toBe('=_xlfn.TEXTSPLIT(A1, ",")')
    expect(withFutureFunctionMarkers('=CHOOSECOLS(A1:C10, 1, 2)')).toBe(
      '=_xlfn.CHOOSECOLS(A1:C10, 1, 2)',
    )
    expect(withFutureFunctionMarkers('=TOCOL(A1:C10)')).toBe('=_xlfn.TOCOL(A1:C10)')
    expect(withFutureFunctionMarkers('=CONCAT(A1:A5)')).toBe('=_xlfn.CONCAT(A1:A5)')
  })

  it('leaves QUERY and standard Excel functions unadorned', () => {
    expect(withFutureFunctionMarkers('=QUERY(A1:C10, "SELECT A")')).toBe(
      '=QUERY(A1:C10, "SELECT A")',
    )
    expect(withFutureFunctionMarkers('=SUM(A1:A10)')).toBe('=SUM(A1:A10)')
    expect(withFutureFunctionMarkers('=AVERAGE(B1:B10)')).toBe('=AVERAGE(B1:B10)')
  })
})

describe('dynamic array spill classification', () => {
  it('classifies modern array functions and QUERY as spill functions', () => {
    expect(spillsDynamicArray('=FILTER(A1:A10, B1:B10>0)')).toBe(true)
    expect(spillsDynamicArray('=SORT(A1:A10)')).toBe(true)
    expect(spillsDynamicArray('=SORTBY(A1:A10, B1:B10)')).toBe(true)
    expect(spillsDynamicArray('=UNIQUE(A1:A10)')).toBe(true)
    expect(spillsDynamicArray('=SEQUENCE(10)')).toBe(true)
    expect(spillsDynamicArray('=RANDARRAY(5, 5)')).toBe(true)
    expect(spillsDynamicArray('=QUERY(A1:C10, "SELECT A, B")')).toBe(true)
    expect(spillsDynamicArray('=TEXTSPLIT(A1, " ")')).toBe(true)
    expect(spillsDynamicArray('=CHOOSECOLS(A1:C10, 1)')).toBe(true)
    expect(spillsDynamicArray('=TOCOL(A1:C10)')).toBe(true)
  })

  it('identifies spill functions embedded inside expressions', () => {
    expect(spillsDynamicArray('=INDEX(SORTBY(A1:A10, B1:B10), 1)')).toBe(true)
    expect(spillsDynamicArray('=IF(A1>0, QUERY(B1:C10, "SELECT B"), "N/A")')).toBe(true)
  })

  it('does not classify scalar functions as spill functions', () => {
    expect(spillsDynamicArray('=SUM(A1:A10)')).toBe(false)
    expect(spillsDynamicArray('=VLOOKUP(A1, B1:C10, 2, FALSE)')).toBe(false)
    expect(spillsDynamicArray('=INDEX(A1:C10, 1, 1)')).toBe(false)
    expect(spillsDynamicArray('=IF(A1>0, 1, 0)')).toBe(false)
  })
})

describe('gateway dynamic array serialization & metadata roundtrip', () => {
  it('serializes =UNIQUE with cm="1", <f t="array">, and XLDAPR in xl/metadata.xml', async () => {
    const source = await csvToXlsxBuffer('HeaderA,HeaderB\n10,20\n30,40')
    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 2,
        writeValue: true,
        cell: { value: null, formula: '=UNIQUE(A1:A3)' },
      },
    ])

    const sheetXml = await getSheetXml(mutation.buffer)
    expect(sheetXml).toContain('<c r="C1" cm="1">')
    expect(sheetXml).toContain('<f t="array" ref="C1">_xlfn._xlws.UNIQUE(A1:A3)</f>')

    expect(await hasMetadata(mutation.buffer)).toBe(true)
    const metaXml = await getMetadataXml(mutation.buffer)
    expect(metaXml).toContain('<metadataType name="XLDAPR"')
    expect(metaXml).toContain('<futureMetadata name="XLDAPR"')
    expect(metaXml).toContain('fDynamic="1"')
    expect(metaXml).toContain('<cellMetadata count="1"><bk><rc t="1" v="0"/></bk></cellMetadata>')

    const relsXml = await getWorkbookRelsXml(mutation.buffer)
    expect(relsXml).toContain('Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sheetMetadata"')
    expect(relsXml).toContain('Target="metadata.xml"')

    const ctXml = await getContentTypesXml(mutation.buffer)
    expect(ctXml).toContain(
      '<Override PartName="/xl/metadata.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml"/>',
    )
  })

  it('serializes =SORTBY with _xlws. marker, cm="1", and <f t="array">', async () => {
    const source = await csvToXlsxBuffer('A,B\n2,10\n1,20')
    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 2,
        writeValue: true,
        cell: { value: null, formula: '=SORTBY(A1:A2, B1:B2)' },
      },
    ])

    const sheetXml = await getSheetXml(mutation.buffer)
    expect(sheetXml).toContain('<c r="C1" cm="1">')
    expect(sheetXml).toContain('<f t="array" ref="C1">_xlfn._xlws.SORTBY(A1:A2, B1:B2)</f>')
    expect(await hasMetadata(mutation.buffer)).toBe(true)
  })

  it('serializes =SEQUENCE with _xlws. marker, cm="1", and <f t="array">', async () => {
    const source = await csvToXlsxBuffer('A\n1')
    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 1,
        writeValue: true,
        cell: { value: null, formula: '=SEQUENCE(5)' },
      },
    ])

    const sheetXml = await getSheetXml(mutation.buffer)
    expect(sheetXml).toContain('<c r="B1" cm="1">')
    expect(sheetXml).toContain('<f t="array" ref="B1">_xlfn._xlws.SEQUENCE(5)</f>')
    expect(await hasMetadata(mutation.buffer)).toBe(true)
  })

  it('serializes =RANDARRAY with _xlws. marker, cm="1", and <f t="array">', async () => {
    const source = await csvToXlsxBuffer('A\n1')
    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 1,
        writeValue: true,
        cell: { value: null, formula: '=RANDARRAY(3, 2)' },
      },
    ])

    const sheetXml = await getSheetXml(mutation.buffer)
    expect(sheetXml).toContain('<c r="B1" cm="1">')
    expect(sheetXml).toContain('<f t="array" ref="B1">_xlfn._xlws.RANDARRAY(3, 2)</f>')
    expect(await hasMetadata(mutation.buffer)).toBe(true)
  })

  it('serializes =QUERY with cm="1", <f t="array">, XML escaping, and XLDAPR metadata', async () => {
    const source = await csvToXlsxBuffer('Item,Qty\nApples,5\nOranges,12')
    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 2,
        writeValue: true,
        cell: { value: null, formula: '=QUERY(A1:B3, "SELECT A WHERE B > 5")' },
      },
    ])

    const sheetXml = await getSheetXml(mutation.buffer)
    expect(sheetXml).toContain('<c r="C1" cm="1">')
    expect(sheetXml).toContain(
      '<f t="array" ref="C1">QUERY(A1:B3, "SELECT A WHERE B &gt; 5")</f>',
    )
    expect(await hasMetadata(mutation.buffer)).toBe(true)
  })

  it('does NOT inject cm="1" or t="array" for scalar formulas like =SUM', async () => {
    const source = await csvToXlsxBuffer('A\n1\n2')
    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 2,
        column: 0,
        writeValue: true,
        cell: { value: null, formula: '=SUM(A1:A2)' },
      },
    ])

    const sheetXml = await getSheetXml(mutation.buffer)
    expect(sheetXml).toContain('<c r="A3"><f>SUM(A1:A2)</f></c>')
    expect(sheetXml).not.toContain('cm="1"')
    expect(sheetXml).not.toContain('t="array"')
    expect(await hasMetadata(mutation.buffer)).toBe(false)
  })

  it('preserves existing XLDAPR metadata when saving additional dynamic arrays', async () => {
    const source = await csvToXlsxBuffer('A,B\n1,2')
    // First save: adds metadata.xml
    const mut1 = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 2,
        writeValue: true,
        cell: { value: null, formula: '=UNIQUE(A1:A2)' },
      },
    ])

    // Verify metadata was created and index is 1
    const metaXml1 = await getMetadataXml(mut1.buffer)
    expect(dynamicArrayCellMetaIndex(metaXml1)).toBe(1)

    // Second save onto mut1.buffer: adds another dynamic array formula
    const mut2 = await applyCellEditsToXlsx(mut1.buffer, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 3,
        writeValue: true,
        cell: { value: null, formula: '=SORT(B1:B2)' },
      },
    ])

    const sheetXml2 = await getSheetXml(mut2.buffer)
    expect(sheetXml2).toContain('<c r="C1" cm="1">')
    expect(sheetXml2).toContain('<c r="D1" cm="1">')
    expect(sheetXml2).toContain('<f t="array" ref="C1">_xlfn._xlws.UNIQUE(A1:A2)</f>')
    expect(sheetXml2).toContain('<f t="array" ref="D1">_xlfn._xlws.SORT(B1:B2)</f>')
  })
})
