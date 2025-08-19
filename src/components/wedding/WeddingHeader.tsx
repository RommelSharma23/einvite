// File: src/components/wedding/WeddingHeader.tsx

'use client'

import { useState, useEffect } from 'react'
import { Heart, Calendar, Images, MessageCircle, Menu, X, Users } from 'lucide-react'

interface WeddingHeaderProps {
  brideName?: string
  groomName?: string
  primaryColor: string
  hasEvents?: boolean
  hasGallery?: boolean
  hasWishes?: boolean
  hasRSVP?: boolean
}

export function WeddingHeader({
  brideName = 'Bride',
  groomName = 'Groom',
  primaryColor,
  hasEvents = false,
  hasGallery = false,
  hasWishes = false,
  hasRSVP = false
}: WeddingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
    setIsMobileMenuOpen(false)
  }

  // Navigation items
  const navItems = [
    { id: 'hero', label: 'Home', icon: Heart, show: true },
    { id: 'events', label: 'Events', icon: Calendar, show: hasEvents },
    { id: 'gallery', label: 'Gallery', icon: Images, show: hasGallery },
    { id: 'rsvp', label: 'RSVP', icon: Users, show: hasRSVP },
    { id: 'wishes', label: 'Wishes', icon: MessageCircle, show: hasWishes },
    { id: 'couple', label: 'Couple', icon: Heart, show: true }
  ].filter(item => item.show)

  return (
    <>
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Names */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => scrollToSection('hero')}
            >
              <Heart 
                className="h-6 w-6" 
                style={{ color: primaryColor }}
              />
              <span 
                className={`font-serif text-lg font-semibold ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                {brideName} & {groomName}
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                      isScrolled
                        ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    } ${item.id === 'rsvp' ? 'relative' : ''}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {/* RSVP highlight indicator */}
                    {item.id === 'rsvp' && (
                      <div 
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: primaryColor }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center justify-between w-full px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${
                      item.id === 'rsvp' ? 'relative' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5" style={{ color: primaryColor }} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {/* RSVP highlight indicator for mobile */}
                    {item.id === 'rsvp' && (
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: primaryColor }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16"></div>
    </>
  )
}