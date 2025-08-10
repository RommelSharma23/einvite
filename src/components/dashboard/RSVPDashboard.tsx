// File: src/components/dashboard/RSVPDashboard.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Calendar, 
  Search, 
  Mail, 
  Phone, 
  Utensils, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  TrendingUp,
  UserCheck,
  UserX,
  RefreshCw,
  Crown,
  Lock
} from 'lucide-react'

type SupabaseClient = ReturnType<typeof createClient<Database>>

interface RSVPResponse {
  id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  attendance_status: 'attending' | 'not_attending' | 'maybe'
  guest_count: number
  dietary_restrictions: string | null
  message: string | null
  submitted_at: string
}

interface RSVPStats {
  total: number
  attending: number
  notAttending: number
  maybe: number
  totalGuests: number
  recentActivity: number
  averagePartySize: number
  responseRate: number
  withDietaryRestrictions: number
  withContactInfo: number
}

interface RSVPDashboardProps {
  projectId: string
  supabase: SupabaseClient
  userTier: 'free' | 'silver' | 'gold' | 'platinum'
  brideName?: string
  groomName?: string
  onUpgrade: () => void
}

export default function RSVPDashboard({ 
  projectId, 
  supabase, 
  userTier,
  brideName = 'Bride', 
  groomName = 'Groom',
  onUpgrade
}: RSVPDashboardProps) {
  const [responses, setResponses] = useState<RSVPResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<RSVPResponse[]>([])
  const [stats, setStats] = useState<RSVPStats>({
    total: 0,
    attending: 0,
    notAttending: 0,
    maybe: 0,
    totalGuests: 0,
    recentActivity: 0,
    averagePartySize: 0,
    responseRate: 0,
    withDietaryRestrictions: 0,
    withContactInfo: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Check if feature is available for user tier
  const isFeatureAvailable = useCallback(() => {
    return ['gold', 'platinum'].includes(userTier)
  }, [userTier])

  // Load RSVP responses
  const loadResponses = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('rsvp_responses')
        .select('*')
        .eq('project_id', projectId)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error loading RSVP responses:', error)
        return
      }

      if (data) {
        const formattedResponses: RSVPResponse[] = data.map(item => ({
          id: item.id,
          guest_name: item.guest_name,
          guest_email: item.guest_email,
          guest_phone: item.guest_phone,
          attendance_status: item.attendance_status as 'attending' | 'not_attending' | 'maybe',
          guest_count: item.guest_count || 1,
          dietary_restrictions: item.dietary_restrictions,
          message: item.message,
          submitted_at: item.submitted_at
        }))

        setResponses(formattedResponses)
        calculateStats(formattedResponses)
      }
    } catch (error) {
      console.error('Error loading RSVP responses:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId, supabase])

  // Calculate statistics
  const calculateStats = (responses: RSVPResponse[]) => {
    const total = responses.length
    const attending = responses.filter(r => r.attendance_status === 'attending').length
    const notAttending = responses.filter(r => r.attendance_status === 'not_attending').length
    const maybe = responses.filter(r => r.attendance_status === 'maybe').length
    const totalGuests = responses
      .filter(r => r.attendance_status === 'attending')
      .reduce((sum, r) => sum + r.guest_count, 0)
    
    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentActivity = responses.filter(r => 
      new Date(r.submitted_at) > sevenDaysAgo
    ).length

    const averagePartySize = attending > 0 ? totalGuests / attending : 0
    const responseRate = total > 0 ? (attending / total) * 100 : 0
    const withDietaryRestrictions = responses.filter(r => 
      r.dietary_restrictions && r.dietary_restrictions.trim()
    ).length
    const withContactInfo = responses.filter(r => 
      r.guest_email || r.guest_phone
    ).length

    setStats({
      total,
      attending,
      notAttending,
      maybe,
      totalGuests,
      recentActivity,
      averagePartySize,
      responseRate,
      withDietaryRestrictions,
      withContactInfo
    })
  }

  // Filter responses based on search and filter
  useEffect(() => {
    let filtered = responses

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(response => 
        response.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.guest_phone?.includes(searchTerm)
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(response => response.attendance_status === filterStatus)
    }

    setFilteredResponses(filtered)
  }, [responses, searchTerm, filterStatus])

  // Load data on mount
  useEffect(() => {
    loadResponses()
  }, [loadResponses])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending': return 'bg-green-100 text-green-800'
      case 'not_attending': return 'bg-red-100 text-red-800'
      case 'maybe': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attending': return <CheckCircle className="h-4 w-4" />
      case 'not_attending': return <XCircle className="h-4 w-4" />
      case 'maybe': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RSVP dashboard...</p>
        </div>
      </div>
    )
  }

  // Feature locked UI for non-premium tiers
  if (!isFeatureAvailable()) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  RSVP Management
                </h1>
                <p className="text-gray-600 mt-1">
                Manage responses for {brideName} & {groomName}&apos;s wedding
                </p>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Crown className="h-4 w-4 mr-1" />
                Gold Feature
              </Badge>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Lock className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Unlock RSVP Analytics
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Get detailed insights into your wedding RSVPs, including guest analytics, 
                  response tracking, and comprehensive management tools.
                </p>

                {/* Feature Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Response Tracking</h3>
                    <p className="text-sm text-gray-600">Track all RSVP responses in one place</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Analytics Dashboard</h3>
                    <p className="text-sm text-gray-600">Get insights and response statistics</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Guest Management</h3>
                    <p className="text-sm text-gray-600">Manage guest details and preferences</p>
                  </div>
                </div>

                <Button 
                  onClick={onUpgrade}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Gold Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                RSVP Management
              </h1>
              <p className="text-gray-600 mt-1">
               Manage responses for {brideName} & {groomName}&apos;s wedding
              </p>
            </div>
            <Button
              onClick={loadResponses}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attending</p>
                  <p className="text-2xl font-bold text-green-600">{stats.attending}</p>
                  <p className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats.attending / stats.total) * 100) : 0}%
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Not Attending</p>
                  <p className="text-2xl font-bold text-red-600">{stats.notAttending}</p>
                  <p className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats.notAttending / stats.total) * 100) : 0}%
                  </p>
                </div>
                <UserX className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maybe</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.maybe}</p>
                  <p className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats.maybe / stats.total) * 100) : 0}%
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Guests</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalGuests}</p>
                  <p className="text-xs text-gray-500">
                    Avg: {stats.averagePartySize.toFixed(1)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.recentActivity}</p>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses">All Responses ({responses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-medium">{stats.responseRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">With Dietary Restrictions</span>
                    <span className="font-medium">{stats.withDietaryRestrictions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Provided Contact Info</span>
                    <span className="font-medium">{stats.withContactInfo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Party Size</span>
                    <span className="font-medium">{stats.averagePartySize.toFixed(1)} guests</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest RSVP submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {responses.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {responses.slice(0, 5).map((response) => (
                        <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded-full ${getStatusColor(response.attendance_status)}`}>
                              {getStatusIcon(response.attendance_status)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{response.guest_name}</p>
                              <p className="text-sm text-gray-600">
                                {response.guest_count} guest{response.guest_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {formatDate(response.submitted_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No RSVP responses yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="attending">Attending</option>
                      <option value="not_attending">Not Attending</option>
                      <option value="maybe">Maybe</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responses List */}
            <div className="space-y-4">
              {filteredResponses.length > 0 ? (
                filteredResponses.map((response) => (
                  <Card key={response.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-medium text-gray-900 text-lg">{response.guest_name}</h3>
                            <Badge className={getStatusColor(response.attendance_status)}>
                              {response.attendance_status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            {response.guest_email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{response.guest_email}</span>
                              </div>
                            )}
                            {response.guest_phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{response.guest_phone}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {response.guest_count} guest{response.guest_count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{formatDate(response.submitted_at)}</span>
                            </div>
                          </div>

                          {response.dietary_restrictions && (
                            <div className="mt-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Utensils className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-600">Dietary:</span>
                              </div>
                              <p className="text-sm text-gray-700 ml-6">{response.dietary_restrictions}</p>
                            </div>
                          )}

                          {response.message && (
                            <div className="mt-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-600">Message:</span>
                              </div>
                             <p className="text-sm text-gray-700 ml-6 italic">&ldquo;{response.message}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
                      <p className="text-gray-600">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filter criteria'
                          : 'RSVP responses will appear here once guests start responding'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}