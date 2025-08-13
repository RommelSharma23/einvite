// File: src/app/layout.tsx

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { APP_CONFIG } from '@/lib/config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.seo.defaultTitle,
    template: `%s - ${APP_CONFIG.name}`
  },
  description: APP_CONFIG.seo.defaultDescription,
  keywords: [...APP_CONFIG.seo.keywords],
  authors: [{ name: APP_CONFIG.company.name }],
  creator: APP_CONFIG.company.name,
  publisher: APP_CONFIG.company.name,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_CONFIG.urls.app,
    title: APP_CONFIG.seo.defaultTitle,
    description: APP_CONFIG.seo.defaultDescription,
    siteName: APP_CONFIG.name,
    images: [
      {
        url: APP_CONFIG.seo.ogImage,
        width: 1200,
        height: 630,
        alt: APP_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.seo.defaultTitle,
    description: APP_CONFIG.seo.defaultDescription,
    images: [APP_CONFIG.seo.ogImage],
    creator: '@einvite',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'google-site-verification-code', // Add your Google verification code
  },
  // Add the missing metadataBase and viewport
  metadataBase: new URL(APP_CONFIG.urls.app || 'http://localhost:3000'),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  // Add theme color
  themeColor: '#2563eb',
  // Additional meta tags
  other: {
    'theme-color': '#2563eb',
    'msapplication-TileColor': '#2563eb',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        {/* Global notifications container */}
        <div id="notifications" className="fixed top-0 right-0 z-50 p-4 space-y-4" />
        
        {/* Main app content */}
        <main className="min-h-full">
          {children}
        </main>
        
        {/* Global modals container */}
        <div id="modals" />
        
        {/* Development tools (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              <span className="sm:hidden">XS</span>
              <span className="hidden sm:inline md:hidden">SM</span>
              <span className="hidden md:inline lg:hidden">MD</span>
              <span className="hidden lg:inline xl:hidden">LG</span>
              <span className="hidden xl:inline 2xl:hidden">XL</span>
              <span className="hidden 2xl:inline">2XL</span>
            </div>
          </div>
        )}
      </body>
    </html>
  )
}