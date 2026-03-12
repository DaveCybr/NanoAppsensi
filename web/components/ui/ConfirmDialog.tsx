import React from 'react'
import { cn } from '@/lib/utils/cn'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const colorClasses = {
    danger:  'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    info:    'bg-primary hover:bg-primary/90 focus:ring-primary',
  }

  const iconColors = {
    danger:  'text-red-600 bg-red-100',
    warning: 'text-amber-600 bg-amber-100',
    info:    'text-blue-600 bg-blue-100',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start">
            <div className={cn("p-2 rounded-full mr-4", iconColors[variant])}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-6 text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-muted/30 px-6 py-4 flex flex-row-reverse space-x-2 space-x-reverse">
          <button
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              "inline-flex justify-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50",
              colorClasses[variant]
            )}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-foreground bg-white border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
