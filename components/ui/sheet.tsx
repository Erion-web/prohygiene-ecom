'use client'

import type { ComponentProps, HTMLAttributes } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'

function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-[51] flex flex-col bg-white shadow-elevated',
          'inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl',
          'md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[22.5rem] md:rounded-none md:rounded-l-2xl md:border-l md:border-surface-border',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary">
          <X size={16} />
          <span className="sr-only">Mbyll</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-surface-border px-5 py-4 pr-12', className)} {...props} />
}

function SheetTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-bold text-text-primary', className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
}

function SheetFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 border-t border-surface-border px-5 py-3', className)}
      {...props}
    />
  )
}

export { Dialog as Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter }
