'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createBrowserClient } from '@/lib/supabase/client';
import { Client } from '@/lib/types/database';
import { Trash2, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface SettingsTabProps {
  client: Client;
}

export default function SettingsTab({ client }: SettingsTabProps) {
  const toast = useToast();
  const [clientName, setClientName] = useState(client.name);
  const [timezone, setTimezone] = useState(client.timezone);
  const [email, setEmail] = useState('');
  const [autoPaused, setAutoPaused] = useState(client.status === 'paused');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageModel, setImageModel] = useState('black-forest-labs/flux-1.1-pro');
  const [savingModel, setSavingModel] = useState(false);

  const IMAGE_MODELS = [
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro (Best for Text)' },
    { value: 'black-forest-labs/flux-schnell', label: 'Flux Schnell (Fast & Cheap)' },
    { value: 'ideogram-ai/ideogram-v3-turbo', label: 'Ideogram V3 Turbo (Good for Text)' },
    { value: 'recraft-ai/recraft-v3', label: 'Recraft V3 (Design & Text)' },
  ];

  useEffect(() => {
    fetchOnboardingLink();
    fetchImageModel();
  }, [client.id]);

  const fetchImageModel = async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('brand_assets')
        .select('replicate_model')
        .eq('client_id', client.id)
        .maybeSingle();

      if (data?.replicate_model) {
        setImageModel(data.replicate_model);
      }
    } catch (error) {
      console.error('Error fetching image model:', error);
    }
  };

  const handleSaveModel = async () => {
    setSavingModel(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('brand_assets')
        .upsert({
          client_id: client.id,
          replicate_model: imageModel,
        }, {
          onConflict: 'client_id'
        });

      if (error) throw error;

      toast({
        title: 'Model saved',
        description: `Image generation will now use ${IMAGE_MODELS.find(m => m.value === imageModel)?.label || imageModel}.`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Error saving model:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not save model preference.',
        variant: 'destructive'
      });
    } finally {
      setSavingModel(false);
    }
  };

  const fetchOnboardingLink = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${client.id}/onboarding`);
      if (response.ok) {
        const data = await response.json();
        setOnboardingLink(data.onboardingLink);
      } else if (response.status === 404) {
        // Client doesn't have an onboarding token yet (older clients)
        setOnboardingLink('');
      }
    } catch (error) {
      console.error('Error fetching onboarding link:', error);
      setOnboardingLink('');
    }
  };

  const generateOnboardingLink = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/admin/clients/${client.id}/onboarding`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingLink(data.onboardingLink);
        toast({
          title: 'Onboarding link generated',
          description: 'The onboarding link has been created successfully.',
          variant: 'success'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Failed to generate link',
          description: error.error || 'Could not generate onboarding link.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error generating onboarding link:', error);
      toast({
        title: 'Failed to generate link',
        description: 'An error occurred while generating the onboarding link.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (onboardingLink) {
      await navigator.clipboard.writeText(onboardingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    try {
      const supabase = createBrowserClient();

      // Update client info
      const { error } = await supabase
        .from('clients')
        .update({
          name: clientName,
          timezone,
          status: autoPaused ? 'paused' : 'active',
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({ title: 'Settings saved', description: 'Your client settings have been updated successfully.', variant: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Failed to save', description: 'Could not save settings. Please try again.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    // TODO: Delete client
    console.log('Deleting client...');
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Onboarding Link */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Client Onboarding Link</CardTitle>
          <CardDescription className="text-black">
            {onboardingLink
              ? 'Send this link to the client to complete their setup'
              : 'No onboarding link available. Create a new client to get an invite link.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onboardingLink ? (
            <div className="flex gap-2">
              <Input
                value={onboardingLink}
                readOnly
                className="font-mono text-sm text-black"
              />
              <Button
                variant={copied ? 'default' : 'outline'}
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-black">This client doesn't have an onboarding link yet. Generate one to share with the client.</p>
              <Button
                onClick={generateOnboardingLink}
                disabled={generating}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate Onboarding Link'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Client Profile</CardTitle>
          <CardDescription className="text-black">Update client information and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Contact Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alerts@example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-posting Control */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-posting</CardTitle>
          <CardDescription className="text-black">Control automatic posting for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pause Auto-posting</p>
              <p className="text-sm text-black">
                Stop automatic posting for this client
              </p>
            </div>
            <Button
              variant={autoPaused ? 'default' : 'outline'}
              onClick={() => setAutoPaused(!autoPaused)}
            >
              {autoPaused ? 'Paused' : 'Active'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Image Generation Model</CardTitle>
          <CardDescription className="text-black">Choose the AI model used to generate images for this client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="imageModel">AI Model</Label>
            <select
              id="imageModel"
              value={imageModel}
              onChange={(e) => setImageModel(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md bg-white"
            >
              {IMAGE_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-black mt-2">
              <strong>Flux 1.1 Pro</strong>: Best for accurate text rendering. <strong>Ideogram</strong>: Good for stylized visuals. <strong>Recraft</strong>: Excellent for design-focused content.
            </p>
          </div>
          <Button onClick={handleSaveModel} disabled={savingModel}>
            {savingModel ? 'Saving...' : 'Save Model'}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
          <CardDescription className="text-black">Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Client
            </Button>
          </div>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Client</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this client? This will also delete all associated content, posts, and connections. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

