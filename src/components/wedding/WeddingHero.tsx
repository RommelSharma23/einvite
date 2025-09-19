// File: src/components/wedding/WeddingHero.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
}

interface WeddingHeroProps {
  brideName?: string
  groomName?: string
  weddingDate?: string
  welcomeMessage?: string
  heroImageUrl?: string
  heroImageUrls?: string[]
  primaryColor: string
  secondaryColor: string
  fontFamily: string
}

export function WeddingHero({
  brideName = 'Bride',
  groomName = 'Groom',
  weddingDate,
  welcomeMessage,
  heroImageUrl,
  heroImageUrls,
  primaryColor,
  secondaryColor,
  fontFamily
}: WeddingHeroProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  
  // Hero image slider state
  const images = heroImageUrls && heroImageUrls.length > 0 ? heroImageUrls : (heroImageUrl ? [heroImageUrl] : [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  // Auto-advance slider
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [images.length, isPlaying])

  // Preload all images for smooth transitions
  useEffect(() => {
    images.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [images])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsPlaying(false)
    setTimeout(() => setIsPlaying(true), 10000) // Resume after 10s
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length)
    setIsPlaying(false)
    setTimeout(() => setIsPlaying(true), 10000)
  }, [images.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
    setIsPlaying(false)
    setTimeout(() => setIsPlaying(true), 10000)
  }, [images.length])

  // Calculate countdown
  useEffect(() => {
    console.log('🕒 Timer Debug - weddingDate:', weddingDate)
    if (!weddingDate) {
      console.log('❌ Timer Debug - No wedding date provided')
      return
    }

    const calculateTimeLeft = () => {
      const weddingDateTime = new Date(weddingDate).getTime()
      const now = new Date().getTime()
      const difference = weddingDateTime - now

      console.log('🕒 Timer Debug:', {
        weddingDate,
        weddingDateTime,
        now,
        difference,
        isPast: difference <= 0
      })

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const timeLeft = { days, hours, minutes }
        console.log('✅ Timer Debug - Setting timeLeft:', timeLeft)
        setTimeLeft(timeLeft)
      } else {
        console.log('❌ Timer Debug - Wedding date is in the past, hiding timer')
        setTimeLeft(null)
      }
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every minute
    const interval = setInterval(calculateTimeLeft, 60000)

    return () => clearInterval(interval)
  }, [weddingDate])

  const formatWeddingDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section 
      id="home"
      className="min-h-screen flex items-center justify-center text-center px-6 relative pt-20 overflow-hidden group"
      style={{
        fontFamily: fontFamily
      }}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Background Images for Slider */}
      {images.length > 0 ? (
        images.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 1 : 0
            }}
          />
        ))
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`
          }}
        />
      )}

      {/* Navigation - Only show if multiple images */}
      {images.length > 1 && (
        <>
          {/* Arrow Navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dot Navigation */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Invitation Badge */}
        <div className="mb-8">
          <div className="inline-block px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
            💌 You&apos;re Invited to Our Wedding!
          </div>
        </div>

        {/* Couple Names */}
        <h1 
          className={`text-4xl md:text-6xl lg:text-7xl font-serif mb-6 ${images.length > 0 ? 'text-white drop-shadow-lg' : ''}`}
          style={{ 
            color: images.length > 0 ? 'white' : primaryColor,
            textShadow: images.length > 0 ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
          }}
        >
          {brideName}
          <span 
            className="mx-4 text-3xl md:text-5xl lg:text-6xl" 
            style={{ 
              color: images.length > 0 ? 'white' : secondaryColor,
              textShadow: images.length > 0 ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            &
          </span>
          {groomName}
        </h1>
        
        {/* Getting Married Text */}
        <div className="mb-8">
          <p 
            className={`text-xl md:text-2xl ${images.length > 0 ? 'text-white/90' : 'text-gray-600'}`}
            style={{
              textShadow: images.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            are getting married!
          </p>
        </div>

        {/* Wedding Date */}
        {weddingDate && (
          <div className="mb-8">
            <p 
              className={`text-xl md:text-2xl font-semibold ${images.length > 0 ? 'text-white drop-shadow-lg' : ''}`}
              style={{ 
                color: images.length > 0 ? 'white' : primaryColor,
                textShadow: images.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
              }}
            >
              {formatWeddingDate(weddingDate)}
            </p>
          </div>
        )}

        {/* Welcome Message */}
        {welcomeMessage && (
          <p 
            className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${images.length > 0 ? 'text-gray-100' : 'text-gray-600'}`}
            style={{
              textShadow: images.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            {welcomeMessage}
          </p>
        )}

        {/* Countdown Timer */}
        {timeLeft && (
          <div className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg inline-block ${images.length > 0 ? 'bg-white/20 border border-white/30' : 'bg-white bg-opacity-90'}`}>
            <h3 
              className={`text-lg md:text-xl font-semibold mb-4 ${images.length > 0 ? 'text-white' : ''}`}
              style={{ 
                color: images.length > 0 ? 'white' : primaryColor,
                textShadow: images.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
              }}
            >
              Our Big Day In
            </h3>
            
            <div className="grid grid-cols-3 gap-6 md:gap-8">
              {/* Days */}
              <div className="text-center">
                <div 
                  className={`text-3xl md:text-4xl font-bold ${images.length > 0 ? 'text-white' : ''}`}
                  style={{ 
                    color: images.length > 0 ? 'white' : primaryColor,
                    textShadow: images.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {timeLeft.days}
                </div>
                <div className={`text-sm ${images.length > 0 ? 'text-gray-100' : 'text-gray-600'}`}>
                  Days
                </div>
              </div>
              
              {/* Hours */}
              <div className="text-center">
                <div 
                  className={`text-3xl md:text-4xl font-bold ${images.length > 0 ? 'text-white' : ''}`}
                  style={{ 
                    color: images.length > 0 ? 'white' : primaryColor,
                    textShadow: images.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {timeLeft.hours}
                </div>
                <div className={`text-sm ${images.length > 0 ? 'text-gray-100' : 'text-gray-600'}`}>
                  Hours
                </div>
              </div>
              
              {/* Minutes */}
              <div className="text-center">
                <div 
                  className={`text-3xl md:text-4xl font-bold ${images.length > 0 ? 'text-white' : ''}`}
                  style={{ 
                    color: images.length > 0 ? 'white' : primaryColor,
                    textShadow: images.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {timeLeft.minutes}
                </div>
                <div className={`text-sm ${images.length > 0 ? 'text-gray-100' : 'text-gray-600'}`}>
                  Minutes
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}