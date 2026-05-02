export function Chip({ children, selected, onClick, color, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selected && color ? { borderColor: color, backgroundColor: `${color}22` } : undefined}
      className={[
        'inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm whitespace-nowrap transition active:scale-[0.97] border',
        selected
          ? 'border-gold-500 bg-gold-500/15 text-ink-50'
          : 'border-ink-700 bg-ink-800/50 text-ink-100 hover:bg-ink-800',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}
