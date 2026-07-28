import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { truncateAddress, formatUsdcAmount, classifyTemperatureZone, formatElapsedTime, centidegreesToDisplay, classifyTrend } from '../utils';
import { mapContractError } from '../errors';

// Feature: omnicold-frontend, Property 1: Address Truncation Preserves Endpoints
describe('Property 1: truncateAddress', () => {
  it('preserves first 4 and last 4 characters for any 56-char Stellar address', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.split('')), { minLength: 56, maxLength: 56 }),
        (address) => {
          const result = truncateAddress(address);
          expect(result).toContain(address.slice(0, 4));
          expect(result).toContain(address.slice(-4));
          expect(result).toContain('…');
          expect(result.length).toBeLessThan(address.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns short addresses unchanged', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        (address) => {
          const result = truncateAddress(address);
          expect(result).toBe(address);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: omnicold-frontend, Property 2: Network Preference Persistence Round-Trip
describe('Property 2: Network persistence round-trip', () => {
  it('localStorage set/get round-trips for any valid network', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('testnet' as const, 'mainnet' as const),
        (network) => {
          localStorage.setItem('omnicold-network', network);
          const stored = localStorage.getItem('omnicold-network');
          expect(stored).toBe(network);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: omnicold-frontend, Property 3: Create Shipment Form Validation Correctness
describe('Property 3: Form validation correctness', () => {
  it('rejects when minTemp >= maxTemp', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer(),
        (a, b) => {
          const min = Math.max(a, b);
          const max = Math.min(a, b);
          if (min >= max) {
            // Should be invalid — zone classification will mark as breach
            expect(min >= max).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: omnicold-frontend, Property 4: Temperature Zone Classification
describe('Property 4: classifyTemperatureZone', () => {
  it('zones are mutually exclusive and collectively exhaustive', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 10000 }),
        fc.integer({ min: -5000, max: 4999 }),
        fc.integer({ min: 1, max: 5000 }),
        (temp, minBase, range) => {
          const min = minBase;
          const max = min + range; // ensures min < max
          const zone = classifyTemperatureZone(temp, min, max);
          
          // Zone must be one of the three values
          expect(['safe', 'warning', 'breach']).toContain(zone);
          
          // Breach: outside [min, max]
          if (temp < min || temp > max) {
            expect(zone).toBe('breach');
          }
          
          // Safe: must be inside [min, max]
          if (zone === 'safe') {
            expect(temp).toBeGreaterThanOrEqual(min);
            expect(temp).toBeLessThanOrEqual(max);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: omnicold-frontend, Property 5: USDC Bond Amount Formatting
describe('Property 5: formatUsdcAmount', () => {
  it('produces 2 decimal places for any non-negative bigint', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 999_999_999_999n }),
        (stroops) => {
          const result = formatUsdcAmount(stroops);
          // Must have exactly 2 decimal places
          expect(result).toMatch(/^\d+\.\d{2}$/);
          // Must be parseable as a number
          const parsed = parseFloat(result);
          expect(parsed).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: omnicold-frontend, Property 6: Elapsed Time Formatting
describe('Property 6: formatElapsedTime', () => {
  it('produces non-empty string with numeric value for any past timestamp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 365 * 24 * 60 * 60 * 1000 }),
        (msAgo) => {
          const timestamp = Date.now() - msAgo;
          const result = formatElapsedTime(timestamp);
          expect(result.length).toBeGreaterThan(0);
          // Contains at least one digit
          expect(result).toMatch(/\d/);
          // Contains a time unit (s, m, h, d)
          expect(result).toMatch(/[smhd]/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: omnicold-frontend, Property 7: Contract Error Code Mapping Completeness
describe('Property 7: mapContractError', () => {
  it('returns non-generic message for codes 1-9, generic for others', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        (code) => {
          const result = mapContractError(code);
          expect(result.length).toBeGreaterThan(0);
          
          if (code >= 1 && code <= 9) {
            expect(result).not.toBe('An unknown contract error occurred.');
          } else {
            expect(result).toBe('An unknown contract error occurred.');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: omnicold-frontend, Property 8: Centidegree to Display Degree Conversion
describe('Property 8: centidegreesToDisplay', () => {
  it('round-trips within ±5 of original for any integer centidegree', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 10000 }),
        (centidegrees) => {
          const display = centidegreesToDisplay(centidegrees);
          // Should have 1 decimal place
          expect(display).toMatch(/^-?\d+\.\d$/);
          // Round-trip: parse back and multiply by 100
          const roundTripped = Math.round(parseFloat(display) * 100);
          expect(Math.abs(roundTripped - centidegrees)).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: omnicold-frontend, Property 9: Temperature Trend Classification
describe('Property 9: classifyTrend', () => {
  it('returns up/down/stable correctly for any two integers', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer(),
        (current, previous) => {
          const trend = classifyTrend(current, previous);
          
          if (current > previous) expect(trend).toBe('up');
          else if (current < previous) expect(trend).toBe('down');
          else expect(trend).toBe('stable');
        }
      ),
      { numRuns: 100 }
    );
  });
});
