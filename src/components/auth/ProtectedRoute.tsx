// File: einvite/src/components/auth/ProtectedRoute.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loading } from '@/components/ui/loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireSubscription?: 'silver' | 'gold' | 'platinum'
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  requireSubscription
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If no user, redirect to login
      if (!user) {
        router.push(redirectTo)
        return
      }

      // If specific subscription required, check user's tier
      if (requireSubscription) {
        const tierHierarchy = ['free', 'silver', 'gold', 'platinum']
        const userLevel = tierHierarchy.indexOf(user.current_subscription)
        const requiredLevel = tierHierarchy.indexOf(requireSubscription)
        
        if (userLevel < requiredLevel) {
          // Redirect to upgrade page if subscription insufficient
          router.push('/dashboard/settings?upgrade=true')
          return
        }
      }
    }
  }, [user, loading, router, redirectTo, requireSubscription])

  // Show loading while checking authentication
  if (loading) {
    return <Loading size="lg" text="Verifying access..." fullScreen />
  }

  // If no user after loading, don't render children (redirect will happen)
  if (!user) {
    return null
  }

  // If subscription required and user doesn't have it, don't render children
  if (requireSubscription) {
    const tierHierarchy = ['free', 'silver', 'gold', 'platinum']
    const userLevel = tierHierarchy.indexOf(user.current_subscription)
    const requiredLevel = tierHierarchy.indexOf(requireSubscription)
    
    if (userLevel < requiredLevel) {
      return null
    }
  }

  // User is authenticated and has required subscription, render children
  return <>{children}</>
}

// Higher-order component version for easier use
export function withProtectedRoute<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    redirectTo?: string
    requireSubscription?: 'silver' | 'gold' | 'platinum'
  }
) {
  const ProtectedComponent = (props: T) => {
    return (
      <ProtectedRoute 
        redirectTo={options?.redirectTo}
        requireSubscription={options?.requireSubscription}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`
  
  return ProtectedComponent
}