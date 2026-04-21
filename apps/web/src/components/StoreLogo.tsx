export function StoreLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const fontSize =
    size === 'sm' ? 'text-lg' :
    size === 'lg' ? 'text-4xl' :
    'text-2xl';

  return (
    <span
      className={`${fontSize} font-extrabold tracking-tight select-none text-foreground`}
      style={{ letterSpacing: '-0.02em' }}
      aria-label="SmartWear"
    >
      SmartWear
    </span>
  );
}
