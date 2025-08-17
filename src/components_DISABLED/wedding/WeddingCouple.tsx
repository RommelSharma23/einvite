// File: src/components/wedding/WeddingCouple.tsx

'use client'

import { Heart } from 'lucide-react'
import Image from 'next/image'

interface PersonInfo {
  name?: string
  description?: string
  fatherName?: string
  motherName?: string
  photoUrl?: string
}

interface CoupleContent {
  brideInfo?: PersonInfo
  groomInfo?: PersonInfo
}

interface WeddingCoupleProps {
  couple: CoupleContent
  primaryColor: string
  secondaryColor: string
  fontFamily: string
}

export function WeddingCouple({
  couple,
  primaryColor,
  secondaryColor,
  fontFamily
}: WeddingCoupleProps) {
  const brideInfo = couple?.brideInfo || {}
  const groomInfo = couple?.groomInfo || {}

  return (
    <section 
      id="couple" 
      className="py-16 px-6 bg-white"
      style={{ fontFamily: fontFamily }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <h2 
          className="text-3xl md:text-4xl font-serif text-center mb-12"
          style={{ color: primaryColor }}
        >
          Meet the Couple
        </h2>
        
        {/* Couple Grid */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Bride */}
          <div className="text-center">
            {/* Bride Photo */}
            <div className="mb-6">
              {brideInfo.photoUrl ? (
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full mx-auto overflow-hidden shadow-lg border-4 border-white relative">
                  <Image
                    src={brideInfo.photoUrl}
                    alt={brideInfo.name || 'Bride'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 192px, 224px"
                    priority
                  />
                </div>
              ) : (
                <div 
                  className="w-48 h-48 md:w-56 md:h-56 rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-white"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Heart className="h-16 w-16" style={{ color: primaryColor }} />
                </div>
              )}
            </div>

            {/* Bride Name */}
            <h3 
              className="text-2xl md:text-3xl font-semibold mb-4"
              style={{ color: primaryColor }}
            >
              {brideInfo.name || 'Bride'}
            </h3>

            {/* Bride Description */}
            {brideInfo.description && (
              <p className="text-gray-600 mb-4 leading-relaxed text-lg max-w-md mx-auto">
                {brideInfo.description}
              </p>
            )}

            {/* Bride Parents */}
            {(brideInfo.fatherName || brideInfo.motherName) && (
              <div className="text-gray-500">
                <p className="text-sm mb-1">Daughter of</p>
                <p className="font-medium text-base">
                  {brideInfo.fatherName && brideInfo.motherName 
                    ? `${brideInfo.fatherName} & ${brideInfo.motherName}`
                    : brideInfo.fatherName || brideInfo.motherName
                  }
                </p>
              </div>
            )}
          </div>

          {/* Groom */}
          <div className="text-center">
            {/* Groom Photo */}
            <div className="mb-6">
              {groomInfo.photoUrl ? (
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full mx-auto overflow-hidden shadow-lg border-4 border-white relative">
                  <Image
                    src={groomInfo.photoUrl}
                    alt={groomInfo.name || 'Groom'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 192px, 224px"
                    priority
                  />
                </div>
              ) : (
                <div 
                  className="w-48 h-48 md:w-56 md:h-56 rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-white"
                  style={{ backgroundColor: `${secondaryColor}15` }}
                >
                  <Heart className="h-16 w-16" style={{ color: secondaryColor }} />
                </div>
              )}
            </div>

            {/* Groom Name */}
            <h3 
              className="text-2xl md:text-3xl font-semibold mb-4"
              style={{ color: primaryColor }}
            >
              {groomInfo.name || 'Groom'}
            </h3>

            {/* Groom Description */}
            {groomInfo.description && (
              <p className="text-gray-600 mb-4 leading-relaxed text-lg max-w-md mx-auto">
                {groomInfo.description}
              </p>
            )}

            {/* Groom Parents */}
            {(groomInfo.fatherName || groomInfo.motherName) && (
              <div className="text-gray-500">
                <p className="text-sm mb-1">Son of</p>
                <p className="font-medium text-base">
                  {groomInfo.fatherName && groomInfo.motherName 
                    ? `${groomInfo.fatherName} & ${groomInfo.motherName}`
                    : groomInfo.fatherName || groomInfo.motherName
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Love Story Quote (Optional) */}
        <div className="text-center mt-12">
          <div className="max-w-2xl mx-auto">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <Heart className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <blockquote className="text-lg md:text-xl text-gray-600 italic leading-relaxed">
              &ldquo;Two hearts, one love, endless possibilities. Together we are stronger, together we are one.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center mt-6 space-x-4">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <Heart className="h-4 w-4 text-red-400" />
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center mt-12">
          <div className="flex items-center space-x-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: `${primaryColor}40` }}
            />
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `${primaryColor}70` }}
            />
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <Heart className="h-5 w-5 text-red-400 mx-2" />
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `${secondaryColor}70` }}
            />
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: `${secondaryColor}40` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}