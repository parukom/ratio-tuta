export type MeasurementTypeUI =
  | 'PCS'
  | 'WEIGHT'
  | 'LENGTH'
  | 'VOLUME'
  | 'AREA'
  | 'TIME';

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
    case 'LENGTH':
      return `${qty} m`;
    case 'VOLUME':
      return `${qty} l`;
    case 'AREA':
      return `${qty} m2`;
    case 'TIME': {
      // qty assumed stored as hours; display minutes
      const minutes = qty * 60;
      return `${minutes} ${opts?.min || 'min'}`;
    }
    case 'PCS':
    default:
      return `${qty} ${unit || opts?.pcs || 'pcs'}`;
  }
}
