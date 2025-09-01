// File: src/components/dashboard/PhotoUploadQRGenerator.tsx

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { 
  Download, 
  X, 
  Loader, 
  Copy,
  Check,
  Camera,
  Share2,
  Image as ImageIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhotoUploadQRGeneratorProps {
  isOpen: boolean
  onClose: () => void
  uploadUrl: string
  bucketName: string
  bucketDescription?: string
  brideName?: string
  groomName?: string
}

interface QRCodeOptions {
  size: number
  foregroundColor: string
  backgroundColor: string
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  margin: number
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  size: 300,
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  errorCorrectionLevel: 'M',
  margin: 4,
}

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

export default function PhotoUploadQRGenerator({
  isOpen,
  onClose,
  uploadUrl,
  bucketName,
  bucketDescription,
  brideName,
  groomName
}: PhotoUploadQRGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [options, setOptions] = useState<QRCodeOptions>(DEFAULT_OPTIONS)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateQR = useCallback(async () => {
    if (!uploadUrl) return
    
    try {
      setIsGenerating(true)
      
      const canvas = canvasRef.current
      if (!canvas) return

      await QRCode.toCanvas(canvas, uploadUrl, {
        width: options.size,
        margin: options.margin,
        color: {
          dark: options.foregroundColor,
          light: options.backgroundColor,
        },
        errorCorrectionLevel: options.errorCorrectionLevel,
      })

      const dataUrl = canvas.toDataURL('image/png')
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [uploadUrl, options])

  useEffect(() => {
    if (isOpen && uploadUrl) {
      generateQR()
    }
  }, [isOpen, uploadUrl, generateQR])

  const downloadQR = () => {
    if (!qrDataUrl) return

    const coupleNames = brideName && groomName ? `${brideName}-${groomName}` : 'Wedding'
    const safeBucketName = bucketName.replace(/[^a-zA-Z0-9]/g, '-')
    const filename = `${coupleNames}-${safeBucketName}-PhotoUpload-QR.png`

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Photo Upload QR Code</h2>
              <p className="text-sm text-gray-600">{bucketName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* Bucket Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Camera className="h-5 w-5 mr-2 text-purple-600" />
                {bucketName}
              </CardTitle>
              {bucketDescription && (
                <p className="text-sm text-gray-600">{bucketDescription}</p>
              )}
              {brideName && groomName && (
                <p className="text-sm font-medium text-purple-600">
                  {brideName} & {groomName}
                </p>
              )}
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
                  {isGenerating ? (
                    <div className="flex items-center justify-center" style={{ width: options.size, height: options.size }}>
                      <Loader className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto"
                      style={{ display: qrDataUrl ? 'block' : 'none' }}
                    />
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={downloadQR} disabled={!qrDataUrl || isGenerating} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>

            {/* Customization Options */}
            <div className="space-y-4">
              <h3 className="font-semibold">Customize QR Code</h3>
              
              <div className="space-y-3">
                {/* Color Palette Presets */}
                <div>
                  <Label>Color Themes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {WEDDING_COLOR_PALETTE.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => setOptions({
                          ...options,
                          foregroundColor: palette.foreground,
                          backgroundColor: palette.background
                        })}
                        className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                        title={palette.name}
                      >
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
                        <span className="text-xs text-gray-600 truncate">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="size">Size (px)</Label>
                  <Input
                    id="size"
                    type="number"
                    min="100"
                    max="500"
                    value={options.size}
                    onChange={(e) => setOptions({...options, size: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="foreground">Foreground Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="foreground"
                      type="color"
                      value={options.foregroundColor}
                      onChange={(e) => setOptions({...options, foregroundColor: e.target.value})}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={options.foregroundColor}
                      onChange={(e) => setOptions({...options, foregroundColor: e.target.value})}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="background">Background Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="background"
                      type="color"
                      value={options.backgroundColor}
                      onChange={(e) => setOptions({...options, backgroundColor: e.target.value})}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={options.backgroundColor}
                      onChange={(e) => setOptions({...options, backgroundColor: e.target.value})}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="margin">Margin</Label>
                  <Input
                    id="margin"
                    type="number"
                    min="0"
                    max="10"
                    value={options.margin}
                    onChange={(e) => setOptions({...options, margin: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <Button onClick={generateQR} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Update QR Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Upload URL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upload URL</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex space-x-2">
                <Input
                  value={uploadUrl}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Share2 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-purple-800 mb-1">How to use:</p>
                  <ul className="text-purple-700 space-y-1">
                    <li>• Print the QR code and place it at your wedding</li>
                    <li>• Guests scan with their phone camera</li>
                    <li>• They'll be taken directly to the photo upload page</li>
                    <li>• Share the URL directly via messaging apps</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}