import { Badge } from "@/components/ui/badge"
import { Facebook, Instagram, Music } from "lucide-react"

interface PlatformBadgeProps {
  platform: 'facebook' | 'instagram' | 'tiktok'
  connected?: boolean
  className?: string
}

export function PlatformBadge({ platform, connected = true, className }: PlatformBadgeProps) {
  const config = {
    facebook: { 
      icon: Facebook, 
      label: 'Facebook',
      color: 'bg-blue-100 text-blue-800' as const
    },
    instagram: { 
      icon: Instagram, 
      label: 'Instagram',
      color: 'bg-purple-100 text-purple-800' as const
    },
    tiktok: { 
      icon: Music, 
      label: 'TikTok',
      color: 'bg-pink-100 text-pink-800' as const
    },
  }

  const { icon: Icon, label, color } = config[platform]

  return (
    <Badge 
      variant="outline" 
      className={`${color} flex items-center gap-1 ${!connected ? 'opacity-50' : ''} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  )
}

