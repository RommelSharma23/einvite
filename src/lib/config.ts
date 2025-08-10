// File: einvite/src/lib/config.ts

export const APP_CONFIG = {
  // App Identity
  name: 'Einvite',
  tagline: 'Create Beautiful Wedding Websites in Minutes',
  description: 'Design stunning, mobile-optimized wedding invitation websites with ease',
  version: '1.0.0',
  
  // Company Details
  company: {
    name: 'Einvite',
    email: 'support@einvite.com',
    phone: '+91-9876543210',
    address: 'Jaipur, Rajasthan, India',
    website: 'https://einvite.com'
  },

  // URLs
  urls: {
    app: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    marketing: 'https://einvite.com',
    support: 'https://support.einvite.com',
    blog: 'https://blog.einvite.com'
  },

  // Subscription Tiers
  subscriptionTiers: {
    free: {
      name: 'Free Trial',
      price: 0,
      currency: 'INR',
      duration: 'trial',
      description: 'Explore and customize templates',
      features: [
        'Template preview',
        'Full customization access',
        'No publishing capability'
      ],
      limitations: [
        'Cannot publish websites',
        'Preview only'
      ],
      popular: false
    },
    silver: {
      name: 'Silver',
      price: 499,
      currency: 'INR',
      duration: 'one-time',
      description: 'Perfect for simple wedding websites',
      features: [
        'All basic features',
        'Infographic event details',
        'Countdown timer',
        'Pre-wedding gallery',
        'Map location',
        'Background music',
        'Free QR code',
        'Dynamic subdomain (einvite.com/couple-names)',
        '15 days validity post-wedding'
      ],
      limitations: [],
      popular: false
    },
    gold: {
      name: 'Gold',
      price: 999,
      currency: 'INR',
      duration: 'one-time',
      description: 'Enhanced features for complete wedding management',
      features: [
        'Everything in Silver',
        'Custom domain support',
        'Guest wishes functionality',
        'Google/WhatsApp reminder feature',
        'Automated WhatsApp invite (up to 300 guests)',
        'Password protection',
        '365 days validity'
      ],
      limitations: [],
      popular: true
    },
    platinum: {
      name: 'Platinum',
      price: 1999,
      currency: 'INR',
      duration: 'one-time',
      description: 'Premium experience with all advanced features',
      features: [
        'Everything in Gold',
        'RSVP form functionality',
        'Free wedding filter (photo filter integration)',
        'Upload photos feature (post-wedding galleries)',
        'Filter integration',
        'Free filter QR tent cards (24 pieces)',
        'Priority support'
      ],
      limitations: [],
      popular: false
    }
  },

  // Website Sections (Template Structure)
  websiteSections: {
    hero: {
      name: 'Home',
      description: 'Main landing section with couple names and wedding date',
      required: true,
      order: 1
    },
    wedding: {
      name: 'Wedding Details',
      description: 'Ceremony information, date, time, and venue',
      required: true,
      order: 2
    },
    couple: {
      name: 'Meet the Couple',
      description: 'Bride and groom profiles and family information',
      required: true,
      order: 3
    },
    events: {
      name: 'Events Timeline',
      description: 'Multiple wedding events (Haldi, Mehendi, Sangeet, etc.)',
      required: true,
      order: 4
    },
    memories: {
      name: 'Memories',
      description: 'Pre-wedding photo galleries and videos',
      required: false,
      order: 5
    },
    venue: {
      name: 'Venue',
      description: 'Venue information with interactive map',
      required: true,
      order: 6
    },
    wishes: {
      name: 'Guest Wishes',
      description: 'Guest message submission and display',
      required: false,
      order: 7,
      tierRequired: 'gold'
    },
    rsvp: {
      name: 'RSVP',
      description: 'Guest response tracking and management',
      required: false,
      order: 8,
      tierRequired: 'platinum'
    }
  },

  // Template Categories
  templateCategories: {
    traditional: {
      name: 'Traditional',
      description: 'Classic designs with cultural elements',
      icon: '🏛️'
    },
    modern: {
      name: 'Modern',
      description: 'Contemporary and minimalist designs',
      icon: '✨'
    },
    rustic: {
      name: 'Rustic',
      description: 'Natural and vintage-inspired themes',
      icon: '🌿'
    },
    minimalist: {
      name: 'Minimalist',
      description: 'Clean and simple elegant designs',
      icon: '⚪'
    },
    indian: {
      name: 'Indian Traditional',
      description: 'Rich Indian cultural wedding themes',
      icon: '🪔'
    },
    destination: {
      name: 'Destination',
      description: 'Perfect for destination weddings',
      icon: '🏝️'
    }
  },

  // Feature Limits by Tier
  limits: {
    free: {
      projects: 1,
      storage: '10MB',
      guests: 0,
      validity: 0
    },
    silver: {
      projects: 1,
      storage: '100MB',
      guests: 100,
      validity: 15 // days post-wedding
    },
    gold: {
      projects: 3,
      storage: '500MB',
      guests: 300,
      validity: 365 // days
    },
    platinum: {
      projects: 10,
      storage: '2GB',
      guests: 1000,
      validity: 365 // days
    }
  },

  // Payment Configuration
  payment: {
    currency: 'INR',
    razorpay: {
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      currency: 'INR',
      supportedMethods: ['card', 'netbanking', 'upi', 'wallet']
    }
  },

  // Social Media Links
  socialMedia: {
    facebook: 'https://facebook.com/einvite',
    instagram: 'https://instagram.com/einvite',
    twitter: 'https://twitter.com/einvite',
    youtube: 'https://youtube.com/einvite'
  },

  // Contact Information
  contact: {
    supportEmail: 'support@einvite.com',
    salesEmail: 'sales@einvite.com',
    phone: '+91-9876543210',
    whatsapp: '+91-9876543210',
    address: {
      street: 'Tech Park, Malviya Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302017',
      country: 'India'
    }
  },

  // SEO Configuration
  seo: {
    defaultTitle: 'Einvite - Create Beautiful Wedding Websites',
    defaultDescription: 'Design stunning, mobile-optimized wedding invitation websites with ease. Choose from beautiful templates and customize everything.',
    keywords: ['wedding website', 'wedding invitation', 'digital invitation', 'wedding card', 'India'],
    ogImage: '/images/og-image.png'
  },

  // App Settings
  settings: {
    defaultTheme: 'light',
    enableAnalytics: true,
    enableNotifications: true,
    maintenanceMode: false,
    maxFileUploadSize: '10MB', // per file
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    supportedVideoFormats: ['mp4', 'webm'],
    subdomain: {
      pattern: /^[a-zA-Z0-9-]+$/,
      minLength: 3,
      maxLength: 50
    }
  }
} as const

// Helper functions
export const getTierFeatures = (tier: keyof typeof APP_CONFIG.subscriptionTiers) => {
  return APP_CONFIG.subscriptionTiers[tier]
}

export const getTierPrice = (tier: keyof typeof APP_CONFIG.subscriptionTiers) => {
  return APP_CONFIG.subscriptionTiers[tier].price
}

export const canAccessFeature = (userTier: string, requiredTier?: string) => {
  if (!requiredTier) return true
  
  const tierHierarchy = ['free', 'silver', 'gold', 'platinum']
  const userLevel = tierHierarchy.indexOf(userTier)
  const requiredLevel = tierHierarchy.indexOf(requiredTier)
  
  return userLevel >= requiredLevel
}

export const formatPrice = (price: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}