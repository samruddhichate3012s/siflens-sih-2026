import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldAlert size={28} className="text-ink/25" />
      <h1 className="text-[16px] font-semibold text-ink">Page not found</h1>
      <p className="text-[13px] text-ink/50 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 rounded-md bg-safety px-3.5 py-2 text-[13px] font-medium text-white hover:bg-amber-600 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
