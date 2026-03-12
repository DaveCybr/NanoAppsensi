import React from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumbs, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6', className)}>
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-[11.5px] text-muted-foreground mb-1.5">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Portal</Link>
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-foreground transition-colors">{bc.label}</Link>
                ) : (
                  <span className="text-foreground font-medium">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-none">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-1.5">{description}</p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}