/**
 * Empirical Challenger Stress Test Suite: OpenXML Dynamic Array Serialization
 * Milestone M1 - sOffice Sheets / @genoffice/xlsx-gateway
 */
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { spawnSync } from 'node:child_process'
import { DOMParser } from '@xmldom/xmldom'

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

function assertValidXml(xmlString: string, partName: string): void {
  // 1. Check with xmldom DOMParser
  const doc = new DOMParser({
    errorHandler: {
      error: (msg) => {
        throw new Error(`XML Error in ${partName}: ${msg}`)
      },
      fatalError: (msg) => {
        throw new Error(`XML Fatal Error in ${partName}: ${msg}`)
      },
    },
  }).parseFromString(xmlString, 'text/xml')
  expect(doc).toBeDefined()

  // 2. Cross-verify with xmllint CLI
  const proc = spawnSync('xmllint', ['--noout', '-'], {
    input: xmlString,
    encoding: 'utf-8',
  })
  if (proc.status !== 0) {
    throw new Error(`xmllint rejected ${partName}:\n${proc.stderr}`)
  }
}

describe('CHALLENGER STRESS SUITE: OpenXML Dynamic Array Serialization', () => {
  // ==========================================================================
  // 1. DYNAMIC ARRAY MARKER COVERAGE FOR ALL MODERN EXCEL FUNCTIONS
  // ==========================================================================
  it('1.1 verifies withFutureFunctionMarkers prefixes all 8 XLWS functions with _xlfn._xlws.', () => {
    const formulas = [
      { input: '=FILTER(A1:A10, B1:B10>0)', expected: '=_xlfn._xlws.FILTER(A1:A10, B1:B10>0)' },
      { input: '=RANDARRAY(5, 5)', expected: '=_xlfn._xlws.RANDARRAY(5, 5)' },
      { input: '=SEQUENCE(10)', expected: '=_xlfn._xlws.SEQUENCE(10)' },
      { input: '=SORT(A1:A10)', expected: '=_xlfn._xlws.SORT(A1:A10)' },
      { input: '=SORTBY(A1:A10, B1:B10)', expected: '=_xlfn._xlws.SORTBY(A1:A10, B1:B10)' },
      { input: '=UNIQUE(A1:A10)', expected: '=_xlfn._xlws.UNIQUE(A1:A10)' },
      { input: '=XLOOKUP(C1, A1:A10, B1:B10)', expected: '=_xlfn._xlws.XLOOKUP(C1, A1:A10, B1:B10)' },
      { input: '=XMATCH(C1, A1:A10)', expected: '=_xlfn._xlws.XMATCH(C1, A1:A10)' },
    ]

    for (const { input, expected } of formulas) {
      expect(withFutureFunctionMarkers(input)).toBe(expected)
    }
  })

  it('1.2 verifies nested dynamic arrays prefix every function without double-prefixing', () => {
    // Nested SORT(UNIQUE(FILTER(...)))
    const nested = '=SORT(UNIQUE(FILTER(A1:A10, B1:B10>0)))'
    const prefixed = withFutureFunctionMarkers(nested)
    expect(prefixed).toBe(
      '=_xlfn._xlws.SORT(_xlfn._xlws.UNIQUE(_xlfn._xlws.FILTER(A1:A10, B1:B10>0)))',
    )
    expect(prefixed).not.toContain('_xlfn._xlfn.')
    expect(prefixed).not.toContain('_xlws._xlws.')

    // Already marked formulas must be idempotent
    expect(withFutureFunctionMarkers(prefixed)).toBe(prefixed)
  })

  it('1.3 leaves string literals containing function names intact', () => {
    const formulaWithStrings = '="FILTER " & TEXTSPLIT(A1, ",") & " SORT " & UNIQUE(B1:B10)'
    const res = withFutureFunctionMarkers(formulaWithStrings)
    expect(res).toBe(
      '="FILTER " & _xlfn.TEXTSPLIT(A1, ",") & " SORT " & _xlfn._xlws.UNIQUE(B1:B10)',
    )
  })

  it('1.4 normalizes lowercase function names to canonical uppercase storage markers', () => {
    expect(withFutureFunctionMarkers('=filter(a1:a10, b1:b10>0)')).toBe(
      '=_xlfn._xlws.FILTER(a1:a10, b1:b10>0)',
    )
    expect(withFutureFunctionMarkers('=unique(a1:a10)')).toBe(
      '=_xlfn._xlws.UNIQUE(a1:a10)',
    )
    expect(withFutureFunctionMarkers('=sortby(a1:a10, b1:b10)')).toBe(
      '=_xlfn._xlws.SORTBY(a1:a10, b1:b10)',
    )
  })

  // ==========================================================================
  // 2. OPENXML PACKAGE METADATA & ZIP SERIALIZATION
  // ==========================================================================
  it('2.1 serializes multiple diverse dynamic arrays (FILTER, UNIQUE, QUERY) with cm="1" and valid metadata', async () => {
    const csv = 'Name,Dept,Salary\nAlice,Eng,100\nBob,HR,80\nCharlie,Eng,120'
    const source = await csvToXlsxBuffer(csv)

    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 4, // E1
        writeValue: true,
        cell: { value: null, formula: '=UNIQUE(B2:B4)' },
      },
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 6, // G1
        writeValue: true,
        cell: { value: null, formula: '=FILTER(A2:C4, C2:C4 > 90)' },
      },
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 10, // K1
        writeValue: true,
        cell: { value: null, formula: '=QUERY(A1:C4, "SELECT A, C WHERE C >= 100")' },
      },
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 13, // N1 - scalar formula!
        writeValue: true,
        cell: { value: null, formula: '=SUM(C2:C4)' },
      },
    ])

    const sheetXml = await getSheetXml(mutation.buffer)

    // E1: UNIQUE dynamic array
    expect(sheetXml).toContain('<c r="E1" cm="1">')
    expect(sheetXml).toContain('<f t="array" ref="E1">_xlfn._xlws.UNIQUE(B2:B4)</f>')

    // G1: FILTER dynamic array with XML escaping for >
    expect(sheetXml).toContain('<c r="G1" cm="1">')
    expect(sheetXml).toContain('<f t="array" ref="G1">_xlfn._xlws.FILTER(A2:C4, C2:C4 &gt; 90)</f>')

    // K1: QUERY dynamic array with XML escaping for >=
    expect(sheetXml).toContain('<c r="K1" cm="1">')
    expect(sheetXml).toContain(
      '<f t="array" ref="K1">QUERY(A1:C4, "SELECT A, C WHERE C &gt;= 100")</f>',
    )

    // N1: SUM scalar formula must NOT have cm="1" or t="array"
    expect(sheetXml).toContain('<c r="N1"><f>SUM(C2:C4)</f></c>')
    expect(sheetXml).not.toMatch(/<c\b[^>]*\br="N1"[^>]*\bcm=/)

    // Metadata XML verification
    expect(await hasMetadata(mutation.buffer)).toBe(true)
    const metaXml = await getMetadataXml(mutation.buffer)
    expect(metaXml).toContain('<metadataType name="XLDAPR" minSupportedVersion="120000"')
    expect(metaXml).toContain('<futureMetadata name="XLDAPR" count="1">')
    expect(metaXml).toContain('fDynamic="1"')
    expect(metaXml).toContain('<cellMetadata count="1"><bk><rc t="1" v="0"/></bk></cellMetadata>')

    // Relationships & Content Types
    const relsXml = await getWorkbookRelsXml(mutation.buffer)
    expect(relsXml).toContain('Target="metadata.xml"')
    const ctXml = await getContentTypesXml(mutation.buffer)
    expect(ctXml).toContain('PartName="/xl/metadata.xml"')
  })

  // ==========================================================================
  // 3. MULTI-ROUNDTRIP ACCUMULATION & IDEMPOTENCE
  // ==========================================================================
  it('3.1 preserves metadata across 3 consecutive saves without duplicating tags', async () => {
    const initialCsv = 'Col1,Col2\n10,20\n30,40'
    const buf0 = await csvToXlsxBuffer(initialCsv)

    // Save 1: Add =UNIQUE
    const mut1 = await applyCellEditsToXlsx(buf0, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 3, // D1
        writeValue: true,
        cell: { value: null, formula: '=UNIQUE(A1:A3)' },
      },
    ])

    // Save 2: Add =SORT onto buf1
    const mut2 = await applyCellEditsToXlsx(mut1.buffer, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 4, // E1
        writeValue: true,
        cell: { value: null, formula: '=SORT(B1:B3)' },
      },
    ])

    // Save 3: Add =QUERY onto buf2
    const mut3 = await applyCellEditsToXlsx(mut2.buffer, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 5, // F1
        writeValue: true,
        cell: { value: null, formula: '=QUERY(A1:B3, "SELECT Col1")' },
      },
    ])

    // Verify final worksheet has all 3 marked
    const finalSheetXml = await getSheetXml(mut3.buffer)
    expect(finalSheetXml).toContain('<c r="D1" cm="1">')
    expect(finalSheetXml).toContain('<c r="E1" cm="1">')
    expect(finalSheetXml).toContain('<c r="F1" cm="1">')

    // Verify metadata.xml contains exactly ONE <metadataTypes> and ONE <futureMetadata>
    const finalMetaXml = await getMetadataXml(mut3.buffer)
    const typeCount = (finalMetaXml.match(/<metadataTypes\b/g) || []).length
    const futureCount = (finalMetaXml.match(/<futureMetadata\b/g) || []).length
    expect(typeCount).toBe(1)
    expect(futureCount).toBe(1)

    // Verify Content_Types has exactly ONE metadata Override
    const finalCtXml = await getContentTypesXml(mut3.buffer)
    const ctCount = (finalCtXml.match(/PartName="\/xl\/metadata\.xml"/g) || []).length
    expect(ctCount).toBe(1)

    // Verify workbook.xml.rels has exactly ONE metadata Relationship
    const finalRelsXml = await getWorkbookRelsXml(mut3.buffer)
    const relCount = (finalRelsXml.match(/Target="metadata\.xml"/g) || []).length
    expect(relCount).toBe(1)
  })

  // ==========================================================================
  // 4. STRICT OPENXML & XML WELL-FORMEDNESS (XMLExcel REPAIR PROTECTION)
  // ==========================================================================
  it('4.1 verifies all XML package parts are 100% syntactically valid with xmllint', async () => {
    const csv = 'ID,Score\n1,95\n2,88\n3,92'
    const source = await csvToXlsxBuffer(csv)

    const mutation = await applyCellEditsToXlsx(source, [
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 3,
        writeValue: true,
        cell: { value: null, formula: '=SORT(UNIQUE(A2:B4))' },
      },
      {
        sheetName: 'Sheet1',
        row: 0,
        column: 5,
        writeValue: true,
        cell: { value: null, formula: '=QUERY(A1:B4, "SELECT ID WHERE Score > 90")' },
      },
    ])

    // Load ZIP and inspect every XML part
    const zip = await JSZip.loadAsync(mutation.buffer)
    const xmlEntries = Object.keys(zip.files).filter(
      (path) => path.endsWith('.xml') || path.endsWith('.rels'),
    )

    expect(xmlEntries.length).toBeGreaterThan(3)

    for (const partPath of xmlEntries) {
      const xmlContent = await zip.files[partPath]!.async('string')
      // Validate every single XML part with DOMParser and xmllint
      assertValidXml(xmlContent, partPath)
    }
  })
})
