'use client'

import {
  Heart,
  Calendar,
  MapPin,
  Camera,
  Mail,
  Palette,
  Smartphone,
  Globe,
  Users,
  Gift,
  Music,
  MessageCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Heart,
    title: "Beautiful Templates",
    description: "Choose from stunning, professionally designed templates that perfectly capture your love story.",
    color: "from-purple-600 to-purple-700"
  },
  {
    icon: Calendar,
    title: "RSVP Management",
    description: "Effortlessly collect and manage guest responses with our intuitive RSVP system.",
    color: "from-pink-600 to-pink-700"
  },
  {
    icon: Camera,
    title: "Photo Sharing",
    description: "Let guests upload and share photos from your special day with QR code photo sharing.",
    color: "from-blue-600 to-blue-700"
  },
  {
    icon: MapPin,
    title: "Interactive Maps",
    description: "Guide your guests with beautiful interactive maps and venue information.",
    color: "from-amber-600 to-amber-700"
  },
  {
    icon: Palette,
    title: "Easy Customization",
    description: "Personalize every detail with our drag-and-drop editor. No coding required!",
    color: "from-purple-600 to-purple-700"
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Your website looks perfect on all devices - mobile, tablet, and desktop.",
    color: "from-pink-600 to-pink-700"
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Get a personalized web address like yournames.ecardvite.com or use your own domain.",
    color: "from-blue-600 to-blue-700"
  },
  {
    icon: Music,
    title: "Background Music",
    description: "Set the perfect mood with background music that plays when guests visit your site.",
    color: "from-amber-600 to-amber-700"
  },
  {
    icon: Users,
    title: "Guest List Management",
    description: "Organize your guest list, track responses, and send updates effortlessly.",
    color: "from-purple-600 to-purple-700"
  },
  {
    icon: Gift,
    title: "Gift Registry",
    description: "Share your wishlist and make it easy for guests to find the perfect gift.",
    color: "from-pink-600 to-pink-700"
  },
  {
    icon: MessageCircle,
    title: "Guest Messages",
    description: "Collect heartfelt wishes and messages from your loved ones in a beautiful guestbook.",
    color: "from-blue-600 to-blue-700"
  },
  {
    icon: Mail,
    title: "Digital Invitations",
    description: "Send beautiful digital invitations and save the dates via email or social media.",
    color: "from-amber-600 to-amber-700"
  }
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need for Your
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {" "}Perfect Wedding
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From stunning design to powerful features, we&apos;ve got everything covered
            to make your wedding website as special as your love story.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Create Your Dream Wedding Website?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of happy couples who have already created their perfect wedding websites with ECardVite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                Start Building Now
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                View Live Examples
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}