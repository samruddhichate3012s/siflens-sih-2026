import { Menu, ShieldHalf } from 'lucide-react'

export default function Header({ onOpenMenu }) {
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-sidebar border-b border-sidebar-border">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
        className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-textActive transition-colors"
      >
        <Menu size={19} />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-safety/15 border border-safety/30">
          <ShieldHalf size={14} className="text-safety" strokeWidth={2.25} />
        </div>
        <span className="text-[13.5px] font-semibold text-sidebar-textActive tracking-tight">SIFLens</span>
      </div>
    </header>
  )
}
