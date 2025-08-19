// File: einvite/src/app/auth/register/page.tsx

import type { Metadata } from 'next'
import RegisterForm from '@/components/auth/RegisterForm'
import { APP_CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: `Create Account - ${APP_CONFIG.name}`,
  description: 'Join Einvite to create beautiful wedding websites in minutes. Start your free trial today.',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Brand Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            {APP_CONFIG.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {APP_CONFIG.tagline}
          </p>
        </div>

        {/* Registration Form */}
        <RegisterForm className="mt-8" />
      </div>
    </div>
  )
}