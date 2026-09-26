const VARIANTS = {
  primary: 'bg-safety text-white hover:bg-amber-600 border border-transparent',
  secondary: 'bg-white text-ink border border-border hover:bg-ink/5',
  ghost: 'bg-transparent text-ink/70 border border-transparent hover:bg-ink/5',
  danger: 'bg-risk-high text-white hover:bg-red-700 border border-transparent',
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
