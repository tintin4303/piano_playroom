// Monetary calculations strictly in satang (1 THB = 100 satang)
export function satangToTHB(satang: number): number {
  return satang / 100;
}

export function thbToSatang(thb: number): number {
  return Math.round(thb * 100);
}

export function formatTHB(satang: number): string {
  return `฿${(satang / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
