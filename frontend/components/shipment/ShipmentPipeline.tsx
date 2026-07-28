'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ShipmentStatus } from '@/lib/types';
import { formatElapsedTime } from '@/lib/utils';
import { SnowflakeIcon, ThermometerIcon, CheckCircleIcon, AlertTriangleIcon } from '@/components/icons';
import type { IconProps } from '@/components/icons';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShipmentPipelineProps {
  currentState: ShipmentStatus;
  lastTransitionTimestamp?: number;
  animated?: boolean;
}

// ─── Node definitions ────────────────────────────────────────────────────────

interface PipelineNode {
  id: ShipmentStatus;
  Icon: React.ComponentType<IconProps>;
  label: string;
  subLabel: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  { id: 'Created',   Icon: SnowflakeIcon,      label: 'Created',   subLabel: 'Awaiting Bond' },
  { id: 'Active',    Icon: ThermometerIcon,     label: 'Active',    subLabel: 'In Transit'   },
  { id: 'Delivered', Icon: CheckCircleIcon,     label: 'Delivered', subLabel: 'Delivered'    },
  { id: 'Breached',  Icon: AlertTriangleIcon,   label: 'Breached',  subLabel: 'Breached'     },
];

// State order used to determine "past" nodes
const STATE_ORDER: ShipmentStatus[] = ['Created', 'Active', 'Delivered', 'Breached'];

// ─── Color helpers ────────────────────────────────────────────────────────────

function nodeColor(
  nodeId: ShipmentStatus,
  currentState: ShipmentStatus
): {
  fill: string;
  ring: string;
  text: string;
  glow: string;
} {
  const currentIdx = STATE_ORDER.indexOf(currentState);
  const nodeIdx    = STATE_ORDER.indexOf(nodeId);

  // Current node
  if (nodeId === currentState) {
    if (nodeId === 'Delivered') {
      return { fill: '#2EC4B6', ring: '#2EC4B6', text: '#0F1923', glow: 'rgba(46,196,182,0.45)' };
    }
    if (nodeId === 'Breached') {
      return { fill: '#E63946', ring: '#E63946', text: '#F1FAEE', glow: 'rgba(230,57,70,0.45)' };
    }
    // Created or Active
    return { fill: '#00D4FF', ring: '#00D4FF', text: '#0F1923', glow: 'rgba(0,212,255,0.45)' };
  }

  // Past node (before current)
  if (nodeIdx < currentIdx) {
    if (currentState === 'Delivered') {
      return { fill: '#2EC4B6', ring: 'transparent', text: '#0F1923', glow: '' };
    }
    return { fill: '#00D4FF', ring: 'transparent', text: '#0F1923', glow: '' };
  }

  // Future node (after current)
  return { fill: '#1E293B', ring: '#94A3B8', text: '#94A3B8', glow: '' };
}

