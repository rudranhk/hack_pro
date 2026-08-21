import {
  LayoutDashboard,
  Siren,
  Users,
  Radar,
  Droplets,
  BarChart3,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const hospitalNavItems: NavItem[] = [
  { label: 'Overview', to: '/hospital', icon: LayoutDashboard, end: true },
  { label: 'Emergency Requests', to: '/hospital/requests', icon: Siren },
  { label: 'Donor Network', to: '/hospital/donors', icon: Users },
  { label: 'Live Matches', to: '/hospital/matches', icon: Radar },
  { label: 'Blood Stock', to: '/hospital/stock', icon: Droplets },
  { label: 'Analytics', to: '/hospital/analytics', icon: BarChart3 },
  { label: 'Hospital Profile', to: '/hospital/profile', icon: Building2 },
  { label: 'Privacy & Data', to: '/hospital/privacy', icon: ShieldCheck },
]
