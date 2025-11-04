'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { ClientForm } from '@/components/client-form';
import { CreateClientInput } from '@/lib/validations';

interface Client {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'paused' | 'suspended';
  created_at: string;
  brand_voice: string;
}

interface ContentPipeline {
  id: string;
  client_id: string;
  scheduled_at: string;
  status: 'pending' | 'generated' | 'published' | 'failed';
  hook: string;
  caption_ig: string;
  caption_fb: string;
  caption_tt: string;
  image_url: string;
  post_refs: any;
  created_at: string;
}

export default function AdminDashboard() {
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(false);
  const [upcomingPosts, setUpcomingPosts] = useState<ContentPipeline[]>([]);
  const [stats, setStats] = useState({
    activeClients: 0,
    postsThisWeek: 0,
    successRate: 0,
  });

  // Load clients on mount
  useEffect(() => {
    fetchClients();
    fetchUpcomingPosts();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
        setStats({
          activeClients: data.stats?.activeClients || 0,
          postsThisWeek: data.stats?.postsThisWeek || 0,
          successRate: data.stats?.successRate || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingPosts = async () => {
    try {
      // TODO: Fetch upcoming posts from API
      // For now, we'll use mock data or fetch from client content
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        const allPosts: ContentPipeline[] = [];
        
        // Fetch posts for each client
        for (const client of data.clients || []) {
          try {
            const contentResponse = await fetch(`/api/admin/clients/${client.id}/content`);
            if (contentResponse.ok) {
              const contentData = await contentResponse.json();
              allPosts.push(...(contentData.content || []));
            }
          } catch (error) {
            console.error(`Error fetching posts for client ${client.id}:`, error);
          }
        }

        // Sort by scheduled_at and take next 10
        const upcoming = allPosts
          .filter(post => new Date(post.scheduled_at) > new Date())
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 10);

        setUpcomingPosts(upcoming);
      }
    } catch (error) {
      console.error('Error fetching upcoming posts:', error);
    }
  };

  const handleCreateClient = async (data: CreateClientInput) => {
    try {
      const response = await fetch('/api/admin/clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast({ 
          title: 'Client created', 
          description: `Invite link: ${result.onboardingLink}`, 
          variant: 'success' 
        });
        fetchClients(); // Refresh list
      } else {
        toast({ title: 'Failed to create client', description: 'Could not create the client. Please try again.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({ title: 'Error creating client', description: 'An unexpected error occurred.', variant: 'destructive' });
      throw error;
    }
  };

  const handleToggleKillSwitch = async () => {
    try {
      const response = await fetch('/api/admin/killswitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !killSwitchEnabled }),
      });
      if (response.ok) {
        setKillSwitchEnabled(!killSwitchEnabled);
      }
    } catch (error) {
      console.error('Error toggling kill switch:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={handleToggleKillSwitch}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                killSwitchEnabled
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {killSwitchEnabled ? 'Kill Switch: ON' : 'Kill Switch: OFF'}
            </button>
            <a
              href="/admin/settings"
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
            >
              AI Settings
            </a>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Client
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-black">Active Clients</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.activeClients}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-black">Posts This Week</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.postsThisWeek}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-black">Success Rate</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.successRate}%</p>
          </div>
        </div>

        {/* Upcoming Posts */}
        {upcomingPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Posts</h2>
              <p className="text-sm text-black mt-1">Next 10 posts across all clients</p>
            </div>
            <div className="divide-y divide-gray-200">
              {upcomingPosts.map((post) => {
                const client = clients.find(c => c.id === post.client_id);
                return (
                  <div key={post.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{client?.name}</span>
                          <span className="text-xs text-black">
                            {new Date(post.scheduled_at).toLocaleString()}
                          </span>
                        </div>
                        {post.hook && (
                          <p className="text-sm text-black mt-1">{post.hook}</p>
                        )}
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clients List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-black">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="p-6 text-center text-black">
                No clients yet. Create your first client to get started.
              </div>
            ) : (
              clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Client Modal */}
      <ClientForm
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateClient}
      />
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<ContentPipeline[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const loadContent = async () => {
    if (expanded && content.length === 0) {
      setLoadingContent(true);
      try {
        const response = await fetch(`/api/admin/clients/${client.id}/content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || []);
        }
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoadingContent(false);
      }
    }
  };

  useEffect(() => {
    loadContent();
  }, [expanded]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <a 
            href={`/clients/${client.id}`}
            className="text-base sm:text-lg font-semibold text-gray-900 hover:text-indigo-600"
          >
            {client.name}
          </a>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(client.status)}`}>
              {client.status}
            </span>
            <span className="text-xs sm:text-sm text-black">
              {new Date(client.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm sm:text-base text-indigo-600 hover:text-indigo-700 font-medium w-full sm:w-auto text-left sm:text-right"
        >
          {expanded ? 'Hide Content' : 'View Content'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {loadingContent ? (
            <div className="text-center text-black py-4">Loading content...</div>
          ) : content.length === 0 ? (
            <div className="text-center text-black py-4">No content yet</div>
          ) : (
            content.map((item) => (
              <ContentItem key={item.id} content={item} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ContentItem({ content }: { content: ContentPipeline }) {
  const [showFullCaption, setShowFullCaption] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(content.status)}`}>
          {content.status}
        </span>
        <span className="text-xs sm:text-sm text-black">
          {new Date(content.scheduled_at).toLocaleString()}
        </span>
      </div>

      {content.hook && (
        <div>
          <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1">Hook</h4>
          <p className="text-xs sm:text-sm text-black">{content.hook}</p>
        </div>
      )}

      {content.image_url && (
        <div className="relative">
          <img
            src={content.image_url}
            key={content.image_url}
            alt="Generated content"
            className="w-full h-40 sm:h-48 object-cover rounded-lg"
          />
          {(content as any).image_model && (
            <div className="absolute bottom-2 right-2">
              <span className="px-2 py-1 rounded text-xs bg-black/70 text-white">
                {(content as any).image_model.includes('ideogram') ? 'Ideogram' : (content as any).image_model.includes('flux-1.1-pro') ? 'FLUX Pro' : (content as any).image_model.includes('flux-schnell') ? 'FLUX' : ((content as any).image_model.split('/').pop() || '')}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {content.caption_ig && (
          <CaptionSection
            platform="Instagram"
            caption={content.caption_ig}
            isExpanded={showFullCaption === 'ig'}
            onExpand={() => setShowFullCaption(showFullCaption === 'ig' ? null : 'ig')}
          />
        )}
        {content.caption_fb && (
          <CaptionSection
            platform="Facebook"
            caption={content.caption_fb}
            isExpanded={showFullCaption === 'fb'}
            onExpand={() => setShowFullCaption(showFullCaption === 'fb' ? null : 'fb')}
          />
        )}
        {content.caption_tt && (
          <CaptionSection
            platform="TikTok"
            caption={content.caption_tt}
            isExpanded={showFullCaption === 'tt'}
            onExpand={() => setShowFullCaption(showFullCaption === 'tt' ? null : 'tt')}
          />
        )}
      </div>
    </div>
  );
}

function CaptionSection({
  platform,
  caption,
  isExpanded,
  onExpand,
}: {
  platform: string;
  caption: string;
  isExpanded: boolean;
  onExpand: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">{platform}</span>
        <button
          onClick={onExpand}
          className="text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
      <p className="text-xs sm:text-sm text-gray-700">
        {isExpanded ? caption : `${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}`}
      </p>
    </div>
  );
}
