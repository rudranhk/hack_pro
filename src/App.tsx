import { Route, Routes } from 'react-router-dom'
import { HospitalShell } from '@/components/layout/HospitalShell'
import { Landing } from '@/pages/Landing'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OverviewPage } from '@/pages/hospital/OverviewPage'
import { RequestsPage } from '@/pages/hospital/RequestsPage'
import { NewRequestPage } from '@/pages/hospital/NewRequestPage'
import { RequestDetailPage } from '@/pages/hospital/RequestDetailPage'
import { DonorNetworkPage } from '@/pages/hospital/DonorNetworkPage'
import { LiveMatchesPage } from '@/pages/hospital/LiveMatchesPage'
import { BloodStockPage } from '@/pages/hospital/BloodStockPage'
import { AnalyticsPage } from '@/pages/hospital/AnalyticsPage'
import { ProfilePage } from '@/pages/hospital/ProfilePage'
import { HospitalPrivacyPage } from '@/pages/hospital/PrivacyPage'
import { DonorHomePage } from '@/pages/donor/DonorHomePage'
import { DonorAlertPage } from '@/pages/donor/DonorAlertPage'
import { DonorScreeningPage } from '@/pages/donor/DonorScreeningPage'
import { DonorStatusPage } from '@/pages/donor/DonorStatusPage'
import { DonorPrivacyPage } from '@/pages/donor/DonorPrivacyPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/hospital" element={<HospitalShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/new" element={<NewRequestPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="donors" element={<DonorNetworkPage />} />
        <Route path="matches" element={<LiveMatchesPage />} />
        <Route path="stock" element={<BloodStockPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="privacy" element={<HospitalPrivacyPage />} />
      </Route>

      <Route path="/donor" element={<DonorHomePage />} />
      <Route path="/donor/alert" element={<DonorAlertPage />} />
      <Route path="/donor/screening" element={<DonorScreeningPage />} />
      <Route path="/donor/status" element={<DonorStatusPage />} />
      <Route path="/donor/privacy" element={<DonorPrivacyPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
