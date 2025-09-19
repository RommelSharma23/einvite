'use client'

import { Facebook, Instagram } from 'lucide-react'

interface SocialLinksConfig {
  isEnabled: boolean
  facebookUrl: string
  instagramUrl: string
  displayLocation: 'header' | 'footer' | 'section' | 'floating'
  callToAction: string
  iconStyle: 'colored' | 'monochrome' | 'outline'
  iconSize: 'small' | 'medium' | 'large'
}

interface SocialLinksProps {
  config: SocialLinksConfig
  primaryColor: string
  secondaryColor: string
  className?: string
}

export function SocialLinks({ config, primaryColor, secondaryColor, className = '' }: SocialLinksProps) {
  // Don't render if disabled or no links provided
  if (!config.isEnabled || (!config.facebookUrl && !config.instagramUrl)) {
    return null
  }

  const getSizeClasses = () => {
    return { container: 'w-12 h-12', icon: 'h-6 w-6' } // Fixed to 48px (large)
  }

  const getIconStyles = (platform: 'facebook' | 'instagram') => {
    // Fixed to always use platform colors with better visibility
    return {
      container: {
        backgroundColor: platform === 'facebook' ? '#1877f2' : undefined,
        background: platform === 'instagram'
          ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
          : undefined,
        // Ensure proper display and no conflicts
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        visibility: 'visible'
      },
      icon: {
        color: 'white',
        // Force visibility
        opacity: 1,
        visibility: 'visible',
        display: 'block'
      }
    }
  }

  const sizes = getSizeClasses()

  return (
    <div className={`text-center ${className}`}>
      {/* Call to Action */}
      {config.callToAction && (
        <p
          className="font-medium mb-4"
          style={{ color: primaryColor }}
        >
          {config.callToAction}
        </p>
      )}

      {/* Social Icons */}
      <div className="flex items-center justify-center gap-4">
        {config.facebookUrl && (
          <a
            href={config.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#1877f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              margin: '10px',
              position: 'relative',
              zIndex: 9999,
              // Extra centering properties
              textAlign: 'center',
              lineHeight: '48px'
            }}
          >
            <Facebook
              style={{
                width: '24px',
                height: '24px',
                color: 'white',
                fill: 'white',
                stroke: 'white',
                display: 'block',
                margin: 'auto',
                flexShrink: 0
              }}
            />
          </a>
        )}

        {config.instagramUrl && (
          <a
            href={config.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${sizes.container} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg`}
            style={getIconStyles('instagram').container}
          >
            <Instagram
              className={sizes.icon}
              style={getIconStyles('instagram').icon}
            />
          </a>
        )}
      </div>
    </div>
  )
}

// Specific display components for different locations
export function HeaderSocialLinks({ config, primaryColor, secondaryColor }: SocialLinksProps) {
  if (config.displayLocation !== 'header') return null

  return (
    <SocialLinks
      config={config}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      className="hidden md:flex items-center"
    />
  )
}

export function FooterSocialLinks({ config, primaryColor, secondaryColor }: SocialLinksProps) {
  if (config.displayLocation !== 'footer') return null

  return (
    <div className="py-6 border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto px-4">
        <SocialLinks
          config={config}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    </div>
  )
}

export function SectionSocialLinks({ config, primaryColor, secondaryColor }: SocialLinksProps) {
  if (config.displayLocation !== 'section') return null

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <SocialLinks
          config={config}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    </section>
  )
}

export function FloatingSocialLinks({ config, primaryColor, secondaryColor }: SocialLinksProps) {
  if (config.displayLocation !== 'floating') return null

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block">
      <div className="flex flex-col gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
        {config.callToAction && (
          <p
            className="text-xs font-medium mb-2 text-center writing-mode-vertical"
            style={{ color: primaryColor }}
          >
            {config.callToAction}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {config.facebookUrl && (
            <a
              href={config.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: '#1877f2' }}
            >
              <Facebook
                className="h-6 w-6"
                style={{ color: 'white' }}
              />
            </a>
          )}

          {config.instagramUrl && (
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{
                background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
              }}
            >
              <Instagram
                className="h-6 w-6"
                style={{ color: 'white' }}
              />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}