'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@/lib/supabase/client';
import { Download, Filter } from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/date';

interface LogEntry {
  id: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  created_at: string;
}

interface LogsTabProps {
  clientId: string;
}

export default function LogsTab({ clientId }: LogsTabProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [clientId]);

  const fetchLogs = async () => {
    try {
      const supabase = createBrowserClient();
      
      // Fetch post logs
      const { data: logs } = await supabase
        .from('post_logs')
        .select('*, content_pipeline(*)')
        .eq('content_pipeline.client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logs) {
        // Map logs to LogEntry format
        const logEntries = logs.map((log: any) => ({
          id: log.id,
          action: `Published to ${log.platform}`,
          status: 'success',
          message: `Post published to ${log.platform} with ID: ${log.post_id}`,
          created_at: log.created_at,
        }));
        setLogs(logEntries);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'destructive';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.status === filter);

  const exportLogs = () => {
    // TODO: Export logs to CSV
    console.log('Exporting logs...');
  };

  if (loading) {
    return <div className="text-center py-8">Loading logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Activity Logs</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFilter(filter === 'all' ? 'error' : 'all')}>
            <Filter className="w-4 h-4 mr-2" />
            {filter === 'all' ? 'Show Errors Only' : 'Show All'}
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              No activity yet
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <span className="text-sm font-medium">{log.action}</span>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

