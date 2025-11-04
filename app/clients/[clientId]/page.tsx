'use client';

import { use, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import { Client } from '@/lib/types/database';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

// Tab imports
import ConnectionsTab from './connections';
import BrandTab from './brand';
import ScheduleTab from './schedule';
import PipelineTab from './pipeline';
import AssetsTab from './assets';
import LogsTab from './logs';
import SettingsTab from './settings';

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const resolvedParams = use(params);
  const toast = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchClient();
    
    // Check for OAuth success/error messages in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('connected');
      const error = params.get('error');
      
      if (connected) {
        toast({ title: 'Connected to Meta', description: 'Your social media accounts have been successfully connected.', variant: 'success' });
        setRefreshKey(prev => prev + 1); // Trigger refresh
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } else if (error) {
        toast({ title: 'Connection failed', description: error, variant: 'destructive' });
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [resolvedParams.clientId]);

  const fetchClient = async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', resolvedParams.clientId)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-black">Client not found</p>
              <Link href="/admin">
                <Button variant="outline" className="mt-4">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-3 sm:mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                  client.status === 'active' ? 'bg-green-100 text-green-800' :
                  client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {client.status}
                </span>
                <span className="text-xs sm:text-sm text-black">
                  {client.timezone}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('settings')} className="w-full sm:w-auto">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue={activeTab}>
          <TabsList className="w-full justify-start mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="connections" className="text-xs sm:text-sm">Connections</TabsTrigger>
            <TabsTrigger value="brand" className="text-xs sm:text-sm">Brand & Rules</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm">Schedule</TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs sm:text-sm">Pipeline</TabsTrigger>
            <TabsTrigger value="assets" className="text-xs sm:text-sm">Assets</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs sm:text-sm">Activity & Logs</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            <ConnectionsTab key={refreshKey} clientId={client.id} />
          </TabsContent>

          <TabsContent value="brand">
            <BrandTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="assets">
            <AssetsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="logs">
            <LogsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab client={client} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

