// File: einvite/src/app/auth/login/page.tsx

import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'
import { APP_CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: `Login - ${APP_CONFIG.name}`,
  description: 'Sign in to your Einvite account to manage your wedding websites.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Brand Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            {APP_CONFIG.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {APP_CONFIG.tagline}
          </p>
        </div>

        {/* Login Form */}
        <LoginForm className="mt-8" />
      </div>
    </div>
  )
}