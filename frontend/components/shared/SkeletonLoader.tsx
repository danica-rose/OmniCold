'use client';

interface SkeletonLoaderProps {
  /** Shape variant: 'rectangle' or 'circle' */
  variant?: 'rectangle' | 'circle';
  /** Width (CSS value). Defaults to '100%' for rectangle, '48px' for circle. */
  width?: string;
  /** Height (CSS value). Defaults to '20px' for rectangle, same as width for circle. */
  height?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated skeleton placeholder with frost-gradient pulse animation.
 * Supports rectangle and circle variants with configurable dimensions.
 */
export function SkeletonLoader({
  variant = 'rectangle',
  width,
  height,
  className = '',
}: SkeletonLoaderProps) {
  const isCircle = variant === 'circle';

  const defaultWidth = isCircle ? '48px' : '100%';
  const defaultHeight = isCircle ? (width || '48px') : '20px';

  const resolvedWidth = width || defaultWidth;
  const resolvedHeight = height || defaultHeight;

  return (
    <div
      className={[
        'animate-pulse bg-frost-gradient',
        isCircle ? 'rounded-full' : 'rounded-md',
        'bg-arctic-slate/60',
        className,
      ].join(' ')}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        backgroundImage:
          'linear-gradient(90deg, rgba(30,41,59,0.6) 25%, rgba(0,212,255,0.08) 50%, rgba(30,41,59,0.6) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
      }}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default SkeletonLoader;
