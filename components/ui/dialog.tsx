'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = ({ modal = false, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root modal={modal} {...props} />
)
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-md data-[state=open]:animate-fade-in', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onInteractOutside, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none">
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'pointer-events-auto relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-elevated data-[state=open]:animate-fade-in',
          className
        )}
        onPointerDownOutside={event => {
          const target = event.target as HTMLElement | null
          if (target?.closest('[data-radix-popper-content-wrapper], [cmdk-root]')) {
            event.preventDefault()
          }
        }}
        onFocusOutside={event => {
          const target = event.target as HTMLElement | null
          if (target?.closest('[data-radix-popper-content-wrapper], [cmdk-root]')) {
            event.preventDefault()
          }
        }}
        onInteractOutside={event => {
          const target = event.target as HTMLElement | null
          if (target?.closest('[data-radix-popper-content-wrapper], [cmdk-root]')) {
            event.preventDefault()
          }
          onInteractOutside?.(event)
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary">
          <X size={16} />
          <span className="sr-only">Mbyll</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </div>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-surface-border px-5 py-4 pr-12', className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-bold text-text-primary', className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 border-t border-surface-border px-5 py-3', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
}
