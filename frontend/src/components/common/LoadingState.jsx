import { Loader2 } from 'lucide-react'

export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/50">
      <Loader2 size={20} className="animate-spin text-safety" />
      <p className="text-[13px]">{label}</p>
    </div>
  )
}
