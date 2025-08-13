// File: src/app/global-error.tsx

'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Log error for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Global error:', error)
  }

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={reset}
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <div>
                <Link 
                  href="/"
                  className="inline-block px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}