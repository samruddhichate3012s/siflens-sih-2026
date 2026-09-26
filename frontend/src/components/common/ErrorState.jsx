import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function ErrorState({
  message = 'Unable to connect to SIFLens API.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-risk-highBg">
        <AlertTriangle size={18} className="text-risk-high" />
      </div>
      <p className="text-[13.5px] text-ink/70 max-w-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-ink/70 hover:bg-ink/5 transition-colors"
        >
          <RotateCcw size={13} />
          Retry
        </button>
      )}
    </div>
  )
}
