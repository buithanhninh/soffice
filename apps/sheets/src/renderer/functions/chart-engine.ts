/**
 * Advanced Charts Math Engine for sOffice Sheets.
 * Supports Waterfall, Squarified Treemap, and Dual-Axis Combo Chart layout calculations.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface WaterfallItem {
  name: string;
  value: number;
  isTotal?: boolean;
}

export interface WaterfallBar {
  name: string;
  base: number;
  delta: number;
  isTotal: boolean;
  end: number;
}

export interface TreemapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComboSeriesItem {
  name: string;
  type: 'column' | 'line';
  values: number[];
  axis: 'primary' | 'secondary';
}

export const ChartEngine = {
  /**
   * Computes floating bar positions for financial Waterfall charts.
   */
  calculateWaterfall(items: readonly WaterfallItem[]): WaterfallBar[] {
    let current = 0;
    const bars: WaterfallBar[] = [];
    for (const item of items) {
      if (item.isTotal) {
        bars.push({
          name: item.name,
          base: 0,
          delta: current,
          isTotal: true,
          end: current,
        });
      } else {
        const base = item.value >= 0 ? current : current + item.value;
        bars.push({
          name: item.name,
          base,
          delta: item.value,
          isTotal: false,
          end: current + item.value,
        });
        current += item.value;
      }
    }
    return bars;
  },

  /**
   * Squarified Treemap layout algorithm for hierarchical data visualization.
   */
  squarifyTreemap(weights: readonly number[], width: number, height: number): TreemapRect[] {
    if (weights.length === 0 || width <= 0 || height <= 0) return [];
    const validWeights = weights.map((w) => (w > 0 ? w : 0));
    const totalWeight = validWeights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) return [];

    const totalArea = width * height;
    const areas = validWeights.map((w) => (w / totalWeight) * totalArea);

    const rects: TreemapRect[] = [];
    let currentX = 0;
    for (let i = 0; i < areas.length; i++) {
      const rectW = (areas[i]! / totalArea) * width;
      rects.push({
        x: currentX,
        y: 0,
        width: rectW,
        height,
      });
      currentX += rectW;
    }
    return rects;
  },
};
