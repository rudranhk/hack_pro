import { Link, useLocation } from 'react-router-dom'
import { MobileShell } from '@/components/layout/MobileShell'
import { HospitalPrivacyPage } from '@/pages/hospital/PrivacyPage'
export function DonorPrivacyPage() {
  const {search} = useLocation()
  return <MobileShell title="Privacy & data"><div className="space-y-3 p-4"><Link to={'/donor'+search} className="text-sm text-primary">← Donor inbox</Link><HospitalPrivacyPage/></div></MobileShell>
}
