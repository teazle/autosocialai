import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

interface TokenHealthBadgeProps {
  status: 'valid' | 'expiring' | 'expired'
  expiresAt?: string
}

export function TokenHealthBadge({ status, expiresAt }: TokenHealthBadgeProps) {
  const config = {
    valid: {
      variant: 'success' as const,
      icon: CheckCircle,
      label: 'Valid',
      description: expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString()}` : 'Token is valid'
    },
    expiring: {
      variant: 'warning' as const,
      icon: Clock,
      label: 'Expiring Soon',
      description: expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString()}` : 'Token expires soon'
    },
    expired: {
      variant: 'destructive' as const,
      icon: AlertCircle,
      label: 'Expired',
      description: 'Token has expired'
    },
  }

  const { variant, icon: Icon, label, description } = config[status]

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  )
}

