'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { TemperatureZone } from '@/lib/types';
import { centidegreesToDisplay, classifyTemperatureZone, classifyTrend } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@/components/icons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TemperatureGaugeProps {
  /** Current temperature in centidegrees */
  currentTemp: number;
  /** Previous temperature for trend arrow (centidegrees) */
  previousTemp?: number;
  /** Minimum safe threshold in centidegrees */
  minThreshold: number;
  /** Maximum safe threshold in centidegrees */
  maxThreshold: number;
}

// ─── Geometry constants ───────────────────────────────────────────────────────

const RADIUS   = 80;
const CX       = 110;
const CY       = 110;
const SVG_SIZE = 220;

/**
 * The gauge spans 270°.
 * Open gap is at the bottom: the arc runs from 135° to 45° (going clockwise
 * through 270° of travel). In SVG convention (0° = right, clockwise):
 *   Start angle = 135°  (bottom-left)
 *   End   angle = 45°   (bottom-right, after 270° clockwise travel)
 */
const START_ANGLE_DEG = 135;
const TOTAL_SWEEP_DEG = 270;

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convert an angle in degrees to an (x, y) point on the arc circle. */
function polarToXY(angleDeg: number, r: number = RADIUS): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  };
}

/**
 * Map a temperature value onto the gauge sweep (0–270°) relative to a range
 * that extends ±20% beyond the thresholds for visual context.
 */
function tempToAngleDeg(
  temp: number,
  rangeMin: number,
  rangeMax: number
): number {
  const frac = Math.max(0, Math.min(1, (temp - rangeMin) / (rangeMax - rangeMin)));
  return START_ANGLE_DEG + frac * TOTAL_SWEEP_DEG;
}

/**
 * Build an SVG arc path string for a segment from startAngle to endAngle (degrees).
 * Both angles measured from SVG 0° (right), clockwise.
 */
