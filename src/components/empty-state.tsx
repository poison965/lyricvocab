import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
        <span
          className="material-symbols-outlined text-4xl text-[#484847]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
        >
          {icon}
        </span>
      </div>
      <h3 className="font-headline text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-[#adaaaa] text-sm mb-6 max-w-xs leading-relaxed">{description}</p>
      {action}
    </div>
  )
}