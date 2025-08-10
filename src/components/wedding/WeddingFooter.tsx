// File: src/components/wedding/WeddingFooter.tsx

'use client'

import { Share2, Heart } from 'lucide-react'

interface WeddingFooterProps {
  brideName?: string
  groomName?: string
  primaryColor: string
  fontFamily: string
  viewCount?: number
}

export function WeddingFooter({
  brideName = 'Bride',
  groomName = 'Groom',
  primaryColor,
  fontFamily,
  viewCount = 0
}: WeddingFooterProps) {
  const shareWebsite = async () => {
    const websiteData = {
      title: `${brideName} & ${groomName} Wedding`,
      text: 'Join us for our special day!',
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(websiteData)
      } catch {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Wedding website URL copied to clipboard!')
      } catch {
        console.error('Failed to copy URL')
      }
    }
  }

  return (
    <footer 
      className="py-8 px-6" 
      style={{ 
        backgroundColor: primaryColor,
        fontFamily: fontFamily 
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Couple Names */}
        <h3 className="text-xl md:text-2xl font-serif text-white mb-3">
          {brideName} & {groomName}
        </h3>
        
        {/* Thank You Message */}
        <p className="text-white/80 text-base mb-4">
          Thank you for being part of our special day! 💕
        </p>

        {/* Share Website Button */}
        <div className="mb-4">
          <button
            onClick={shareWebsite}
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Our Wedding
          </button>
        </div>

        {/* Footer Info - Single Line */}
        <div className="text-white/60 text-sm mb-3">
          <div className="flex items-center justify-center space-x-3 flex-wrap">
            <span>Views: {viewCount.toLocaleString()}</span>
            <span>•</span>
            <span>Made with ❤️</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>

        {/* Social Media Links - Single Line */}
        <div className="mb-4">
          <p className="text-white/50 text-xs mb-2">
            Follow our journey on social media
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              className="text-white/40 hover:text-white/70 transition-colors text-xs"
              onClick={() => {
                // Handle Instagram link
                window.open('#', '_blank')
              }}
            >
              Instagram
            </button>
            <span className="text-white/30">•</span>
            <button 
              className="text-white/40 hover:text-white/70 transition-colors text-xs"
              onClick={() => {
                // Handle Facebook link
                window.open('#', '_blank')
              }}
            >
              Facebook
            </button>
          </div>
        </div>

        {/* Copyright - Single Line */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-center space-x-2 text-white/40 text-xs flex-wrap">
            <span>© {new Date().getFullYear()} {brideName} & {groomName}</span>
            <span>•</span>
            <span>Created with Einvite</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

