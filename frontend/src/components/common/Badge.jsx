const VARIANTS = {
  high: 'bg-risk-highBg text-risk-high border-risk-high/20',
  medium: 'bg-risk-mediumBg text-risk-medium border-risk-medium/25',
  low: 'bg-risk-lowBg text-risk-low border-risk-low/20',
  ai: 'bg-ai-bg text-ai border-ai/20',
  neutral: 'bg-ink/5 text-ink/70 border-ink/10',
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11.5px] font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
