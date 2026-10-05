/**
 * In-Cell Sparkline Formula Engine for sOffice Sheets.
 * Implements =SPARKLINE(data, [options]) generating in-cell SVG vector graphics.
 * Supports chart types: 'line', 'column', 'winloss' (bar).
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

import {
  ArrayValueObject,
  BaseFunction,
  BaseValueObject,
  ErrorType,
  ErrorValueObject,
  FunctionType,
  IFunctionService,
  StringValueObject,
} from '@univerjs/engine-formula';
import type { UniverRuntime } from '../univer-state';

export interface SparklineOptions {
  charttype?: 'line' | 'column' | 'winloss' | 'bar' | undefined;
  color?: string | undefined;
  linewidth?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

export const SparklineEngine = {
  generateSvg(values: readonly unknown[], options: SparklineOptions = {}): string {
    if (!values || values.length === 0) return '<svg width="0" height="0"></svg>';

    const nums: number[] = [];
    for (const v of values) {
      if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
        nums.push(v);
      }
    }

    if (nums.length === 0) return '<svg width="0" height="0"></svg>';

    const w = Math.max(10, options.width ?? 120);
    const h = Math.max(8, options.height ?? 24);
    const color = options.color ?? '#107c41';
    const charttype = options.charttype ?? 'line';

    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max === min ? 1 : max - min;

    if (charttype === 'column') {
      const barW = Math.max(1, Math.floor(w / nums.length) - 2);
      const rects = nums.map((v, i) => {
        const barH = ((v - min) / range) * (h - 4) + 2;
        const x = i * (barW + 2);
        const y = h - barH;
        return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" />`;
      });
      return `<svg width="${w}" height="${h}">${rects.join('')}</svg>`;
    }

    if (charttype === 'winloss' || charttype === 'bar') {
      const barW = Math.max(1, Math.floor(w / nums.length) - 2);
      const rects = nums.map((v, i) => {
        const x = i * (barW + 2);
        const isPos = v >= 0;
        const y = isPos ? 2 : h / 2;
        const barH = Math.max(1, h / 2 - 2);
        const fill = isPos ? '#107c41' : '#d83b01';
        return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${fill}" />`;
      });
      return `<svg width="${w}" height="${h}">${rects.join('')}</svg>`;
    }

    // Default: line
    const step = w / Math.max(1, nums.length - 1);
    const points = nums.map((v, i) => {
      const x = i * step;
      const y = max === min ? h / 2 : h - (((v - min) / range) * (h - 6) + 3);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const lw = options.linewidth ?? 2;
    return `<svg width="${w}" height="${h}"><path d="M ${points.join(' L ')}" fill="none" stroke="${color}" stroke-width="${lw}" /></svg>`;
  },
};

/**
 * Parses options from an ArrayValueObject or string/object representation.
 * Supports Google Sheets syntax: {"charttype", "column"; "color", "#ff0000"}
 */
export function parseSparklineOptions(rawOptions?: BaseValueObject): SparklineOptions {
  const opts: SparklineOptions = {
    charttype: 'line',
    color: '#107c41',
    linewidth: 2,
    width: 120,
    height: 24,
  };

  if (!rawOptions || rawOptions.isNull()) return opts;

  if (rawOptions.isArray?.()) {
    const matrix = (rawOptions as ArrayValueObject).getArrayValue();
    for (const row of matrix) {
      if (!row || row.length < 2) continue;
      const key = String(row[0]?.getValue() || '').trim().toLowerCase();
      const val = row[1]?.getValue();
      if (!key) continue;

      if (key === 'charttype') {
        const str = String(val).toLowerCase();
        if (str === 'column' || str === 'line' || str === 'winloss' || str === 'bar') {
          opts.charttype = str;
        }
      } else if (key === 'color') {
        opts.color = String(val);
      } else if (key === 'linewidth') {
        opts.linewidth = Number(val) || 2;
      } else if (key === 'width') {
        opts.width = Number(val) || 120;
      } else if (key === 'height') {
        opts.height = Number(val) || 24;
      }
    }
  }

  return opts;
}

export class SparklineFunction extends BaseFunction {
  override needsReferenceObject = true;
  override minParams = 1;
  override maxParams = 2;

  override calculate(rawData: BaseValueObject, rawOptions?: BaseValueObject): BaseValueObject {
    if (!rawData || rawData.isError()) return rawData ?? ErrorValueObject.create(ErrorType.VALUE);
    if (rawOptions?.isError()) return rawOptions;

    let values: unknown[] = [];
    if (rawData.isArray?.()) {
      const matrix = (rawData as ArrayValueObject).getArrayValue();
      values = matrix.flat().map((c) => (c ? c.getValue() : null));
    } else if (rawData.isReferenceObject?.()) {
      const ref = rawData as unknown as { toArrayValueObject?(): ArrayValueObject };
      if (ref.toArrayValueObject) {
        values = ref.toArrayValueObject().getArrayValue().flat().map((c) => (c ? c.getValue() : null));
      } else {
        values = [rawData.getValue()];
      }
    } else {
      values = [rawData.getValue()];
    }

    const options = parseSparklineOptions(rawOptions);
    const svg = SparklineEngine.generateSvg(values, options);
    return StringValueObject.create(svg);
  }
}

export function installSparklineFunction(runtime: UniverRuntime): { dispose(): void } {
  const functionService = runtime.univer.__getInjector().get(IFunctionService);
  const name = 'SPARKLINE';
  const executor = new SparklineFunction(name);

  functionService.registerExecutors(executor);

  const descDisposable = functionService.registerDescriptions({
    functionName: name,
    functionType: FunctionType.Lookup,
    description: 'Generates a miniature in-cell SVG sparkline chart given a data range and display options.',
    abstract: 'Generates a mini in-cell chart.',
    functionParameter: [
      { name: 'data', detail: 'The range or array containing the data to plot.', example: 'A1:F1', require: 1, repeat: 0 },
      { name: 'options', detail: 'Optional settings (charttype, color, linewidth).', example: '{"charttype", "column"}', require: 0, repeat: 0 },
    ],
  });

  return {
    dispose() {
      descDisposable.dispose();
      functionService.unregisterExecutors(name);
    },
  };
}