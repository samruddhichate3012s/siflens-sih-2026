export default function PageHeader({ title, subtitle, status, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        {status && (
          <div className="flex items-center gap-1.5 mb-2 text-[11.5px] font-semibold text-risk-low">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-risk-low" />
            </span>
            {status}
          </div>
        )}
        <h1 className="text-[20px] font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-ink/60 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
