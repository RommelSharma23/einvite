'use client'

import Link from 'next/link'
import { ArrowRight, Play, Star, Users, Heart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Hero() {
  return (
    <section id="home" className="pt-16 pb-20 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-6">
            <div className="text-center lg:text-left">
              {/* Badge */}
              <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Create Beautiful Wedding Websites
              </Badge>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Perfect
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {" "}Wedding{" "}
                </span>
                Website
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Create stunning, personalized wedding websites in minutes. Share your love story,
                manage RSVPs, collect photos, and make your special day unforgettable.
              </p>

              {/* Stats */}
              <div className="mt-8 flex flex-wrap gap-6 justify-center lg:justify-start">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">10,000+ Happy Couples</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">4.9/5 Rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">100% Love Guaranteed</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Start For Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 text-center lg:text-left">
                <p className="text-sm text-gray-500 mb-3">Trusted by couples worldwide</p>
                <div className="flex justify-center lg:justify-start space-x-8 opacity-60">
                  <div className="text-xs font-semibold text-gray-400">Featured in WeddingWire</div>
                  <div className="text-xs font-semibold text-gray-400">5⭐ Google Reviews</div>
                  <div className="text-xs font-semibold text-gray-400">Wedding Expert Choice</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Mock Website Preview */}
          <div className="mt-12 lg:mt-0 lg:col-span-6">
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-20 blur-3xl"></div>

              {/* Main mockup */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                {/* Browser Header */}
                <div className="bg-gray-100 px-4 py-3 flex items-center space-x-2 border-b">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 ml-4">
                    sarah-and-john.einvite.com
                  </div>
                </div>

                {/* Website Content */}
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Sarah & John</h3>
                    <p className="text-sm text-gray-600">December 15, 2024</p>
                  </div>

                  {/* Content sections */}
                  <div className="space-y-3">
                    <div className="h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-purple-700 font-medium">Beautiful Hero Section</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-blue-700">Our Story</span>
                      </div>
                      <div className="h-20 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-green-700">RSVP</span>
                      </div>
                    </div>
                    <div className="h-16 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-yellow-700">Event Details & Location</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-2 -left-2 bg-white rounded-lg shadow-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Live Website</span>
                </div>
              </div>

              <div className="absolute -bottom-2 -right-2 bg-white rounded-lg shadow-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-700">Mobile Ready</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}