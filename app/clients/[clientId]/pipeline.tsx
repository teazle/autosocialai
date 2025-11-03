'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Composer } from '@/components/composer';
import { ContentPipeline } from '@/lib/types/database';
import { Edit, CheckCircle, XCircle, RefreshCw, Trash2, Plus, Send, Sparkles, Image as ImageIcon, FileText, MessageSquare } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { useToast } from '@/components/ui/toast';
import { ImageViewer } from '@/components/image-viewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PipelineTabProps {
  clientId: string;
}

export default function PipelineTab({ clientId }: PipelineTabProps) {
  const [posts, setPosts] = useState<ContentPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ContentPipeline | undefined>();
  const [generating, setGenerating] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postToPublish, setPostToPublish] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchPosts();
  }, [clientId]);

  // Refresh posts when composer closes
  useEffect(() => {
    if (!showComposer) {
      fetchPosts();
    }
  }, [showComposer]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/content`);
      if (response.ok) {
        const data = await response.json();
        const fetchedPosts = data.content || [];
        console.log(`📥 Fetched ${fetchedPosts.length} posts`);
        
        // Filter out posts with invalid image URLs (function strings)
        const validPosts = fetchedPosts.map((p: any) => {
          const imageUrl = p.image_url;
          // Check if image_url is invalid (contains function code)
          if (imageUrl && typeof imageUrl === 'string' && 
              (imageUrl.includes('url() {') || 
               imageUrl.includes('function') ||
               imageUrl.includes('return new URL'))) {
            console.warn(`⚠️  Post ${p.id} has invalid image URL, clearing it`);
            return { ...p, image_url: null };
          }
          return p;
        });
        
        // Debug: Log posts with images
        const postsWithImages = validPosts.filter((p: any) => p.image_url);
        console.log(`📸 Posts with images: ${postsWithImages.length}/${validPosts.length}`);
        postsWithImages.forEach((p: any) => {
          console.log(`  - Post ${p.id}: ${p.image_url?.substring(0, 80)}...`);
        });
        
        setPosts(validPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoGeneratePost = async () => {
    setGenerating(true);
    try {
      console.log('🤖 Auto-generating post for client:', clientId);
      
      const response = await fetch('/api/generate-post-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate post');
      }

      console.log('✅ Post generated:', result);
      
      // Show success message with details
      let message = result.warning 
        ? `⚠️ ${result.warning}\n\nContent generated without image.\n\n`
        : `Post generated successfully!\n\n`;
      
      message += `Hook: "${result.post?.hook || 'N/A'}"\n` +
        `Validation Score: ${result.post?.validation_score || 'N/A'}/100\n` +
        `Status: ${result.post?.validation_status || 'N/A'}`;
      
      if (result.billing_note) {
        message += `\n\n💡 ${result.billing_note}`;
      }
      
      if (result.warning) {
        toast({ title: 'Post generated (no image)', description: result.warning });
      } else {
        toast({ title: 'Post generated', description: `Hook: ${result.post?.hook || 'N/A'}`, variant: 'success' });
      }
      
      // Refresh the posts list
      await fetchPosts();
    } catch (error: any) {
      console.error('❌ Error auto-generating post:', error);
      toast({ title: 'Auto-generate failed', description: error.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'generated':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredPosts = selectedStatus === 'all'
    ? posts
    : posts.filter(p => p.status === selectedStatus);

  if (loading) {
    return <div className="text-center py-8">Loading pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Pipeline</h2>
        <div className="flex gap-2">
          <Button 
            variant="default"
            onClick={autoGeneratePost}
            disabled={generating}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Auto Generate Post'}
          </Button>
          <Button onClick={() => {
            setSelectedPost(undefined);
            setShowComposer(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'generated', 'published', 'failed'].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            onClick={() => setSelectedStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              No posts found
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {post.image_url ? (
                    <div className="relative">
                      <img
                        src={post.image_url}
                        alt="Post"
                        key={post.image_url}
                        className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onError={(e) => {
                          console.error('❌ Failed to load image:', post.image_url);
                          console.error('Post ID:', post.id);
                          // Hide broken image
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('✅ Image loaded successfully:', post.image_url);
                        }}
                        onClick={() => {
                          // Find all posts with images and get current index
                          const postsWithImages = posts.filter(p => p.image_url);
                          const imageIndex = postsWithImages.findIndex(p => p.id === post.id);
                          setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
                          setViewingImage(post.image_url || null);
                        }}
                      />
                      {post.image_model && (
                        <div className="absolute bottom-1 right-1">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-black/70 text-white border-none">
                            {post.image_model.includes('ideogram') ? 'Ideogram' : post.image_model.includes('flux-1.1-pro') ? 'FLUX Pro' : post.image_model.includes('flux-schnell') ? 'FLUX' : post.image_model.split('/').pop()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(post.scheduled_at)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {post.status === 'generated' && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => {
                              setPostToPublish(post.id);
                              setPublishDialogOpen(true);
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedPost(post);
                            setShowComposer(true);
                          }}
                          title="Edit post"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {/* Regenerate Content Only */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/pipeline/${post.id}/regenerate-content`, {
                                method: 'POST',
                              });
                              const result = await response.json();
                              if (response.ok) {
                                fetchPosts(); // Refresh the list
                                toast({ title: 'Content regenerated', description: 'New text and captions have been generated.', variant: 'success' });
                              } else {
                                toast({ title: 'Regenerate failed', description: result.error || 'Could not regenerate content.', variant: 'destructive' });
                              }
                            } catch (error: any) {
                              console.error('Error regenerating content:', error);
                              toast({ title: 'Regenerate failed', description: error.message || 'Please try again later.', variant: 'destructive' });
                            }
                          }}
                          title="Regenerate content only (text/captions)"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        
                        {/* Regenerate Image Only */}
                        {post.image_url ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/pipeline/${post.id}/regenerate-image`, {
                                  method: 'POST',
                                });
                                const result = await response.json();
                                if (response.ok) {
                                  fetchPosts(); // Refresh the list
                                  toast({ title: 'Image regenerated', description: 'New image has been generated for this post.', variant: 'success' });
                                } else {
                                  if (result.paymentRequired) {
                                    toast({ title: 'Payment required', description: result.message || 'Replicate credits needed for image generation.', variant: 'warning' });
                                  } else {
                                    toast({ title: 'Image generation failed', description: result.error || 'Could not generate image.', variant: 'destructive' });
                                  }
                                }
                              } catch (error: any) {
                                console.error('Error regenerating image:', error);
                                toast({ title: 'Image generation failed', description: error.message || 'Please try again later.', variant: 'destructive' });
                              }
                            }}
                            title="Regenerate image only"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/pipeline/${post.id}/regenerate-image`, {
                                  method: 'POST',
                                });
                                const result = await response.json();
                                if (response.ok) {
                                  fetchPosts(); // Refresh the list
                                  toast({ title: 'Image generated', description: 'New image has been generated for this post.', variant: 'success' });
                                } else {
                                  if (result.paymentRequired) {
                                    toast({ title: 'Payment required', description: result.message || 'Replicate credits needed for image generation.', variant: 'warning' });
                                  } else {
                                    toast({ title: 'Image generation failed', description: result.error || 'Could not generate image.', variant: 'destructive' });
                                  }
                                }
                              } catch (error: any) {
                                console.error('Error regenerating image:', error);
                                toast({ title: 'Image generation failed', description: error.message || 'Please try again later.', variant: 'destructive' });
                              }
                            }}
                            title="Generate missing image"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {/* Regenerate Both */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/pipeline/${post.id}/regenerate`, {
                                method: 'POST',
                              });
                              if (response.ok) {
                                fetchPosts(); // Refresh the list
                                toast({ title: 'Regenerated', description: 'New content and image have been generated.', variant: 'success' });
                              } else {
                                toast({ title: 'Regenerate failed', description: 'Could not regenerate content and image.', variant: 'destructive' });
                              }
                            } catch (error) {
                              console.error('Error regenerating:', error);
                              toast({ title: 'Regenerate failed', description: 'Please try again later.', variant: 'destructive' });
                            }
                          }}
                          title="Regenerate both content and image"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setPostToDelete(post.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {post.hook && (
                      <p className="text-sm font-medium break-words">{post.hook}</p>
                    )}
                    
                    <div className="text-sm text-gray-600 space-y-1 break-words">
                      {post.caption_ig && (
                        <div>
                          <span className="font-medium">IG: </span>
                          <span className="break-words">{post.caption_ig}</span>
                        </div>
                      )}
                      {post.caption_fb && (
                        <div>
                          <span className="font-medium">FB: </span>
                          <span className="break-words">{post.caption_fb}</span>
                        </div>
                      )}
                      {post.caption_tt && (
                        <div>
                          <span className="font-medium">TT: </span>
                          <span className="break-words">{post.caption_tt}</span>
                        </div>
                      )}
                    </div>

                    {post.editor_comments && (
                      <div className="text-xs p-2 rounded mt-2 bg-blue-50 text-blue-800 border border-blue-200">
                        <span className="font-medium flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Editor Comments:
                        </span>
                        <div className="mt-1 whitespace-pre-wrap">{post.editor_comments}</div>
                      </div>
                    )}
                    {post.validation_status && (
                      <div className={`text-xs p-2 rounded mt-2 ${
                        post.validation_status === 'approved' 
                          ? 'bg-green-50 text-green-800' 
                          : post.validation_status === 'rejected'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-yellow-50 text-yellow-800'
                      }`}>
                        <span className="font-medium">Validation: </span>
                        {post.validation_status === 'approved' && '✓ Approved by AI'}
                        {post.validation_status === 'rejected' && '✗ Rejected by AI'}
                        {post.validation_status === 'manual_review' && '⚠ Needs Manual Review'}
                        {post.validation_status === 'pending' && '⏳ Pending Validation'}
                        {post.validation_issues && post.validation_issues.length > 0 && (
                          <div className="mt-1 text-xs">
                            Issues: {post.validation_issues.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                    {post.error_log && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                        Error: {post.error_log}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Composer
        open={showComposer}
        onOpenChange={setShowComposer}
        post={selectedPost}
        clientId={clientId}
      />

      <ImageViewer
        open={!!viewingImage}
        onOpenChange={(open) => {
          if (!open) {
            setViewingImage(null);
            setCurrentImageIndex(0);
          }
        }}
        imageUrl={viewingImage}
        alt="Post image"
        images={posts.filter(p => p.image_url).map(p => p.image_url!)}
        currentIndex={currentImageIndex}
        onIndexChange={(index) => {
          const postsWithImages = posts.filter(p => p.image_url);
          setCurrentImageIndex(index);
          setViewingImage(postsWithImages[index]?.image_url || null);
        }}
      />

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setPostToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and will permanently remove the post from your pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={async () => {
                if (postToDelete) {
                  try {
                    const response = await fetch(`/api/pipeline/${postToDelete}`, {
                      method: 'DELETE',
                    });
                    if (response.ok) {
                      fetchPosts(); // Refresh the list
                      toast({ title: 'Deleted', description: 'Post removed from pipeline.', variant: 'success' });
                    } else {
                      toast({ title: 'Delete failed', description: 'Could not remove post.', variant: 'destructive' });
                    }
                  } catch (error) {
                    console.error('Error deleting:', error);
                    toast({ title: 'Delete failed', description: 'Please try again later.', variant: 'destructive' });
                  } finally {
                    setDeleteDialogOpen(false);
                    setPostToDelete(null);
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Post Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={(open) => {
        setPublishDialogOpen(open);
        if (!open) setPostToPublish(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Post</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish this post to all connected social media platforms. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (postToPublish) {
                  try {
                    const response = await fetch(`/api/pipeline/${postToPublish}/publish`, {
                      method: 'POST',
                    });
                    if (response.ok) {
                      fetchPosts(); // Refresh the list
                      toast({ title: 'Post published', description: 'Your post was published successfully.', variant: 'success' });
                    } else {
                      const error = await response.json();
                      toast({ title: 'Failed to publish', description: error.error || 'An error occurred.', variant: 'destructive' });
                    }
                  } catch (error) {
                    console.error('Error publishing:', error);
                    toast({ title: 'Failed to publish', description: 'Please try again later.', variant: 'destructive' });
                  } finally {
                    setPublishDialogOpen(false);
                    setPostToPublish(null);
                  }
                }
              }}
            >
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

