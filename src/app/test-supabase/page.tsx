// File: einvite/src/app/test-supabase/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

// Hardcoded values for testing
const supabaseUrl = 'https://qjlcbryoqlcpxtowpijx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbGNicnlvcWxjcHh0b3dwaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjQyMTYsImV4cCI6MjA2OTA0MDIxNn0.La9ri24lBK9gw5k8FnYNDjPfLgfO4d1Ek_jHO0GpW68'

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [templatesCount, setTemplatesCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Test 1: Basic connection
        setConnectionStatus('✅ Supabase client created successfully')
        
        // Test 2: Check if we can access the database
        const { data, error: dbError } = await supabase
          .from('templates')
          .select('count', { count: 'exact', head: true })
        
        if (dbError) {
          throw new Error(`Database query failed: ${dbError.message}`)
        }
        
        setTemplatesCount(data?.length || 0)
        
        // Test 3: Try to list some templates
        const { data: templates, error: templatesError } = await supabase
          .from('templates')
          .select('id, name, category')
          .limit(5)
        
        if (templatesError) {
          throw new Error(`Templates query failed: ${templatesError.message}`)
        }
        
        console.log('Templates found:', templates)
        
        // Test 4: Test auth connection (just check if auth is accessible)
        await supabase.auth.getUser()
        
        setConnectionStatus('✅ All tests passed! Supabase is working correctly.')
        
      } catch (err) {
        console.error('Supabase test failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setConnectionStatus('❌ Connection failed')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Supabase Connection Test
          </h1>
          
          {/* Connection Status */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="font-mono text-sm">{connectionStatus}</p>
            </div>
          </div>

          {/* Configuration */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="space-y-2">
              <p><strong>URL:</strong> <span className="font-mono text-sm">{supabaseUrl}</span></p>
              <p><strong>Key (first 50 chars):</strong> <span className="font-mono text-sm">{supabaseKey.substring(0, 50)}...</span></p>
            </div>
          </div>

          {/* Database Tests */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Database Tests</h2>
            <div className="space-y-2">
              <p><strong>Templates table accessible:</strong> {templatesCount !== null ? '✅ Yes' : '❌ No'}</p>
              {templatesCount !== null && (
                <p><strong>Templates count:</strong> {templatesCount}</p>
              )}
            </div>
          </div>

          {/* Errors */}
          {error && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Error Details</h2>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-mono text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">What this test checks:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Can create Supabase client with your credentials</li>
              <li>• Can connect to your database</li>
              <li>• Can query the templates table</li>
              <li>• Can access authentication features</li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Rerun Test
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}