function arcPath(startDeg: number, endDeg: number, r: number = RADIUS): string {
  const start = polarToXY(startDeg, r);
  const end   = polarToXY(endDeg,   r);
  const sweep = endDeg - startDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// ─── Zone color map ───────────────────────────────────────────────────────────

const ZONE_COLORS: Record<TemperatureZone, string> = {
  safe:    '#2EC4B6',
  warning: '#FF9F1C',
  breach:  '#E63946',
};

const ZONE_GLOW: Record<TemperatureZone, string> = {
  safe:    'rgba(46,196,182,0.35)',
  warning: 'rgba(255,159,28,0.45)',
  breach:  'rgba(230,57,70,0.5)',
};

// ─── Trend arrow ──────────────────────────────────────────────────────────────

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')     return <span aria-label="Temperature rising"><ArrowUpIcon size={22} className="text-status-breach" /></span>;
  if (trend === 'down')   return <span aria-label="Temperature falling"><ArrowDownIcon size={22} className="text-status-safe" /></span>;
  return                         <span aria-label="Temperature stable"><MinusIcon size={22} className="text-frost-gray" /></span>;
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * TemperatureGauge — 270° radial SVG gauge.
 *
 * Three color zones painted as arc segments:
 *   - Breach Red  : outer extremes (below min or above max)
 *   - Warning Amber: within 10% buffer of either threshold
 *   - Mint Green  : safe interior
 *
 * Center: large °C value + trend arrow
 * Threshold tick marks with numeric labels
 * Frost-blue needle with Framer Motion spring physics
 * Zone-reactive glow: Safe=Mint, Warning=pulsing Amber, Breach=flashing Red
 */
export function TemperatureGauge({
  currentTemp,
  previousTemp,
  minThreshold,
  maxThreshold,
}: TemperatureGaugeProps) {
  const prefersReduced = useReducedMotion();

  const zone = classifyTemperatureZone(currentTemp, minThreshold, maxThreshold);
  const trend = previousTemp !== undefined
    ? classifyTrend(currentTemp, previousTemp)
    : 'stable';

  const zoneColor = ZONE_COLORS[zone];
  const zoneGlow  = ZONE_GLOW[zone];

  // Extend the display range 20% beyond thresholds for visual context
  const thresholdSpan = maxThreshold - minThreshold;
  const padding       = Math.max(1, Math.round(thresholdSpan * 0.2));
  const rangeMin      = minThreshold - padding;
  const rangeMax      = maxThreshold + padding;

  // ── Arc segment boundaries ────────────────────────────────────────────────
  const minAngle = tempToAngleDeg(minThreshold, rangeMin, rangeMax);
  const maxAngle = tempToAngleDeg(maxThreshold, rangeMin, rangeMax);
  const endAngle = START_ANGLE_DEG + TOTAL_SWEEP_DEG; // = 405°

  // Warning buffer (10% of threshold range)
  const warningBuffer = Math.max(1, Math.floor(thresholdSpan * 0.1));
  const minWarnAngle  = tempToAngleDeg(minThreshold + warningBuffer, rangeMin, rangeMax);
  const maxWarnAngle  = tempToAngleDeg(maxThreshold - warningBuffer, rangeMin, rangeMax);

  // ── Needle angle ──────────────────────────────────────────────────────────
  const needleAngleDeg = useMemo(
    () => tempToAngleDeg(currentTemp, rangeMin, rangeMax),
    [currentTemp, rangeMin, rangeMax]
  );

  // Needle tip and tail positions (line from CX,CY toward arc)
  const needleTip  = polarToXY(needleAngleDeg, RADIUS - 6);
  const needleTail = polarToXY(needleAngleDeg + 180, 14);

  // Tick mark positions for min and max thresholds
  const minTick = polarToXY(minAngle, RADIUS + 10);
  const maxTick = polarToXY(maxAngle, RADIUS + 10);
  const minTickInner = polarToXY(minAngle, RADIUS - 4);
  const maxTickInner = polarToXY(maxAngle, RADIUS - 4);

  // ── Glow animation for warning/breach ────────────────────────────────────
  const glowAnimation = useMemo(() => {
    if (prefersReduced) return {};
    if (zone === 'warning') {
      return {
        animate: { boxShadow: [`0 0 12px ${zoneGlow}`, `0 0 28px ${zoneGlow}`, `0 0 12px ${zoneGlow}`] },
        transition: { duration: 1.0, repeat: Infinity, ease: 'easeInOut' },
      };
    }
    if (zone === 'breach') {
      return {
        animate: { boxShadow: [`0 0 16px ${zoneGlow}`, `0 0 36px ${zoneGlow}`, `0 0 8px ${zoneGlow}`] },
        transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
      };
    }
    return {
      animate: { boxShadow: `0 0 20px ${zoneGlow}` },
      transition: {},
    };
  }, [zone, zoneGlow, prefersReduced]);

  const trackStrokeWidth  = 14;
  const trackR            = RADIUS;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Outer glow wrapper */}
      <motion.div
        className="rounded-full p-1"
        {...glowAnimation}
        aria-label={`Temperature gauge — ${centidegreesToDisplay(currentTemp)}°C, zone: ${zone}`}
      >
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          aria-hidden="true"
          role="img"
          className="overflow-visible"
        >
          {/* ── Gradient defs ─────────────────────────────────────────── */}
          <defs>
            {/* Radial glow behind needle center */}
            <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={zoneColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={zoneColor} stopOpacity="0"    />
            </radialGradient>
          </defs>

          {/* ── Track background (full 270° arc, dark) ─────────────────── */}
          <path
            d={arcPath(START_ANGLE_DEG, endAngle, trackR)}
            fill="none"
            stroke="#1E293B"
            strokeWidth={trackStrokeWidth}
            strokeLinecap="round"
          />

          {/* ── Zone arcs ─────────────────────────────────────────────── */}

          {/* Breach zone — low extreme (START → minAngle) */}
          {minAngle > START_ANGLE_DEG && (
            <path
              d={arcPath(START_ANGLE_DEG, minAngle, trackR)}
              fill="none"
              stroke="#E63946"
              strokeWidth={trackStrokeWidth}
              strokeLinecap="butt"
              opacity={0.85}
            />
          )}

          {/* Warning zone — low buffer (minAngle → minWarnAngle) */}
          {minWarnAngle > minAngle && (
            <path
              d={arcPath(minAngle, minWarnAngle, trackR)}
              fill="none"
              stroke="#FF9F1C"
              strokeWidth={trackStrokeWidth}
              strokeLinecap="butt"
              opacity={0.9}
            />
          )}

          {/* Safe zone — center */}
          {maxWarnAngle > minWarnAngle && (
            <path
              d={arcPath(minWarnAngle, maxWarnAngle, trackR)}
              fill="none"
              stroke="#2EC4B6"
              strokeWidth={trackStrokeWidth}
              strokeLinecap="butt"
              opacity={0.9}
            />
          )}

          {/* Warning zone — high buffer (maxWarnAngle → maxAngle) */}
          {maxAngle > maxWarnAngle && (
            <path
              d={arcPath(maxWarnAngle, maxAngle, trackR)}
              fill="none"
              stroke="#FF9F1C"
              strokeWidth={trackStrokeWidth}
              strokeLinecap="butt"
              opacity={0.9}
            />
          )}

          {/* Breach zone — high extreme (maxAngle → endAngle) */}
          {endAngle > maxAngle && (
            <path
              d={arcPath(maxAngle, endAngle, trackR)}
              fill="none"
              stroke="#E63946"
              strokeWidth={trackStrokeWidth}
              strokeLinecap="butt"
              opacity={0.85}
            />
          )}

          {/* ── Threshold tick marks ────────────────────────────────────── */}
          {/* Min threshold tick */}
          <line
            x1={minTickInner.x} y1={minTickInner.y}
            x2={minTick.x}      y2={minTick.y}
            stroke="#FF9F1C"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Max threshold tick */}
          <line
            x1={maxTickInner.x} y1={maxTickInner.y}
            x2={maxTick.x}      y2={maxTick.y}
            stroke="#FF9F1C"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* ── Threshold labels ─────────────────────────────────────────── */}
          <ThresholdLabel
            angleDeg={minAngle}
            value={centidegreesToDisplay(minThreshold)}
            r={RADIUS + 22}
          />
          <ThresholdLabel
            angleDeg={maxAngle}
            value={centidegreesToDisplay(maxThreshold)}
            r={RADIUS + 22}
          />

          {/* ── Center glow circle ───────────────────────────────────────── */}
          <circle cx={CX} cy={CY} r={30} fill="url(#center-glow)" />

          {/* ── Needle ───────────────────────────────────────────────────── */}
          <motion.line
            x1={needleTail.x}
            y1={needleTail.y}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="#00D4FF"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ originX: `${CX}px`, originY: `${CY}px` }}
            animate={
              prefersReduced
                ? {}
                : {
                    x1: needleTail.x,
                    y1: needleTail.y,
                    x2: needleTip.x,
                    y2: needleTip.y,
                  }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 100, damping: 15 }
            }
          />

          {/* Needle hub */}
          <circle cx={CX} cy={CY} r={6} fill="#00D4FF" />
          <circle cx={CX} cy={CY} r={3} fill="#0F1923" />
        </svg>
      </motion.div>

      {/* ── Center readout (outside SVG for crisp text rendering) ─────────── */}
      <div className="flex flex-col items-center gap-1 -mt-16 relative z-10 pointer-events-none">
        {/* Large temperature value */}
        <span
          className="text-4xl font-bold tabular-nums"
          style={{ color: zoneColor }}
          aria-live="polite"
          aria-atomic="true"
        >
          {centidegreesToDisplay(currentTemp)}°C
        </span>

        {/* Trend arrow */}
        <TrendArrow trend={trend} />
      </div>

      {/* ── Zone label ────────────────────────────────────────────────────── */}
      <span
        className="text-xs font-semibold uppercase tracking-widest mt-1"
        style={{ color: zoneColor }}
        aria-label={`Status: ${zone}`}
      >
        {zone}
      </span>
    </div>
  );
}

// ─── Threshold label sub-component ───────────────────────────────────────────

interface ThresholdLabelProps {
  angleDeg: number;
  value: string;
  r: number;
}

function ThresholdLabel({ angleDeg, value, r }: ThresholdLabelProps) {
  const pos = polarToXY(angleDeg, r);
  return (
    <text
      x={pos.x}
      y={pos.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="10"
      fill="#FF9F1C"
      fontFamily="monospace"
    >
      {value}
    </text>
  );
}

export default TemperatureGauge;
