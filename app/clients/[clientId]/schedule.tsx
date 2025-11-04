'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserClient } from '@/lib/supabase/client';
import { Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ScheduleTabProps {
  clientId: string;
}

export default function ScheduleTab({ clientId }: ScheduleTabProps) {
  const [postsPerWeek, setPostsPerWeek] = useState(1);
  const [timezone, setTimezone] = useState('Asia/Singapore');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [postingTime, setPostingTime] = useState('10:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    fetchSchedule();
  }, [clientId]);

  const fetchSchedule = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: client } = await supabase
        .from('clients')
        .select('timezone')
        .eq('id', clientId)
        .single();

      if (client) {
        setTimezone(client.timezone);
      }

      // Fetch content rules
      const { data: rules } = await supabase
        .from('content_rules')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (rules) {
        setPostsPerWeek(rules.posts_per_week);
        setSelectedDays(rules.posting_days);
        setPostingTime(rules.posting_time);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // Update or insert content rules
      const { error } = await supabase
        .from('content_rules')
        .upsert({
          client_id: clientId,
          posts_per_week: postsPerWeek,
          posting_days: selectedDays,
          posting_time: postingTime,
        }, {
          onConflict: 'client_id'
        });

      if (error) throw error;

      // Update client timezone
      await supabase
        .from('clients')
        .update({ timezone })
        .eq('id', clientId);

      toast({ title: 'Schedule saved', description: 'Your posting preferences were updated.', variant: 'success' });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({ title: 'Failed to save', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const generateUpcoming = async () => {
    setGenerating(true);
    try {
      console.log('🚀 Starting post generation for client:', clientId);
      
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error:', errorData);
        toast({ title: 'Generation failed', description: errorData.error || 'Unknown error', variant: 'destructive' });
        return;
      }

      const result = await response.json();
      console.log('✅ Generation result:', result);
      toast({ title: 'Generation complete', description: result.message || 'Upcoming posts generated successfully!', variant: 'success' });
      
      // Refresh the schedule
      await fetchSchedule();
    } catch (error: any) {
      console.error('❌ Error generating posts:', error);
      toast({ title: 'Generation failed', description: error.message || 'Network error', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-black">Loading schedule...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Posting Frequency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="postsPerWeek">Posts per week</Label>
            <Input
              id="postsPerWeek"
              type="number"
              min="1"
              max="7"
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(parseInt(e.target.value) || 1)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Days Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <Button
                key={day.value}
                variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                onClick={() => toggleDay(day.value)}
                className="w-full"
              >
                {day.label[0]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time & Timezone */}
      <Card>
        <CardHeader>
          <CardTitle>Posting Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="postingTime">Preferred Time</Label>
            <Input
              id="postingTime"
              type="time"
              value={postingTime}
              onChange={(e) => setPostingTime(e.target.value)}
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
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-black">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming posts scheduled</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={generateUpcoming}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Next 4 Weeks'}
        </Button>
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  );
}

