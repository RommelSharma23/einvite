// components/editor/RSVPEditor.tsx
import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, Music, Heart, Star, Lock, Save, Loader } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types';

interface RSVPConfig {
  id?: string;
  projectId: string;
  isEnabled: boolean;
  title: string;
  subtitle: string;
  deadlineDate: string;
  confirmationMessage: string;
  danceSongEnabled: boolean;
  danceSongQuestion: string;
  adviceEnabled: boolean;
  adviceQuestion: string;
  memoryEnabled: boolean;
  memoryQuestion: string;
}

type SupabaseClient = ReturnType<typeof createClient<Database>>;

interface RSVPEditorProps {
  projectId: string;
  subscriptionTier: string;
  onUpgrade: (tier: string) => void;
  supabase: SupabaseClient;
}

const RSVPEditor: React.FC<RSVPEditorProps> = ({ 
  projectId, 
  subscriptionTier,
  onUpgrade,
  supabase
}) => {
  const [config, setConfig] = useState<RSVPConfig>({
    projectId,
    isEnabled: true,
    title: 'RSVP',
    subtitle: 'Please let us know if you\'ll be joining us for our special day!',
    deadlineDate: '',
    confirmationMessage: 'Thank you for your RSVP! We can\'t wait to celebrate with you.',
    danceSongEnabled: true,
    danceSongQuestion: 'What song will definitely get you on the dance floor?',
    adviceEnabled: true,
    adviceQuestion: 'Any advice for the newlyweds?',
    memoryEnabled: true,
    memoryQuestion: 'What\'s your favorite memory with the couple?'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const isUnlocked = subscriptionTier === 'gold' || subscriptionTier === 'platinum';

  // Load existing RSVP config
  useEffect(() => {
    const loadRSVPConfig = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading RSVP config for project:', projectId);
        
        const { data, error } = await supabase
          .from('rsvp_config')
          .select('*')
          .eq('project_id', projectId)
          .single();

        console.log('📊 RSVP config loaded:', { data, error });

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading RSVP config:', error);
        } else if (data) {
          setConfig({
            id: data.id,
            projectId: data.project_id,
            isEnabled: data.is_enabled,
            title: data.title,
            subtitle: data.subtitle,
            deadlineDate: data.deadline_date || '',
            confirmationMessage: data.confirmation_message,
            danceSongEnabled: data.dance_song_enabled,
            danceSongQuestion: data.dance_song_question,
            adviceEnabled: data.advice_enabled,
            adviceQuestion: data.advice_question,
            memoryEnabled: data.memory_enabled,
            memoryQuestion: data.memory_question
          });
          console.log('✅ RSVP config loaded successfully');
        }
      } catch (error) {
        console.error('Error loading RSVP config:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadRSVPConfig();
    }
  }, [projectId, supabase]);

  // Fixed save function using upsert
  const saveConfig = async () => {
    if (!isUnlocked) return;

    try {
      setSaving(true);
      const configData = {
        project_id: projectId,
        is_enabled: config.isEnabled,
        title: config.title,
        subtitle: config.subtitle,
        deadline_date: config.deadlineDate || null,
        confirmation_message: config.confirmationMessage,
        dance_song_enabled: config.danceSongEnabled,
        dance_song_question: config.danceSongQuestion,
        advice_enabled: config.adviceEnabled,
        advice_question: config.adviceQuestion,
        memory_enabled: config.memoryEnabled,
        memory_question: config.memoryQuestion,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Saving RSVP config:', configData);

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('rsvp_config')
        .upsert(configData, {
          onConflict: 'project_id'
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      setSaveMessage('RSVP settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
      console.log('✅ RSVP config saved successfully');
      
    } catch (error) {
      console.error('Error saving RSVP config:', error);
      setSaveMessage('Error saving settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (field: keyof RSVPConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading RSVP settings...</span>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-purple-800 mb-2">RSVP Feature</h3>
          <p className="text-purple-600 mb-4">
            Collect guest responses with beautiful RSVP forms including attendance, meal preferences, and fun personalized questions.
          </p>
          <div className="bg-white p-4 rounded-lg mb-4 text-left">
            <h4 className="font-semibold text-gray-800 mb-2">Features included:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Attendance tracking (Yes/No/Maybe)</li>
              <li>• Guest count management</li>
              <li>• Meal preference collection</li>
              <li>• Fun personalized questions</li>
              <li>• Admin dashboard to view responses</li>
              <li>• Export guest list functionality</li>
            </ul>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onUpgrade('gold')}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              Upgrade to Gold
            </button>
            <button
              onClick={() => onUpgrade('platinum')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Upgrade to Platinum
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">RSVP Settings</h3>
            <p className="text-sm text-gray-600">Configure your RSVP form and questions</p>
          </div>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-3 rounded-lg ${
          saveMessage.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Enable/Disable RSVP */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-800">Enable RSVP Form</h4>
          <p className="text-sm text-gray-600">Allow guests to RSVP for your wedding</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.isEnabled}
            onChange={(e) => handleConfigChange('isEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {config.isEnabled && (
        <>
          {/* Title and Subtitle */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSVP Section Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="RSVP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle/Description
              </label>
              <textarea
                value={config.subtitle}
                onChange={(e) => handleConfigChange('subtitle', e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Please let us know if you'll be joining us for our special day!"
              />
            </div>
          </div>

          {/* Deadline Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              RSVP Deadline (Optional)
            </label>
            <input
              type="date"
              value={config.deadlineDate}
              onChange={(e) => handleConfigChange('deadlineDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for no deadline. Guests wont be able to RSVP after this date.
            </p>
          </div>

          {/* Confirmation Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Thank You Message
            </label>
            <textarea
              value={config.confirmationMessage}
              onChange={(e) => handleConfigChange('confirmationMessage', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Thank you for your RSVP! We can't wait to celebrate with you."
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be shown to guests after they submit their RSVP.
            </p>
          </div>

          {/* Optional Questions */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Optional Questions
            </h4>

            {/* Dance Song Question */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Music className="w-4 h-4 mr-2" />
                  Dance Song Question
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.danceSongEnabled}
                    onChange={(e) => handleConfigChange('danceSongEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {config.danceSongEnabled && (
                <input
                  type="text"
                  value={config.danceSongQuestion}
                  onChange={(e) => handleConfigChange('danceSongQuestion', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What song will definitely get you on the dance floor?"
                />
              )}
            </div>

            {/* Advice Question */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Heart className="w-4 h-4 mr-2" />
                  Advice Question
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.adviceEnabled}
                    onChange={(e) => handleConfigChange('adviceEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {config.adviceEnabled && (
                <input
                  type="text"
                  value={config.adviceQuestion}
                  onChange={(e) => handleConfigChange('adviceQuestion', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Any advice for the newlyweds?"
                />
              )}
            </div>

            {/* Memory Question */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Star className="w-4 h-4 mr-2" />
                  Memory Question
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.memoryEnabled}
                    onChange={(e) => handleConfigChange('memoryEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {config.memoryEnabled && (
                <input
                  type="text"
                  value={config.memoryQuestion}
                  onChange={(e) => handleConfigChange('memoryQuestion', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What's your favorite memory with the couple?"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RSVPEditor;