/**
 * Statistical Anomaly Detection Engine for sAI Studio in sOffice Sheets.
 * Uses dual-criteria IQR (Interquartile Range) and Z-Score outlier detection.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface OutlierItem {
  index: number;
  value: number;
  zScore: number;
  severity: 'red' | 'amber';
  reason: string;
}

export interface AnomalyDetectionResult {
  mean?: number;
  stdDev?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  lowerFence?: number;
  upperFence?: number;
  numericCount: number;
  sampleSize?: number;
  note?: string;
  outliers: OutlierItem[];
}

export const AnomalyDetector = {
  detect(values: readonly unknown[]): AnomalyDetectionResult {
    const nums: number[] = [];
    for (const v of values) {
      if (typeof v === 'number' && !isNaN(v) && isFinite(v)) {
        nums.push(v);
      }
    }
    nums.sort((a, b) => a - b);

    if (nums.length < 4) {
      return {
        note: 'Insufficient data for IQR',
        sampleSize: nums.length,
        numericCount: nums.length,
        outliers: [],
      };
    }

    const n = nums.length;
    const q1 = nums[Math.floor(n * 0.25)]!;
    const q3 = nums[Math.floor(n * 0.75)]!;
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const mean = nums.reduce((a, b) => a + b, 0) / n;
    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const outliers: OutlierItem[] = [];
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) continue;

      const zScore = stdDev === 0 ? 0 : (val - mean) / stdDev;
      const absZ = Math.abs(zScore);

      if (val < lowerFence || val > upperFence || absZ >= 2.0) {
        const isExtreme = absZ >= 3.0 || val > q3 + 3.0 * iqr || val < q1 - 3.0 * iqr;
        const severity: 'red' | 'amber' = isExtreme ? 'red' : 'amber';
        outliers.push({
          index: i,
          value: val,
          zScore,
          severity,
          reason: `Value ${val} deviates with Z-Score ${zScore.toFixed(2)} (IQR fence: [${lowerFence}, ${upperFence}])`,
        });
      }
    }

    return {
      mean,
      stdDev,
      q1,
      q3,
      iqr,
      lowerFence,
      upperFence,
      numericCount: nums.length,
      outliers,
    };
  },
};