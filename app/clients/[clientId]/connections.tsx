'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenHealthBadge } from '@/components/token-health-badge';
import { SocialAccount } from '@/lib/types/database';
import { Settings } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ConnectionsTabProps {
  clientId: string;
}

export default function ConnectionsTab({ clientId }: ConnectionsTabProps) {
  const toast = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, [clientId]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/connections`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (account: SocialAccount) => {
    try {
      // Test connection by trying to fetch profile/page info
      // This would call the platform API to verify token is valid
      toast({ title: 'Testing connection', description: `Checking ${account.platform} connection...` });
      // TODO: Implement actual test API call
      // On success:
      // toast({ title: 'Connection test passed', description: `${account.platform} is connected and working.`, variant: 'success' });
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({ title: 'Connection test failed', description: 'Could not verify the connection. Please try reconnecting.', variant: 'destructive' });
    }
  };

  const handleConnect = async (platform: 'facebook' | 'instagram' | 'tiktok') => {
    try {
      if (platform === 'facebook' || platform === 'instagram') {
        // Generate state parameter for OAuth security
        const state = `${clientId}_${platform}_${Date.now()}`;
        window.location.href = `/api/auth/meta?client_id=${clientId}&state=${state}`;
      } else if (platform === 'tiktok') {
        const state = `${clientId}_${platform}_${Date.now()}`;
        window.location.href = `/api/auth/tiktok?client_id=${clientId}&state=${state}`;
      }
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const getPlatformAccounts = (platform: 'facebook' | 'instagram' | 'tiktok') => {
    return accounts.filter(a => a.platform === platform);
  };

  const renderPlatformCard = (
    platform: 'facebook' | 'instagram' | 'tiktok',
    label: string,
    description: string
  ) => {
    const platformAccounts = getPlatformAccounts(platform);
    const connected = platformAccounts.length > 0;
    const account = platformAccounts[0];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{label}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {connected && account ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <TokenHealthBadge 
                    status={account.token_expires_at && new Date(account.token_expires_at) > new Date() ? 'valid' : 'expired'} 
                    expiresAt={account.token_expires_at}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(platform)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
              </div>
              
              {account.business_id && (
                <div>
                  <p className="text-xs text-gray-500">Business ID</p>
                  <p className="text-sm font-mono">{account.business_id}</p>
                </div>
              )}
              
              {account.page_id && (
                <div>
                  <p className="text-xs text-gray-500">Page ID</p>
                  <p className="text-sm font-mono">{account.page_id}</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleTestConnection(account)}
              >
                Test Connection
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">Not connected</p>
              <Button onClick={() => handleConnect(platform)}>
                Connect with {label}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading connections...</div>;
  }

  return (
    <div className="space-y-6">
      {renderPlatformCard('facebook', 'Facebook Page', 'Connect your Facebook Page')}
      {renderPlatformCard('instagram', 'Instagram Business', 'Connect your Instagram Business account')}
      {renderPlatformCard('tiktok', 'TikTok', 'Connect your TikTok account')}
    </div>
  );
}

