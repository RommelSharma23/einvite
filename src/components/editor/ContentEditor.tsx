// File: src/components/editor/ContentEditor.tsx

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Users, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from './ImageUpload'

interface HeroContent {
  brideName?: string
  groomName?: string
  weddingDate?: string
  welcomeMessage?: string
  heroImageUrl?: string
}

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

interface ContentData {
  hero?: HeroContent
  couple?: CoupleContent
}

interface ContentEditorProps {
  projectId: string
  content: ContentData
  onContentUpdate: (section: string, field: string, value: string) => void
  onNestedContentUpdate: (section: string, subsection: string, field: string, value: string) => void
}

export function ContentEditor({ projectId, content, onContentUpdate, onNestedContentUpdate }: ContentEditorProps) {
  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            <CardTitle className="text-base">Hero Section</CardTitle>
          </div>
          <CardDescription>
            Main banner with couple names and wedding date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hero Image Upload */}
          <div className="space-y-2">
            <Label>Hero Background Image</Label>
            <ImageUpload
              projectId={projectId}
              sectionType="hero_image"
              currentImageUrl={content.hero?.heroImageUrl}
              onImageUploaded={(imageUrl) => onContentUpdate('hero', 'heroImageUrl', imageUrl)}
              aspectRatio="landscape"
              maxSize={10}
              recommendedDimensions="1920x1080px"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bride-name">Bride Name</Label>
              <Input
                id="bride-name"
                value={content.hero?.brideName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onContentUpdate('hero', 'brideName', e.target.value)}
                placeholder="Enter bride's name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groom-name">Groom Name</Label>
              <Input
                id="groom-name"
                value={content.hero?.groomName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onContentUpdate('hero', 'groomName', e.target.value)}
                placeholder="Enter groom's name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wedding-date">Wedding Date</Label>
            <Input
              id="wedding-date"
              type="date"
              value={content.hero?.weddingDate || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onContentUpdate('hero', 'weddingDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              value={content.hero?.welcomeMessage || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onContentUpdate('hero', 'welcomeMessage', e.target.value)}
              placeholder="Welcome message for your guests"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Couple Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            <CardTitle className="text-base">Couple Information</CardTitle>
          </div>
          <CardDescription>
            Personal details about the bride and groom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bride Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-pink-600 flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Bride
            </h4>
            
            <div className="space-y-3">
              {/* Bride Photo */}
              <div className="space-y-2">
                <Label>Bride Photo</Label>
                <ImageUpload
                  projectId={projectId}
                  sectionType="bride_photo"
                  currentImageUrl={content.couple?.brideInfo?.photoUrl}
                  onImageUploaded={(imageUrl) => onNestedContentUpdate('couple', 'brideInfo', 'photoUrl', imageUrl)}
                  aspectRatio="portrait"
                  maxSize={5}
                  recommendedDimensions="800x800px"
                />
              </div>

              <Input
                value={content.couple?.brideInfo?.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedContentUpdate('couple', 'brideInfo', 'name', e.target.value)}
                placeholder="Bride's full name"
              />
              <Textarea
                value={content.couple?.brideInfo?.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNestedContentUpdate('couple', 'brideInfo', 'description', e.target.value)}
                placeholder="Tell something about the bride..."
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={content.couple?.brideInfo?.fatherName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedContentUpdate('couple', 'brideInfo', 'fatherName', e.target.value)}
                  placeholder="Father's name"
                />
                <Input
                  value={content.couple?.brideInfo?.motherName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedContentUpdate('couple', 'brideInfo', 'motherName', e.target.value)}
                  placeholder="Mother's name"
                />
              </div>
            </div>
          </div>

          {/* Groom Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-blue-600 flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Groom
            </h4>
            
            <div className="space-y-3">
              {/* Groom Photo */}
              <div className="space-y-2">
                <Label>Groom Photo</Label>
                <ImageUpload
                  projectId={projectId}
                  sectionType="groom_photo"
                  currentImageUrl={content.couple?.groomInfo?.photoUrl}
                  onImageUploaded={(imageUrl) => onNestedContentUpdate('couple', 'groomInfo', 'photoUrl', imageUrl)}
                  aspectRatio="portrait"
                  maxSize={5}
                />
              </div>

              <Input
                value={content.couple?.groomInfo?.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedContentUpdate('couple', 'groomInfo', 'name', e.target.value)}
                placeholder="Groom's full name"
              />
              <Textarea
                value={content.couple?.groomInfo?.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNestedContentUpdate('couple', 'groomInfo', 'description', e.target.value)}
                placeholder="Tell something about the groom..."
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={content.couple?.groomInfo?.fatherName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedContentUpdate('couple', 'groomInfo', 'fatherName', e.target.value)}
                  placeholder="Father's name"
                />
                <Input
                  value={content.couple?.groomInfo?.motherName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedContentUpdate('couple', 'groomInfo', 'motherName', e.target.value)}
                  placeholder="Mother's name"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}