function connectorStyle(
  fromIdx: number,
  currentIdx: number,
  currentState: ShipmentStatus
): { stroke: string; dasharray?: string; opacity: number } {
  // Connector between Active(1) → Breached(3) when breached
  if (currentState === 'Breached' && fromIdx === 1) {
    return { stroke: 'url(#breach-gradient)', opacity: 1 };
  }

  // Filled connector (past or current transition)
  if (fromIdx < currentIdx) {
    if (currentState === 'Delivered') {
      return { stroke: 'url(#delivered-gradient)', opacity: 1 };
    }
    return { stroke: 'url(#active-gradient)', opacity: 1 };
  }

  // Future connector
  return { stroke: '#94A3B8', dasharray: '4 4', opacity: 0.4 };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ShipmentPipeline — horizontal progress tracker for the 4 shipment lifecycle states.
 *
 * States: Created → Active → Delivered / Breached (branching)
 * - Glowing ring on current state node
 * - Past states: solid fill
 * - Future states: dimmed dashed connector
 * - Elapsed time displayed below current node
 * - Frost-spread animation on state transitions (Framer Motion, 400–600ms)
 * - Mobile: stacks vertically
 */
export function ShipmentPipeline({
  currentState,
  lastTransitionTimestamp,
  animated = true,
}: ShipmentPipelineProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animated && !prefersReduced;

  const currentIdx = STATE_ORDER.indexOf(currentState);

  const elapsed =
    lastTransitionTimestamp != null
      ? formatElapsedTime(lastTransitionTimestamp)
      : null;

  return (
    <div
      role="list"
      aria-label={`Shipment pipeline — current state: ${currentState}`}
      className="w-full"
    >
      {/* ── Desktop layout (horizontal) ─────────────────────────────── */}
      <div className="hidden sm:flex items-center justify-between w-full px-2">
        {PIPELINE_NODES.map((node, idx) => {
          const colors = nodeColor(node.id, currentState);
          const isCurrent = node.id === currentState;
          const isPast    = STATE_ORDER.indexOf(node.id) < currentIdx;
          const showConnector = idx < PIPELINE_NODES.length - 1;

          return (
            <div
              key={node.id}
              role="listitem"
              className="flex items-center flex-1"
            >
              {/* Node */}
              <div className="flex flex-col items-center gap-2 relative">
                {/* Glow ring (current state only) */}
                {isCurrent && colors.glow && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `0 0 0 6px ${colors.glow}`,
                      borderRadius: '9999px',
                    }}
                    animate={
                      shouldAnimate
                        ? { boxShadow: [`0 0 0 4px ${colors.glow}`, `0 0 0 10px ${colors.glow}44`, `0 0 0 4px ${colors.glow}`] }
                        : {}
                    }
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {/* Node circle */}
                <motion.div
                  className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 z-10"
                  style={{
                    backgroundColor: colors.fill,
                    borderColor: colors.ring,
                    color: colors.text,
                  }}
                  initial={shouldAnimate ? { scale: 0.85, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: idx * 0.08 }}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <node.Icon size={20} aria-hidden="true" />
                </motion.div>

                {/* Label */}
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: isPast || isCurrent ? '#F1FAEE' : '#94A3B8' }}
                >
                  {node.label}
                </span>

                {/* Sub-label (current state only) */}
                {isCurrent && (
                  <span
                    className="text-xs whitespace-nowrap"
                    style={{ color: colors.ring === 'transparent' ? '#F1FAEE' : colors.ring }}
                  >
                    {node.subLabel}
                  </span>
                )}

                {/* Elapsed time (current state only) */}
                {isCurrent && elapsed && (
                  <span
                    className="text-xs text-frost-gray whitespace-nowrap"
                    aria-label={`Time in current state: ${elapsed}`}
                  >
                    {elapsed}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {showConnector && (
                <div className="flex-1 mx-2 relative" style={{ height: '2px' }}>
                  <ConnectorLine
                    fromIdx={idx}
                    currentIdx={currentIdx}
                    currentState={currentState}
                    shouldAnimate={shouldAnimate}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile layout (vertical) ─────────────────────────────────── */}
      <div className="flex sm:hidden flex-col items-start gap-0 pl-4">
        {PIPELINE_NODES.map((node, idx) => {
          const colors = nodeColor(node.id, currentState);
          const isCurrent = node.id === currentState;
          const isPast    = STATE_ORDER.indexOf(node.id) < currentIdx;
          const showConnector = idx < PIPELINE_NODES.length - 1;

          return (
            <div key={node.id} className="flex items-start gap-4" role="listitem">
              {/* Left column: node + vertical connector */}
              <div className="flex flex-col items-center">
                {/* Node circle */}
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 z-10"
                  style={{
                    backgroundColor: colors.fill,
                    borderColor: colors.ring,
                    color: colors.text,
                    boxShadow: isCurrent && colors.glow ? `0 0 0 4px ${colors.glow}` : undefined,
                  }}
                  initial={shouldAnimate ? { scale: 0.85, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: idx * 0.08 }}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <node.Icon size={16} aria-hidden="true" />
                </motion.div>

                {/* Vertical connector */}
                {showConnector && (
                  <div
                    className="w-0.5 h-8"
                    style={{
                      background: idx < currentIdx ? '#00D4FF' : '#94A3B860',
                    }}
                  />
                )}
              </div>

              {/* Right column: labels */}
              <div className="flex flex-col justify-center pb-8 pt-2 gap-0.5">
                <span
                  className="text-sm font-medium"
                  style={{ color: isPast || isCurrent ? '#F1FAEE' : '#94A3B8' }}
                >
                  {node.label}
                </span>
                {isCurrent && (
                  <span className="text-xs" style={{ color: colors.ring === 'transparent' ? '#F1FAEE' : colors.ring }}>
                    {node.subLabel}
                  </span>
                )}
                {isCurrent && elapsed && (
                  <span className="text-xs text-frost-gray">{elapsed}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SVG gradient definitions (hidden) */}
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
          <linearGradient id="delivered-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2EC4B6" />
            <stop offset="100%" stopColor="#2EC4B6" />
          </linearGradient>
          <linearGradient id="breach-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#E63946" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Connector sub-component ─────────────────────────────────────────────────

interface ConnectorLineProps {
  fromIdx: number;
  currentIdx: number;
  currentState: ShipmentStatus;
  shouldAnimate: boolean;
}

function ConnectorLine({ fromIdx, currentIdx, currentState, shouldAnimate }: ConnectorLineProps) {
  const style = connectorStyle(fromIdx, currentIdx, currentState);
  const isFilled = fromIdx < currentIdx;

  return (
    <svg
      className="w-full"
      height="4"
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Background track */}
      <line
        x1="0" y1="2" x2="100" y2="2"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeDasharray={style.dasharray}
        opacity={style.opacity}
      />

      {/* Animated fill overlay */}
      {isFilled && (
        <motion.line
          x1="0" y1="2" x2="100" y2="2"
          stroke={style.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={shouldAnimate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
    </svg>
  );
}

export default ShipmentPipeline;
