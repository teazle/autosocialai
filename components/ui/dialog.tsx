"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open: openProp, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen
  const handleOpenChange = (newOpen: boolean) => {
    if (openProp === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ children, ...props }, ref) => {
    const context = React.useContext(DialogContext)
    if (!context) {
      throw new Error("DialogTrigger must be used within Dialog")
    }

    return (
      <button
        ref={ref}
        onClick={() => context.onOpenChange(true)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = "DialogTrigger"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(DialogContext)
    if (!context) {
      throw new Error("DialogContent must be used within Dialog")
    }

    if (!context.open) return null

    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => context.onOpenChange(false)}
        />
        <div
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
DialogContent.displayName = "DialogContent"

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
)
DialogHeader.displayName = "DialogHeader"

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-xl font-semibold leading-none tracking-tight text-gray-900", className)}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-black", className)}
      {...props}
    />
  )
)
DialogDescription.displayName = "DialogDescription"

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  )
)
DialogFooter.displayName = "DialogFooter"

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(DialogContext)
    if (!context) {
      throw new Error("DialogClose must be used within Dialog")
    }

    return (
      <button
        ref={ref}
        onClick={() => context.onOpenChange(false)}
        className={cn("absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:pointer-events-none", className)}
        {...props}
      />
    )
  }
)
DialogClose.displayName = "DialogClose"

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }

