// File: src/components/editor/EditorHeader.tsx

import { ArrowLeft, Save, Eye, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditorHeaderProps {
  project: {
    title: string
    is_published: boolean
    template?: { name: string }
  }
  saving: boolean
  onBack: () => void
  onSave: () => void
  onPreview: () => void
  onPublish: () => void
}

export function EditorHeader({ 
  project, 
  saving, 
  onBack, 
  onSave, 
  onPreview, 
  onPublish 
}: EditorHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
              <p className="text-sm text-gray-500">
                Template: {project.template?.name || 'Custom'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              size="sm" 
              onClick={onSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              size="sm" 
              onClick={onPublish}
              className="bg-green-600 hover:bg-green-700"
            >
              <Heart className="h-4 w-4 mr-2" />
              {project.is_published ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}