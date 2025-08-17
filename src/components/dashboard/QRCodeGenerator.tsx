// File: src/components/dashboard/QRCodeGenerator.tsx

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { 
  Download, 
  Palette, 
  Crown, 
  X, 
  Loader, 
  Copy,
  Check,
  Smartphone,
  ArrowLeft,
  Share2,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface QRCodeGeneratorProps {
  isOpen: boolean
  onClose: () => void
  websiteUrl: string
  projectTitle: string
  userTier: 'free' | 'silver' | 'gold' | 'platinum'
  brideName?: string
  groomName?: string
}

interface QRCodeOptions {
  size: number
  foregroundColor: string
  backgroundColor: string
  logo?: File | null
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  margin: number
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  size: 300,
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  logo: null,
  errorCorrectionLevel: 'M',
  margin: 4
}

const PRESET_SIZES = [
  { label: 'Small', value: 200, description: 'Social media' },
  { label: 'Medium', value: 300, description: 'Digital sharing' },
  { label: 'Large', value: 400, description: 'Print cards' },
  { label: 'Extra Large', value: 500, description: 'Banners' }
]

const WEDDING_COLOR_PALETTE = [
  { name: 'Classic Black', foreground: '#000000', background: '#ffffff' },
  { name: 'Elegant Gold', foreground: '#d4af37', background: '#ffffff' },
  { name: 'Royal Blue', foreground: '#1e40af', background: '#ffffff' },
  { name: 'Rose Gold', foreground: '#e91e63', background: '#ffffff' },
  { name: 'Forest Green', foreground: '#22c55e', background: '#ffffff' },
  { name: 'Deep Purple', foreground: '#7c3aed', background: '#ffffff' },
  { name: 'Burgundy', foreground: '#991b1b', background: '#ffffff' },
  { name: 'Navy Blue', foreground: '#1e3a8a', background: '#ffffff' }
]

export default function QRCodeGenerator({
  isOpen,
  onClose,
  websiteUrl,
  projectTitle,
  userTier,
  brideName,
  groomName
}: QRCodeGeneratorProps) {
  const [options, setOptions] = useState<QRCodeOptions>(DEFAULT_OPTIONS)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [customForeground, setCustomForeground] = useState('')
  const [customBackground, setCustomBackground] = useState('')
  const [activeTab, setActiveTab] = useState('size')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  // Check if premium features are available
  const isPremiumTier = ['gold', 'platinum'].includes(userTier)
  const isFeatureAvailable = ['silver', 'gold', 'platinum'].includes(userTier)

  // Generate QR code for preview (without logo)
  const generateQRCodePreview = useCallback(async () => {
    try {
      setGenerating(true)
      
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel,
        type: 'image/png' as const,
        quality: 0.92,
        margin: options.margin,
        color: {
          dark: options.foregroundColor,
          light: options.backgroundColor
        },
        width: options.size
      }

      const canvas = canvasRef.current
      if (canvas) {
        // Clear canvas first
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        
        // Generate QR code without logo for preview
        await QRCode.toCanvas(canvas, websiteUrl, qrOptions)
        
        // Store preview without logo
        const previewDataUrl = canvas.toDataURL('image/png', 1.0)
        setQrDataUrl(previewDataUrl)
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setGenerating(false)
    }
  }, [websiteUrl, options])

  // Generate QR code with logo for download/share
  const generateQRCodeWithLogo = useCallback(async () => {
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel,
      type: 'image/png' as const,
      quality: 0.92,
      margin: options.margin,
      color: {
        dark: options.foregroundColor,
        light: options.backgroundColor
      },
      width: options.size
    }

    // Create temporary canvas for final QR code
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = options.size
    tempCanvas.height = options.size
    
    await QRCode.toCanvas(tempCanvas, websiteUrl, qrOptions)
    
    // Add logo if exists
    if (options.logo) {
      await addLogoToCanvas(tempCanvas, options.logo, options.size)
    }
    
    return tempCanvas.toDataURL('image/png', 1.0)
  }, [websiteUrl, options])

  // Helper function to add logo to canvas
  const addLogoToCanvas = (canvas: HTMLCanvasElement, logoFile: File, qrSize: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('No canvas context available')
        resolve() // Don't fail if logo can't be added
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Calculate logo size (20% of QR code size)
          const logoSize = Math.floor(qrSize * 0.2)
          const x = (qrSize - logoSize) / 2
          const y = (qrSize - logoSize) / 2

          // Draw white background circle
          ctx.save()
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2 + 4, 0, 2 * Math.PI)
          ctx.fill()
          ctx.restore()

          // Create circular clipping path for logo
          ctx.save()
          ctx.beginPath()
          ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, 2 * Math.PI)
          ctx.clip()

          // Draw logo
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, x, y, logoSize, logoSize)
          ctx.restore()

          // Add border around logo
          ctx.save()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, 2 * Math.PI)
          ctx.stroke()
          ctx.restore()

          resolve()
        } catch (error) {
          console.error('Error drawing logo:', error)
          resolve() // Don't fail if logo can't be added
        }
      }
      
      img.onerror = () => {
        console.error('Failed to load logo image')
        resolve() // Don't fail if logo can't be loaded
      }
      
      // Convert file to data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.onerror = () => {
        console.error('Failed to read logo file')
        resolve()
      }
      reader.readAsDataURL(logoFile)
    })
  }

  // Generate QR code preview when options change
  useEffect(() => {
    if (isOpen && websiteUrl) {
      const timer = setTimeout(() => {
        generateQRCodePreview()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, websiteUrl, generateQRCodePreview])

  // Handle size change
  const handleSizeChange = (size: number) => {
    setOptions(prev => ({ ...prev, size }))
  }

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB')
        return
      }
      
      setOptions(prev => ({ ...prev, logo: file }))
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove logo
  const removeLogo = () => {
    setOptions(prev => ({ ...prev, logo: null }))
    setLogoPreview('')
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleColorPaletteSelect = (palette: typeof WEDDING_COLOR_PALETTE[0]) => {
    setOptions(prev => ({
      ...prev,
      foregroundColor: palette.foreground,
      backgroundColor: palette.background
    }))
  }

  // Handle custom color
  const handleCustomColorApply = () => {
    const updates: Partial<QRCodeOptions> = {}
    if (customForeground && /^#[0-9A-F]{6}$/i.test(customForeground)) {
      updates.foregroundColor = customForeground
    }
    if (customBackground && /^#[0-9A-F]{6}$/i.test(customBackground)) {
      updates.backgroundColor = customBackground
    }
    if (Object.keys(updates).length > 0) {
      setOptions(prev => ({ ...prev, ...updates }))
    }
  }

  // Download QR code
  const downloadQRCode = async () => {
    try {
      const finalDataUrl = await generateQRCodeWithLogo()
      
      const link = document.createElement('a')
      const filename = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`
      
      link.href = finalDataUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
    }
  }

  // Share QR code
  const shareQRCode = async () => {
    try {
      const finalDataUrl = await generateQRCodeWithLogo()
      
      // Convert data URL to blob
      const response = await fetch(finalDataUrl)
      const blob = await response.blob()
      const file = new File([blob], `${projectTitle}-qr-code.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${projectTitle} - QR Code`,
          text: `Scan this QR code to visit ${brideName} & ${groomName}'s wedding website`,
          files: [file]
        })
      } else {
        // Fallback: copy URL to clipboard
        await copyUrl()
      }
    } catch (error) {
      console.error('Error sharing QR code:', error)
      // Fallback: copy URL to clipboard
      await copyUrl()
    }
  }

  // Copy URL to clipboard
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(websiteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  if (!isOpen) return null

  // Show upgrade prompt for non-eligible tiers
  if (!isFeatureAvailable) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <CardTitle>QR Code Generator</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Generate beautiful QR codes for your wedding website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upgrade to Silver</h3>
              <p className="text-gray-600 text-sm mb-4">
                QR code generation is available from Silver tier onwards
              </p>
              <Button className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-xl border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-500" />
            <CardTitle>QR Code Generator</CardTitle>
            <Badge variant="secondary">
              {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier
            </Badge>
          </div>
          <CardDescription>
            Generate and customize QR codes for {projectTitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(95vh-120px)] p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preview Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
                  {generating ? (
                    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                      <Loader className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col items-center">
                      <canvas 
                        ref={canvasRef} 
                        className="border border-gray-200 rounded max-w-full max-h-full"
                        style={{ 
                          width: `${Math.min(options.size, 400)}px`,
                          height: `${Math.min(options.size, 400)}px`
                        }}
                      />
                      
                      {(brideName || groomName) && (
                        <div className="text-center text-sm text-gray-700">
                          <p className="font-medium">
                            {brideName && groomName ? `${brideName} & ${groomName}` : brideName || groomName}
                          </p>
                          <p className="text-xs text-gray-500">Wedding Website</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Website URL</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={websiteUrl} 
                      readOnly 
                      className="text-sm bg-gray-50"
                    />
                    <Button variant="outline" size="sm" onClick={copyUrl}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={downloadQRCode} disabled={generating} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={shareQRCode}
                    disabled={generating}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Customization Section */}
            <div className="space-y-6">
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => {
                  if (value === 'style' && !isPremiumTier) {
                    return; // Don't switch to style tab for non-premium users
                  }
                  setActiveTab(value);
                }} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="size">Size</TabsTrigger>
                  <TabsTrigger value="logo">Logo</TabsTrigger>
                  <TabsTrigger 
                    value="style"
                    className={!isPremiumTier ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Colors {!isPremiumTier && <Crown className="h-3 w-3 ml-1" />}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="size" className="space-y-6">
                  {/* Preset Sizes */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Choose Size</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {PRESET_SIZES.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => handleSizeChange(preset.value)}
                          className={`p-4 border rounded-lg text-center transition-colors ${
                            options.size === preset.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{preset.label}</p>
                            <p className="text-xs text-gray-500">{preset.value}px</p>
                            <p className="text-xs text-gray-400">{preset.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logo" className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Logo Upload</Label>
                    <p className="text-xs text-gray-600 mb-4">
                      Add your logo to the center of the QR code. Recommended: square images, PNG format.
                    </p>
                    
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    {options.logo || logoPreview ? (
                      <div className="space-y-4">
                        {/* Logo Preview */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            {logoPreview && (
                              <div className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50">
                                <img 
                                  src={logoPreview} 
                                  alt="Logo preview" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {options.logo?.name || 'Logo uploaded'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {options.logo && `${(options.logo.size / 1024 / 1024).toFixed(2)} MB`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex-1"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Change Logo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={removeLogo}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Upload Logo</p>
                            <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Error Correction Level Info */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> Logo will only appear in downloaded or shared QR codes. 
                        The preview shows the QR code without logo for better scanning visibility.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">
                        <strong>Tip:</strong> Logos work best with square dimensions and transparent backgrounds. 
                        The logo will be automatically resized and centered.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {isPremiumTier && (
                  <TabsContent value="style" className="space-y-6">
                    {/* Color Presets */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Wedding Color Palette</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {WEDDING_COLOR_PALETTE.map((palette) => (
                          <button
                            key={palette.name}
                            onClick={() => handleColorPaletteSelect(palette)}
                            className={`p-2 border rounded-lg text-left transition-colors ${
                              options.foregroundColor === palette.foreground
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div 
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: palette.foreground }}
                                />
                                <div 
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: palette.background }}
                                />
                              </div>
                              <span className="text-xs font-medium">{palette.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Custom Colors</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            placeholder="#000000"
                            value={customForeground}
                            onChange={(e) => setCustomForeground(e.target.value)}
                            className="flex-1"
                          />
                          <Label className="text-sm">QR Color</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            placeholder="#ffffff"
                            value={customBackground}
                            onChange={(e) => setCustomBackground(e.target.value)}
                            className="flex-1"
                          />
                          <Label className="text-sm">Background</Label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCustomColorApply}
                          disabled={!customForeground && !customBackground}
                          className="w-full"
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          Apply Colors
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}

                {!isPremiumTier && activeTab === 'style' && (
                  <TabsContent value="style" className="space-y-6">
                    <div className="text-center py-8">
                      <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Premium Styling</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Unlock color customization with Gold or Platinum plans
                      </p>
                      <Button size="sm">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}