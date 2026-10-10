// CSS optimizers may serialize the same token as either milliseconds or seconds.
// Web Animations always expects milliseconds.
export function cssTimeToMilliseconds(value: string): number {
  const match = value.trim().match(/^([\d.]+)(ms|s)$/);
  if (!match) return Number.NaN;
  const amount = Number(match[1]);
  return match[2] === 's' ? amount * 1000 : amount;
}
