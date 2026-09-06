const PALETTE = [
  "oklch(0.72 0.16 322)",
  "oklch(0.70 0.13 250)",
  "oklch(0.76 0.14 155)",
  "oklch(0.78 0.14 75)",
  "oklch(0.71 0.16 25)",
  "oklch(0.68 0.12 200)",
  "oklch(0.73 0.14 280)",
  "oklch(0.69 0.15 350)",
  "oklch(0.74 0.12 120)",
  "oklch(0.67 0.14 40)",
] as const;

export function colorForCategory(id: number): string {
  return PALETTE[Math.abs(id) % PALETTE.length];
}
