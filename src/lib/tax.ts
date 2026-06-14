/**
 * Vereinfachter deutscher Einkommensteuer-Tarif für die Steuersicht.
 * Basis: Tarif 2025/2026 (Grundtabelle, Single). Liefert Steuerbetrag.
 * — KEINE rechtsverbindliche Berechnung — nur Schätzung fürs Dashboard.
 */
export function germanIncomeTax(zvE: number): number {
  if (zvE <= 0) return 0;
  // Grundfreibetrag 2026 (Annahme ~12.000 €)
  if (zvE <= 12096) return 0;
  if (zvE <= 17443) {
    const y = (zvE - 12096) / 10000;
    return Math.round((932.3 * y + 1400) * y);
  }
  if (zvE <= 68480) {
    const z = (zvE - 17443) / 10000;
    return Math.round((176.64 * z + 2397) * z + 1015.13);
  }
  if (zvE <= 277825) {
    return Math.round(0.42 * zvE - 10911.92);
  }
  return Math.round(0.45 * zvE - 19246.67);
}

/**
 * Solidaritätszuschlag (vereinfacht: 5.5% auf ESt, mit Freigrenze).
 */
export function soli(est: number): number {
  // 2026: Freigrenze etwa 19.950 € (Single). Über 'Milderungszone' vereinfacht weggelassen.
  if (est <= 19950) return 0;
  return Math.round(est * 0.055);
}
