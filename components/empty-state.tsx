import type { ElementType, ReactNode } from "react"

interface EmptyStateProps {
  icon: ElementType
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/70 px-10 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-[var(--primary)] shadow-[var(--shadow-xs)]">
        <Icon className="h-7 w-7" />
      </span>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
        {description && <p className="text-sm text-[var(--neutral-500)]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
