'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    brandVoice: 'Friendly' as 'Friendly' | 'Premium' | 'Bold',
    postsPerWeek: 1,
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would:
      // 1. Validate the onboarding token
      // 2. Save brand details
      // 3. Save content rules
      // 4. Proceed to next step
      
      console.log('Submitting:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep(step + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const connectSocial = async (platform: 'meta' | 'tiktok') => {
    const clientId = token.split('_')[0];
    const state = token;
    
    const url = `/api/auth/${platform}?state=${state}&client_id=${clientId}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Complete Your Onboarding
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 1: Brand Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Voice
                  </label>
                  <select
                    value={formData.brandVoice}
                    onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Friendly">Friendly</option>
                    <option value="Premium">Premium</option>
                    <option value="Bold">Bold</option>
                  </select>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.clientName}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 2: Connect Social Media</h2>
              <div className="space-y-4">
                <button
                  onClick={() => connectSocial('meta')}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Connect Facebook & Instagram
                </button>

                <button
                  onClick={() => connectSocial('tiktok')}
                  className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  Connect TikTok
                </button>

                <p className="text-sm text-gray-500 text-center">
                  Connect at least one platform to continue
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 3: Posting Schedule</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posts Per Week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.postsPerWeek}
                    onChange={(e) => setFormData({ ...formData, postsPerWeek: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Setup Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                Your account has been configured. Content will be automatically generated and posted according to your schedule.
              </p>
              <a
                href="/admin"
                className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

