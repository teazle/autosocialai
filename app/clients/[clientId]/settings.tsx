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

  useEffect(() => {
    fetchOnboardingLink();
  }, [client.id]);

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
          <CardDescription>
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
                className="font-mono text-sm"
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
            <p className="text-sm text-gray-500">This client was created before the onboarding system was implemented.</p>
          )}
        </CardContent>
      </Card>

      {/* Client Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Client Profile</CardTitle>
          <CardDescription>Update client information and settings</CardDescription>
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
          <CardDescription>Control automatic posting for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pause Auto-posting</p>
              <p className="text-sm text-gray-500">
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
          <CardTitle>Model Preferences</CardTitle>
          <CardDescription>Configure AI model settings (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Configure which AI models to use for content generation
          </div>
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
          <CardDescription>Irreversible actions</CardDescription>
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

