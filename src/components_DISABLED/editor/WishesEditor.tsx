// File: src/components/editor/WishesEditor.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Settings, 
  Users, 
  Grid3X3, 
  MoreHorizontal,
  Crown,
  Lock,
  CheckCircle,
  Clock,
  XCircle,
  Heart,
  Trash2,
  Star
} from 'lucide-react'

interface WishesConfig {
  id?: string
  is_enabled: boolean
  display_layout: 'grid' | 'masonry'
  welcome_message: string
  max_message_length: number
  require_email: boolean
}

interface GuestWish {
  id: string
  guest_name: string
  message: string
  guest_email?: string
  status: 'pending' | 'approved' | 'rejected'
  is_featured: boolean
  spam_score: number
  submitted_at: string
}

interface WishesEditorProps {
  projectId: string
  userTier: 'free' | 'silver' | 'gold' | 'platinum'
  onUpgrade: (targetTier: string) => void
}

const DEFAULT_CONFIG: WishesConfig = {
  is_enabled: true,
  display_layout: 'grid',
  welcome_message: 'Share your wishes and blessings for the happy couple!',
  max_message_length: 500,
  require_email: false
}

export function WishesEditor({ projectId, userTier, onUpgrade }: WishesEditorProps) {
  const [config, setConfig] = useState<WishesConfig>(DEFAULT_CONFIG)
  const [wishes, setWishes] = useState<GuestWish[]>([])
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')

  // Check if feature is available for user tier
  const isFeatureAvailable = useCallback(() => {
    return ['gold', 'platinum'].includes(userTier)
  }, [userTier])

  // Load wishes configuration
  const loadConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wishes_config')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading wishes config:', error)
        return
      }

      if (data) {
        setConfig({
          id: data.id,
          is_enabled: data.is_enabled,
          display_layout: data.display_layout,
          welcome_message: data.welcome_message,
          max_message_length: data.max_message_length,
          require_email: data.require_email
        })
      }
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }, [projectId])

  // Load wishes and stats
  const loadWishes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('guest_wishes')
        .select('*')
        .eq('project_id', projectId)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error loading wishes:', error)
        return
      }

      const wishesData = data || []
      setWishes(wishesData)

      // Calculate stats
      setStats({
        total: wishesData.length,
        approved: wishesData.filter(w => w.status === 'approved').length,
        pending: wishesData.filter(w => w.status === 'pending').length,
        rejected: wishesData.filter(w => w.status === 'rejected').length
      })

    } catch (error) {
      console.error('Error loading wishes:', error)
    }
  }, [projectId])

  // Initialize
  useEffect(() => {
    if (!isFeatureAvailable()) return
    
    const initializeData = async () => {
      setLoading(true)
      await Promise.all([loadConfig(), loadWishes()])
      setLoading(false)
    }

    initializeData()
  }, [loadConfig, loadWishes, isFeatureAvailable])

  // Save configuration
  const saveConfig = async () => {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('wishes_config')
        .upsert({
          project_id: projectId,
          is_enabled: config.is_enabled,
          display_layout: config.display_layout,
          welcome_message: config.welcome_message,
          max_message_length: config.max_message_length,
          require_email: config.require_email,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      console.log('Wishes configuration saved successfully')
    } catch (error) {
      console.error('Error saving wishes config:', error)
    } finally {
      setSaving(false)
    }
  }

  // Update wish status
  const updateWishStatus = async (wishId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('guest_wishes')
        .update({ status: newStatus })
        .eq('id', wishId)

      if (error) {
        throw error
      }

      // Update local state
      setWishes(prev => prev.map(wish => 
        wish.id === wishId ? { ...wish, status: newStatus } : wish
      ))

      // Update stats
      await loadWishes()
    } catch (error) {
      console.error('Error updating wish status:', error)
    }
  }

  // Toggle featured status
  const toggleFeatured = async (wishId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('guest_wishes')
        .update({ is_featured: !currentFeatured })
        .eq('id', wishId)

      if (error) {
        throw error
      }

      // Update local state
      setWishes(prev => prev.map(wish => 
        wish.id === wishId ? { ...wish, is_featured: !currentFeatured } : wish
      ))
    } catch (error) {
      console.error('Error toggling featured status:', error)
    }
  }

  // Delete wish
  const deleteWish = async (wishId: string) => {
    if (!confirm('Are you sure you want to delete this wish? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('guest_wishes')
        .delete()
        .eq('id', wishId)

      if (error) {
        throw error
      }

      // Update local state
      setWishes(prev => prev.filter(wish => wish.id !== wishId))
      await loadWishes() // Refresh stats
    } catch (error) {
      console.error('Error deleting wish:', error)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Feature not available
  if (!isFeatureAvailable()) {
    return (
      <div className="space-y-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900 mb-1">
                  Guest Wishes Feature Locked
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  Guest wishes are available for Gold and Platinum plans. Upgrade to let your guests share beautiful messages on your wedding website.
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-orange-700 font-medium">What you will get:</p>
                  <ul className="text-sm text-orange-600 space-y-1 ml-4">
                    <li>• Beautiful guest message display</li>
                    <li>• Auto-approve safe messages</li>
                    <li>• Spam protection & rate limiting</li>
                    <li>• Grid and masonry layout options</li>
                    <li>• Message moderation tools</li>
                  </ul>
                </div>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => onUpgrade('gold')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Gold - ₹999
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading wishes settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-purple-500" />
              <CardTitle className="text-base">Guest Wishes</CardTitle>
            </div>
            <Badge variant="gold">
              <Crown className="h-3 w-3 mr-1" />
              Gold Feature
            </Badge>
          </div>
          <CardDescription>
            Let your guests share beautiful messages and blessings on your wedding website
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Wishes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Moderation ({stats.pending})
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription>
                Customize how guest wishes work on your wedding website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enable-wishes"
                  checked={config.is_enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, is_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="enable-wishes" className="font-medium">
                  Enable Guest Wishes on your website
                </Label>
              </div>

              {config.is_enabled && (
                <>
                  {/* Welcome Message */}
                  <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      value={config.welcome_message}
                      onChange={(e) => setConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                      placeholder="Share your wishes and blessings for the happy couple!"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      This message appears above the wishes submission form
                    </p>
                  </div>

                  {/* Display Layout */}
                  <div className="space-y-3">
                    <Label>Display Layout</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, display_layout: 'grid' }))}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          config.display_layout === 'grid'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Grid3X3 className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">Grid Layout</div>
                        <div className="text-xs text-gray-500">Organized rows and columns</div>
                      </button>
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, display_layout: 'masonry' }))}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          config.display_layout === 'masonry'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <MoreHorizontal className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">Masonry Layout</div>
                        <div className="text-xs text-gray-500">Pinterest-style flowing layout</div>
                      </button>
                    </div>
                  </div>

                  {/* Message Length */}
                  <div className="space-y-2">
                    <Label htmlFor="max-length">Maximum Message Length</Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="max-length"
                        type="number"
                        min="100"
                        max="1000"
                        value={config.max_message_length}
                        onChange={(e) => setConfig(prev => ({ ...prev, max_message_length: parseInt(e.target.value) || 500 }))}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">characters</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Recommended: 300-500 characters for optimal display
                    </p>
                  </div>

                  {/* Require Email */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="require-email"
                      checked={config.require_email}
                      onChange={(e) => setConfig(prev => ({ ...prev, require_email: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="require-email">
                      Require email address from guests
                    </Label>
                  </div>
                </>
              )}

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          {wishes.length > 0 ? (
            <div className="space-y-4">
              {wishes.map((wish) => (
                <Card key={wish.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                              {wish.guest_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{wish.guest_name}</h4>
                              {wish.guest_email && (
                                <p className="text-xs text-gray-500">{wish.guest_email}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(wish.status)}
                            {wish.is_featured && (
                              <Badge variant="secondary">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {wish.spam_score > 0 && (
                              <Badge variant="warning">
                                Spam Score: {wish.spam_score}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {wish.message}
                        </p>

                        <p className="text-xs text-gray-500 mb-4">
                          Submitted on {formatDate(wish.submitted_at)}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          {wish.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateWishStatus(wish.id, 'approved')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateWishStatus(wish.id, 'rejected')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {wish.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleFeatured(wish.id, wish.is_featured)}
                            >
                              <Heart className="h-3 w-3 mr-1" />
                              {wish.is_featured ? 'Unfeature' : 'Feature'}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteWish(wish.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No wishes yet</h3>
                  <p className="text-gray-600">
                    Guest wishes will appear here once your website is published and guests start submitting messages.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}