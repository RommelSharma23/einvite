// src/components/website/RSVPForm.tsx
import React, { useState, useEffect } from 'react';
import { Heart, Users, Utensils, Music, MessageSquare, CheckCircle, Calendar, Send, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

interface RSVPFormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  attendanceStatus: 'attending' | 'not_attending' | 'maybe' | '';
  guestCount: number;
  dietaryRestrictions: string;
  danceSong: string;
  adviceNewlyweds: string;
  favoriteMemory: string;
}

interface RSVPConfig {
  id: string;
  projectId: string;
  isEnabled: boolean;
  title: string;
  subtitle: string;
  deadlineDate: string | null;
  confirmationMessage: string;
  danceSongEnabled: boolean;
  danceSongQuestion: string;
  adviceEnabled: boolean;
  adviceQuestion: string;
  memoryEnabled: boolean;
  memoryQuestion: string;
}

interface RSVPFormProps {
  projectId: string;
  supabase: SupabaseClient;
  onSubmitSuccess?: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    guestName: string;
    attendanceStatus: string;
    submittedAt: string;
  };
  error?: string;
}

const RSVPForm: React.FC<RSVPFormProps> = ({ 
  projectId, 
  supabase, 
  onSubmitSuccess,
  primaryColor = '#2563eb',
  secondaryColor = '#7c3aed'
}) => {
  const [config, setConfig] = useState<RSVPConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<RSVPFormData>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    attendanceStatus: '',
    guestCount: 1,
    dietaryRestrictions: '',
    danceSong: '',
    adviceNewlyweds: '',
    favoriteMemory: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ guestName: string; attendanceStatus: string } | null>(null);
  
  // Collapsible state
  const [isExpanded, setIsExpanded] = useState(false);

  // Load RSVP configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rsvp_config')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error) {
          console.error('Error loading RSVP config:', error);
          return;
        }

        if (data) {
          setConfig({
            id: data.id,
            projectId: data.project_id,
            isEnabled: data.is_enabled,
            title: data.title,
            subtitle: data.subtitle,
            deadlineDate: data.deadline_date,
            confirmationMessage: data.confirmation_message,
            danceSongEnabled: data.dance_song_enabled,
            danceSongQuestion: data.dance_song_question,
            adviceEnabled: data.advice_enabled,
            adviceQuestion: data.advice_question,
            memoryEnabled: data.memory_enabled,
            memoryQuestion: data.memory_question
          });
        }
      } catch (error) {
        console.error('Error loading RSVP config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [projectId, supabase]);

  const handleInputChange = (field: keyof RSVPFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    // Basic validation
    if (!formData.guestName.trim()) {
      setError('Please enter your name');
      setIsSubmitting(false);
      return;
    }

    if (!formData.attendanceStatus) {
      setError('Please select your attendance status');
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit RSVP via API endpoint
      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail || undefined,
          guestPhone: formData.guestPhone || undefined,
          attendanceStatus: formData.attendanceStatus,
          guestCount: formData.guestCount,
          dietaryRestrictions: formData.dietaryRestrictions || undefined,
          danceSong: formData.danceSong || undefined,
          adviceNewlyweds: formData.adviceNewlyweds || undefined,
          favoriteMemory: formData.favoriteMemory || undefined
        }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to submit RSVP');
      }

      // Success - store success data and show confirmation
      setSuccessData({
        guestName: result.data?.guestName || formData.guestName,
        attendanceStatus: result.data?.attendanceStatus || formData.attendanceStatus
      });
      setIsSubmitted(true);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('RSVP submission error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to submit RSVP. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeadlinePassed = () => {
    if (!config?.deadlineDate) return false;
    return new Date() > new Date(config.deadlineDate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading RSVP form...</span>
      </div>
    );
  }

  if (!config || !config.isEnabled) {
    return null; // Don't show anything if RSVP is disabled
  }

  if (isSubmitted && successData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          {config.confirmationMessage}
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Guest:</strong> {successData.guestName}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Status:</strong> {successData.attendanceStatus.replace('_', ' ')}
          </p>
        </div>
      </div>
    );
  }

  if (isDeadlinePassed()) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <Calendar className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">RSVP Closed</h3>
        <p className="text-gray-600">
          The RSVP deadline has passed. Please contact the couple directly if you need to respond.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Collapsible Header */}
      <div 
        className="bg-white rounded-t-lg shadow-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{config.title}</h2>
            <p className="text-gray-600 leading-relaxed">{config.subtitle}</p>
            {config.deadlineDate && (
              <p 
                className="text-sm mt-2 font-medium"
                style={{ color: secondaryColor }}
              >
                Please respond by {formatDate(config.deadlineDate)}
              </p>
            )}
          </div>
          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-gray-500" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-500" />
            )}
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Click to respond
            </span>
          </div>
        )}
      </div>

      {/* Collapsible Form Content */}
      {isExpanded && (
        <div className="bg-white rounded-b-lg shadow-lg">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Attendance Status */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Will you be attending the wedding? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'attending', label: 'Yes, I\'ll be there!', color: 'green', icon: '💃' },
                  { value: 'not_attending', label: 'Sorry, can\'t make it', color: 'red', icon: '😢' },
                  { value: 'maybe', label: 'Not sure yet', color: 'yellow', icon: '🤔' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleInputChange('attendanceStatus', option.value)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      formData.attendanceStatus === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-medium text-gray-800">{option.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name(s) of Guest(s) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guestName}
                  onChange={(e) => {
                    console.log('RSVP Guest Name onChange:', JSON.stringify(e.target.value))
                    handleInputChange('guestName', e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      console.log('Space key pressed in guest name')
                      e.preventDefault()
                      const input = e.target
                      const start = input.selectionStart
                      const end = input.selectionEnd
                      const newValue = formData.guestName.substring(0, start) + ' ' + formData.guestName.substring(end)
                      handleInputChange('guestName', newValue)
                      setTimeout(() => {
                        input.setSelectionRange(start + 1, start + 1)
                      }, 0)
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ whiteSpace: 'pre-wrap' }}
                  placeholder="John & Jane Smith"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests
                </label>
                <select
                  value={formData.guestCount}
                  onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.guestEmail}
                  onChange={(e) => {
                    console.log('RSVP Email onChange:', JSON.stringify(e.target.value))
                    handleInputChange('guestEmail', e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      console.log('Space key pressed in email')
                      e.preventDefault()
                      const input = e.target
                      const start = input.selectionStart
                      const end = input.selectionEnd
                      const newValue = formData.guestEmail.substring(0, start) + ' ' + formData.guestEmail.substring(end)
                      handleInputChange('guestEmail', newValue)
                      setTimeout(() => {
                        input.setSelectionRange(start + 1, start + 1)
                      }, 0)
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ whiteSpace: 'pre-wrap' }}
                  placeholder="john@example.com"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.guestPhone}
                  onChange={(e) => {
                    console.log('RSVP Phone onChange:', JSON.stringify(e.target.value))
                    handleInputChange('guestPhone', e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      console.log('Space key pressed in phone')
                      e.preventDefault()
                      const input = e.target
                      const start = input.selectionStart
                      const end = input.selectionEnd
                      const newValue = formData.guestPhone.substring(0, start) + ' ' + formData.guestPhone.substring(end)
                      handleInputChange('guestPhone', newValue)
                      setTimeout(() => {
                        input.setSelectionRange(start + 1, start + 1)
                      }, 0)
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ whiteSpace: 'pre-wrap' }}
                  placeholder="+91 9876543210"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>
            </div>

            {/* Meal Preference - Reduced Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Utensils className="w-4 h-4 inline mr-1" />
                Meal Preference / Dietary Restrictions
              </label>
              <input
                type="text"
                value={formData.dietaryRestrictions}
                onChange={(e) => {
                  console.log('RSVP Dietary onChange:', JSON.stringify(e.target.value))
                  handleInputChange('dietaryRestrictions', e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    console.log('Space key pressed in dietary restrictions')
                    e.preventDefault()
                    const input = e.target
                    const start = input.selectionStart
                    const end = input.selectionEnd
                    const newValue = formData.dietaryRestrictions.substring(0, start) + ' ' + formData.dietaryRestrictions.substring(end)
                    handleInputChange('dietaryRestrictions', newValue)
                    setTimeout(() => {
                      input.setSelectionRange(start + 1, start + 1)
                    }, 0)
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                style={{ whiteSpace: 'pre-wrap' }}
                placeholder="Vegetarian, vegan, gluten-free, allergies, etc."
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>

            {/* Fun Questions */}
            {(config.danceSongEnabled || config.adviceEnabled || config.memoryEnabled) && (
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Optional Fun Questions
                </h3>
                <div className="space-y-4">
                  {config.danceSongEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Music className="w-4 h-4 inline mr-1" />
                        {config.danceSongQuestion}
                      </label>
                      <input
                        type="text"
                        value={formData.danceSong}
                        onChange={(e) => {
                          console.log('RSVP Dance Song onChange:', JSON.stringify(e.target.value))
                          handleInputChange('danceSong', e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ') {
                            console.log('Space key pressed in dance song')
                            e.preventDefault()
                            const input = e.target
                            const start = input.selectionStart
                            const end = input.selectionEnd
                            const newValue = formData.danceSong.substring(0, start) + ' ' + formData.danceSong.substring(end)
                            handleInputChange('danceSong', newValue)
                            setTimeout(() => {
                              input.setSelectionRange(start + 1, start + 1)
                            }, 0)
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        style={{ whiteSpace: 'pre-wrap' }}
                        placeholder="Your favorite party song..."
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    </div>
                  )}

                  {config.adviceEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Heart className="w-4 h-4 inline mr-1" />
                        {config.adviceQuestion}
                      </label>
                      <textarea
                        value={formData.adviceNewlyweds}
                        onChange={(e) => {
                          console.log('RSVP Advice onChange:', JSON.stringify(e.target.value))
                          console.log('RSVP Advice length:', e.target.value.length)
                          handleInputChange('adviceNewlyweds', e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ') {
                            console.log('Space key pressed in RSVP advice')
                            console.log('Current cursor position:', e.target.selectionStart)
                            // Force prevent default handling and manually add space
                            e.preventDefault()
                            const textarea = e.target
                            const start = textarea.selectionStart
                            const end = textarea.selectionEnd
                            const newValue = formData.adviceNewlyweds.substring(0, start) + ' ' + formData.adviceNewlyweds.substring(end)
                            handleInputChange('adviceNewlyweds', newValue)
                            // Restore cursor position
                            setTimeout(() => {
                              textarea.setSelectionRange(start + 1, start + 1)
                            }, 0)
                          }
                        }}
                        onInput={(e) => {
                          console.log('RSVP Advice onInput:', JSON.stringify(e.target.value))
                        }}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Share your wisdom..."
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    </div>
                  )}

                  {config.memoryEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        {config.memoryQuestion}
                      </label>
                      <textarea
                        value={formData.favoriteMemory}
                        onChange={(e) => {
                          console.log('RSVP Memory onChange:', JSON.stringify(e.target.value))
                          console.log('RSVP Memory length:', e.target.value.length)
                          handleInputChange('favoriteMemory', e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ') {
                            console.log('Space key pressed in RSVP memory')
                            console.log('Current cursor position:', e.target.selectionStart)
                            e.preventDefault()
                            const textarea = e.target
                            const start = textarea.selectionStart
                            const end = textarea.selectionEnd
                            const newValue = formData.favoriteMemory.substring(0, start) + ' ' + formData.favoriteMemory.substring(end)
                            handleInputChange('favoriteMemory', newValue)
                            setTimeout(() => {
                              textarea.setSelectionRange(start + 1, start + 1)
                            }, 0)
                          }
                        }}
                        onInput={(e) => {
                          console.log('RSVP Memory onInput:', JSON.stringify(e.target.value))
                        }}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Tell us about a special moment..."
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                style={{ 
                  backgroundColor: primaryColor,
                  borderColor: primaryColor
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = secondaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
              >
                {isSubmitting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSVPForm;