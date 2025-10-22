export type MeasurementTypeUI =
  | 'PCS'
  | 'WEIGHT'
  | 'LENGTH'
  | 'VOLUME'
  | 'AREA';

function trimZeros(n: number, frac: number = 2) {
  const s = n.toFixed(frac);
  return s.replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/g, '');
}

export function formatQuantity(
  q: number | null | undefined,
  mt?: MeasurementTypeUI,
  unit?: string | null,
  opts?: { pcs?: string; min?: string },
): string {
  const qty = Math.max(0, Math.floor(Number(q || 0)));
  switch (mt) {
    case 'WEIGHT': {
      // qty is stored in grams; show kg when >= 1000g
      if (qty >= 1000) return `${trimZeros(qty / 1000, 2)} kg`;
      return `${qty} g`;
    }
    case 'LENGTH': {
      // qty is stored in centimeters; show m when >= 100cm
      if (qty >= 100) return `${trimZeros(qty / 100, 2)} m`;
      return `${qty} cm`;
    }
    case 'VOLUME': {
      // qty is stored in milliliters; show l when >= 1000ml
      if (qty >= 1000) return `${trimZeros(qty / 1000, 2)} l`;
      return `${qty} ml`;
    }
    case 'AREA': {
      // qty is stored in square centimeters; show m² when >= 10000cm²
      if (qty >= 10000) return `${trimZeros(qty / 10000, 2)} m²`;
      return `${qty} cm²`;
    }
    case 'PCS':
    default:
      return `${qty} ${unit || opts?.pcs || 'pcs'}`;
  }
}
