// File: einvite/src/components/ui/loading.tsx

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingProps {
  size?: "sm" | "default" | "lg" | "xl"
  variant?: "spinner" | "dots" | "pulse"
  text?: string
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12"
}

const textSizeClasses = {
  sm: "text-sm",
  default: "text-base",
  lg: "text-lg",
  xl: "text-xl"
}

function LoadingSpinner({ size = "default", className }: { size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <Loader2 
      className={cn("animate-spin text-blue-600", sizeClasses[size], className)} 
    />
  )
}

function LoadingDots({ size = "default", className }: { size?: keyof typeof sizeClasses; className?: string }) {
  const dotSize = size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : size === "xl" ? "w-4 h-4" : "w-2 h-2"
  
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className={cn("rounded-full bg-blue-600 animate-bounce", dotSize)} style={{ animationDelay: "0ms" }} />
      <div className={cn("rounded-full bg-blue-600 animate-bounce", dotSize)} style={{ animationDelay: "150ms" }} />
      <div className={cn("rounded-full bg-blue-600 animate-bounce", dotSize)} style={{ animationDelay: "300ms" }} />
    </div>
  )
}

function LoadingPulse({ size = "default", className }: { size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn("rounded-full bg-blue-600 animate-ping absolute", sizeClasses[size])} />
      <div className={cn("rounded-full bg-blue-600", sizeClasses[size])} />
    </div>
  )
}

export function Loading({ 
  size = "default", 
  variant = "spinner", 
  text, 
  className,
  fullScreen = false 
}: LoadingProps) {
  const loadingContent = (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-2",
      fullScreen ? "min-h-screen" : "py-8",
      className
    )}>
      {variant === "spinner" && <LoadingSpinner size={size} />}
      {variant === "dots" && <LoadingDots size={size} />}
      {variant === "pulse" && <LoadingPulse size={size} />}
      
      {text && (
        <p className={cn(
          "text-gray-600 font-medium",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
        {loadingContent}
      </div>
    )
  }

  return loadingContent
}

// Preset loading components for common use cases
export function PageLoading() {
  return <Loading size="lg" text="Loading..." fullScreen />
}

export function ButtonLoading({ size = "sm" }: { size?: keyof typeof sizeClasses }) {
  return <LoadingSpinner size={size} className="text-current" />
}

export function CardLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/4" />
    </div>
  )
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

export function AvatarLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-10 bg-gray-200 rounded-full" />
    </div>
  )
}

export function ImageLoading({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
  )
}