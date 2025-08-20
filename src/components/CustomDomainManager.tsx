// src/components/CustomDomainManager.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CustomDomainManagerProps {
  projectId: string
  currentDomain?: string
}

export default function CustomDomainManager({ projectId, currentDomain }: CustomDomainManagerProps) {
  const [domain, setDomain] = useState(currentDomain || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSaveDomain = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('wedding_projects')
        .update({ custom_domain: domain })
        .eq('id', projectId)

      if (error) throw error

      setMessage('Custom domain saved! Please follow the DNS setup instructions.')
    } catch (error) {
      setMessage('Error saving domain: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDomain = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('wedding_projects')
        .update({ custom_domain: null })
        .eq('id', projectId)

      if (error) throw error

      setDomain('')
      setMessage('Custom domain removed successfully.')
    } catch (error) {
      setMessage('Error removing domain: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Custom Domain Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Custom Domain (Gold/Platinum feature)
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase())}
            placeholder="yourdomain.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveDomain}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Domain'}
          </button>
          
          {currentDomain && (
            <button
              onClick={handleRemoveDomain}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Remove Domain
            </button>
          )}
        </div>

        {message && (
          <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        {domain && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">DNS Setup Instructions:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Go to your domain registrar (where you bought {domain})</li>
              <li>Change nameservers to Cloudflare nameservers</li>
              <li>In Cloudflare DNS settings, add:</li>
              <div className="ml-4 mt-2 font-mono text-xs bg-white p-2 rounded border">
                Type: CNAME<br/>
                Name: @<br/>
                Target: einvite.onrender.com<br/>
                Proxy: Enabled (Orange cloud)
              </div>
              <li>Wait 24-48 hours for DNS propagation</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}