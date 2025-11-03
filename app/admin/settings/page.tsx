'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReplicateModel } from '@/lib/ai/replicate';

interface SettingItem {
  key: string;
  value: string;
  description: string;
  updated_at?: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, SettingItem>>({});
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || {});
        setLocalSettings(Object.fromEntries(
          Object.entries(data.settings || {}).map(([key, setting]: [string, any]) => [key, setting.value])
        ));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: 'Error loading settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: localSettings }),
      });

      if (response.ok) {
        toast({ 
          title: 'Settings saved', 
          description: 'AI prompts have been updated successfully',
          variant: 'success'
        });
        setHasChanges(false);
        fetchSettings(); // Refresh to get updated timestamps
      } else {
        toast({ title: 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error saving settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all changes?')) {
      setLocalSettings(Object.fromEntries(
        Object.entries(settings).map(([key, setting]) => [key, setting.value])
      ));
      setHasChanges(false);
    }
  };

  const settingGroups = {
    'Content Generation': ['content_system_prompt', 'content_user_prompt_template'],
    'Image Generation': ['image_default_prompt_template', 'image_negative_prompt', 'image_quality_enhancements', 'replicate_model'],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Admin Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Prompt Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Customize how AI generates content and images</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            {/* Warning */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Warning:</strong> Changes to these prompts will affect all future content generation. 
                  Test changes carefully before deploying.
                </p>
              </CardContent>
            </Card>

            {/* Settings by group */}
            {Object.entries(settingGroups).map(([groupName, keys]) => (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle>{groupName}</CardTitle>
                  <CardDescription>Configure {groupName.toLowerCase()} AI prompts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {keys.map((key) => {
                    const setting = settings[key];
                    const value = localSettings[key] || '';
                    if (!setting) return null;

                    // Special handling for replicate_model (dropdown instead of textarea)
                    if (key === 'replicate_model') {
                      return (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className="text-base font-semibold">
                            {setting.description || 'Replicate Model for Image Generation'}
                          </Label>
                          <Select
                            value={value || 'ideogram-ai/ideogram-v3-turbo'}
                            onValueChange={(newValue) => handleChange(key, newValue)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select AI model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ideogram-ai/ideogram-v3-turbo">
                                Ideogram v3 Turbo - Best for text + humans (Recommended)
                              </SelectItem>
                              <SelectItem value="black-forest-labs/flux-1.1-pro">
                                FLUX 1.1 Pro - Best quality (slower, more expensive)
                              </SelectItem>
                              <SelectItem value="black-forest-labs/flux-schnell">
                                FLUX Schnell - Best value (fast, cheap, visuals only)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="mt-2 space-y-1 text-xs text-gray-600">
                            <p><strong>Ideogram v3 Turbo:</strong> Best for quotes, announcements, human faces. ~$0.004-0.01/image</p>
                            <p><strong>FLUX 1.1 Pro:</strong> Highest quality overall. ~$0.04/image</p>
                            <p><strong>FLUX Schnell:</strong> Fastest, cheapest. Best for visuals without text. ~$0.003/image</p>
                          </div>
                          {setting.updated_at && (
                            <p className="text-xs text-gray-500">
                              Last updated: {new Date(setting.updated_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-base font-semibold">
                          {setting.description || key}
                        </Label>
                        <Textarea
                          id={key}
                          value={value}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="font-mono text-sm min-h-[150px]"
                          placeholder={`Enter ${key}...`}
                        />
                        {setting.updated_at && (
                          <p className="text-xs text-gray-500">
                            Last updated: {new Date(setting.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

            {/* Placeholder Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Available Placeholders</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong className="text-blue-900">Content Generation:</strong>
                    <ul className="list-disc list-inside ml-2 text-blue-800 space-y-1">
                      <li><code className="bg-blue-100 px-1 rounded">brandName</code>, <code className="bg-blue-100 px-1 rounded">brandVoice</code></li>
                      <li><code className="bg-blue-100 px-1 rounded">voiceDescription</code>, <code className="bg-blue-100 px-1 rounded">companyDescription</code></li>
                      <li><code className="bg-blue-100 px-1 rounded">industry</code>, <code className="bg-blue-100 px-1 rounded">targetAudience</code></li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-blue-900">Image Generation:</strong>
                    <ul className="list-disc list-inside ml-2 text-blue-800 space-y-1">
                      <li><code className="bg-blue-100 px-1 rounded">hook</code>, <code className="bg-blue-100 px-1 rounded">brandName</code></li>
                      <li><code className="bg-blue-100 px-1 rounded">styleKeywords</code>, <code className="bg-blue-100 px-1 rounded">colors</code></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer with actions */}
        {!loading && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
