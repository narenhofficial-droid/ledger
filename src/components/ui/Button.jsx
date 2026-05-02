export function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition active:scale-[0.97] disabled:opacity-50';
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-5 text-base',
  };
  const variants = {
    primary: 'bg-gold-500 text-ink-950 hover:bg-gold-400',
    ghost:   'bg-ink-800 text-ink-50 hover:bg-ink-700',
    outline: 'border border-ink-700 text-ink-50 hover:bg-ink-800',
    danger:  'bg-danger/15 text-danger hover:bg-danger/25',
  };
  return (
    <button {...rest} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
