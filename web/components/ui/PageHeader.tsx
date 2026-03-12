import React from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: Breadcrumb[]
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, breadcrumbs, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
      <div className="space-y-1">
        {breadcrumbs && (
          <nav className="flex items-center text-xs text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-primary flex items-center">
              <Home className="w-3 h-3 mr-1" />
              Portal
            </Link>
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3 mx-1" />
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-primary">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  )
}
