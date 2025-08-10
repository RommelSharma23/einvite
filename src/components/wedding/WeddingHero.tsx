// File: src/components/wedding/WeddingHero.tsx

'use client'

import { useState, useEffect } from 'react'

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
  primaryColor,
  secondaryColor,
  fontFamily
}: WeddingHeroProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  // Calculate countdown
  useEffect(() => {
    if (!weddingDate) return

    const calculateTimeLeft = () => {
      const weddingDateTime = new Date(weddingDate).getTime()
      const now = new Date().getTime()
      const difference = weddingDateTime - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft({ days, hours, minutes })
      } else {
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
      className="min-h-screen flex items-center justify-center text-center px-6 relative pt-20"
      style={{
        background: heroImageUrl 
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImageUrl})`
          : `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: fontFamily
      }}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Invitation Badge */}
        <div className="mb-8">
          <div className="inline-block px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
            💌 You&apos;re Invited to Our Wedding!
          </div>
        </div>

        {/* Couple Names */}
        <h1 
          className={`text-4xl md:text-6xl lg:text-7xl font-serif mb-6 ${heroImageUrl ? 'text-white drop-shadow-lg' : ''}`}
          style={{ 
            color: heroImageUrl ? 'white' : primaryColor,
            textShadow: heroImageUrl ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
          }}
        >
          {brideName}
          <span 
            className="mx-4 text-3xl md:text-5xl lg:text-6xl" 
            style={{ 
              color: heroImageUrl ? 'white' : secondaryColor,
              textShadow: heroImageUrl ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            &
          </span>
          {groomName}
        </h1>
        
        {/* Getting Married Text */}
        <div className="mb-8">
          <p 
            className={`text-xl md:text-2xl ${heroImageUrl ? 'text-white/90' : 'text-gray-600'}`}
            style={{
              textShadow: heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            are getting married!
          </p>
        </div>

        {/* Wedding Date */}
        {weddingDate && (
          <div className="mb-8">
            <p 
              className={`text-xl md:text-2xl font-semibold ${heroImageUrl ? 'text-white drop-shadow-lg' : ''}`}
              style={{ 
                color: heroImageUrl ? 'white' : primaryColor,
                textShadow: heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
              }}
            >
              {formatWeddingDate(weddingDate)}
            </p>
          </div>
        )}

        {/* Welcome Message */}
        {welcomeMessage && (
          <p 
            className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}
            style={{
              textShadow: heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            {welcomeMessage}
          </p>
        )}

        {/* Countdown Timer */}
        {timeLeft && (
          <div className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg inline-block ${heroImageUrl ? 'bg-white/20 border border-white/30' : 'bg-white bg-opacity-90'}`}>
            <h3 
              className={`text-lg md:text-xl font-semibold mb-4 ${heroImageUrl ? 'text-white' : ''}`}
              style={{ 
                color: heroImageUrl ? 'white' : primaryColor,
                textShadow: heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
              }}
            >
              Our Big Day In
            </h3>
            
            <div className="grid grid-cols-3 gap-6 md:gap-8">
              {/* Days */}
              <div className="text-center">
                <div 
                  className={`text-3xl md:text-4xl font-bold ${heroImageUrl ? 'text-white' : ''}`}
                  style={{ 
                    color: heroImageUrl ? 'white' : primaryColor,
                    textShadow: heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {timeLeft.days}
                </div>
                <div className={`text-sm ${heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}>
                  Days
                </div>
              </div>
              
              {/* Hours */}
              <div className="text-center">
                <div 
                  className={`text-3xl md:text-4xl font-bold ${heroImageUrl ? 'text-white' : ''}`}
                  style={{ 
                    color: heroImageUrl ? 'white' : primaryColor,
                    textShadow: heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {timeLeft.hours}
                </div>
                <div className={`text-sm ${heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}>
                  Hours
                </div>
              </div>
              
              {/* Minutes */}
              <div className="text-center">
                <div 
                  className={`text-3xl md:text-4xl font-bold ${heroImageUrl ? 'text-white' : ''}`}
                  style={{ 
                    color: heroImageUrl ? 'white' : primaryColor,
                    textShadow: heroImageUrl ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {timeLeft.minutes}
                </div>
                <div className={`text-sm ${heroImageUrl ? 'text-gray-100' : 'text-gray-600'}`}>
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