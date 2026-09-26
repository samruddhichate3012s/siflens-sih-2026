import { Inbox } from 'lucide-react'

export default function EmptyState({ message = 'Nothing to show here yet.', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-14 text-center">
      <Icon size={22} className="text-ink/25" />
      <p className="text-[13px] text-ink/50 max-w-xs">{message}</p>
    </div>
  )
}
