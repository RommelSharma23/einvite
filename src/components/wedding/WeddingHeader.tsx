// File: src/components/wedding/WeddingHeader.tsx
'use client'

import { useState, useEffect } from 'react'

interface WeddingHeaderProps {
  brideName?: string
  groomName?: string
  primaryColor: string
  hasEvents: boolean
  hasVenue: boolean
  hasGallery: boolean
  hasWishes: boolean
  hasRSVP: boolean
  activeSection?: string
  onNavigate?: (sectionId: string) => void
}

export function WeddingHeader({
  brideName = 'Bride',
  groomName = 'Groom',
  primaryColor,
  hasEvents,
  hasVenue,
  hasGallery,
  hasWishes,
  hasRSVP,
  activeSection = '',
  onNavigate
}: WeddingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Handle scroll effect for header background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navigation items based on available sections
  const navigationItems = [
    { id: 'hero', label: 'Home', always: true },
    { id: 'events', label: 'Events', show: hasEvents },
    { id: 'venue', label: 'Venue', show: hasVenue },
    { id: 'gallery', label: 'Gallery', show: hasGallery },
    { id: 'rsvp', label: 'RSVP', show: hasRSVP },
    { id: 'couple', label: 'Our Story', always: true },
    { id: 'wishes', label: 'Wishes', show: hasWishes }
  ].filter(item => item.always || item.show)

  const handleNavClick = (sectionId: string) => {
    if (onNavigate) {
      onNavigate(sectionId)
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg' 
            : 'bg-black/20 backdrop-blur-sm'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo/Brand */}
            <div 
              className={`text-xl md:text-2xl font-bold transition-colors duration-300 cursor-pointer ${
                isScrolled ? 'text-gray-800' : 'text-white'
              }`}
              onClick={() => handleNavClick('hero')}
            >
              {brideName} & {groomName}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  } ${activeSection === item.id ? 'text-opacity-100' : 'text-opacity-90'}`}
                >
                  {item.label}
                  
                  {/* Active section indicator */}
                  {activeSection === item.id && (
                    <span 
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full transition-all duration-300"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${
                isScrolled ? 'text-gray-700' : 'text-white'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                  isMobileMenuOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/50">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 ${
                    activeSection === item.id ? 'bg-gray-100 font-semibold' : 'font-medium'
                  }`}
                  style={{
                    color: activeSection === item.id ? primaryColor : undefined
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Add smooth scrolling styles */}
      <style jsx>{`
        @media (min-width: 768px) {
          nav button:hover::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            right: 0;
            height: 2px;
            background: ${primaryColor};
            opacity: 0.6;
            transform: scaleX(0);
            transition: transform 0.3s ease;
          }
          
          nav button:hover::after {
            transform: scaleX(1);
          }
        }
      `}</style>
    </>
  )
}