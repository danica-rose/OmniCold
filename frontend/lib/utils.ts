import { TemperatureZone } from './types';

/**
 * Truncates a Stellar address to first 4 + "…" + last 4 characters.
 * Example: "GABCDEFGHIJKLMNOP..." → "GABC…MNOP"
 */
export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * Formats a USDC amount from stroops (bigint) to a display string with 2 decimal places.
 * 1 USDC = 10_000_000 stroops (7 decimal places on Stellar).
 */
export function formatUsdcAmount(stroops: bigint): string {
  const divisor = 10_000_000n;
  const whole = stroops / divisor;
  const remainder = stroops % divisor;
  const decimal = Number(remainder) / 10_000_000;
  const formatted = (Number(whole) + decimal).toFixed(2);
  return formatted;
}

/**
 * Classifies a temperature reading into a zone based on thresholds.
 * - 'breach': outside [min, max]
 * - 'warning': within 10% of a threshold boundary but still inside
 * - 'safe': comfortably within thresholds
 */
export function classifyTemperatureZone(
  temp: number,
  min: number,
  max: number
): TemperatureZone {
  if (temp < min || temp > max) return 'breach';

  const range = max - min;
  const warningBuffer = Math.max(1, Math.floor(range * 0.1));

  if (temp < min + warningBuffer || temp > max - warningBuffer) return 'warning';

  return 'safe';
}

/**
 * Formats elapsed time since a timestamp in human-readable format.
 * Example: "2h 34m", "5d 12h", "45s"
 */
export function formatElapsedTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;

  const diffHrs = Math.floor(diffMin / 60);
  const remainMin = diffMin % 60;
  if (diffHrs < 24) return `${diffHrs}h ${remainMin}m`;

  const diffDays = Math.floor(diffHrs / 24);
  const remainHrs = diffHrs % 24;
  return `${diffDays}d ${remainHrs}h`;
}

/**
 * Converts centidegrees (integer) to a display string in degrees Celsius with 1 decimal place.
 * Example: 250 → "2.5", -150 → "-1.5"
 */
export function centidegreesToDisplay(centidegrees: number): string {
  return (centidegrees / 100).toFixed(1);
}

/**
 * Classifies the temperature trend based on current vs previous reading.
 */
export function classifyTrend(
  current: number,
  previous: number
): 'up' | 'down' | 'stable' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}
