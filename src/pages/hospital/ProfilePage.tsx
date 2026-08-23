import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Download, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useToast } from '@/components/ui/Toast'
import { SettingToggleRow } from '@/components/hospital/profile/SettingToggleRow'
import { coordinationSettings, mockHospitalProfile, type CoordinationSetting } from '@/lib/mockHospitalProfile'

export function ProfilePage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Record<CoordinationSetting['key'], boolean>>(
    Object.fromEntries(coordinationSettings.map((s) => [s.key, s.defaultOn])) as Record<
      CoordinationSetting['key'],
      boolean
    >
  )
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      toast({ title: 'Settings saved', description: 'Emergency coordination preferences updated.', tone: 'success' })
    }, 500)
  }

  const handleDataExport = () => {
    toast({
      title: 'Data export — demo feature',
      description: 'Not wired up yet in this prototype. A real export would generate a file here.',
      tone: 'neutral',
    })
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Hospital Profile</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">
            Manage your hospital identity and emergency coordination settings.
          </p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 rounded-full border border-success-border bg-success-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
          <ShieldCheck size={13} />
          Verified hospital
        </span>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-white">
            <Building2 size={20} strokeWidth={1.75} />
          </span>
          <h2 className="text-[16px] font-semibold text-ink">{mockHospitalProfile.name}</h2>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoField label="Registration number">
            <span className="font-mono">{mockHospitalProfile.registrationNumber}</span>
          </InfoField>
          <InfoField label="Verification">
            <Badge tone="success" dot size="sm">
              Verified
            </Badge>
          </InfoField>
          <InfoField label="Verified on">{mockHospitalProfile.verifiedOnLabel}</InfoField>
          <InfoField label="Location">{mockHospitalProfile.location}</InfoField>
          <InfoField label="Coordinator">{mockHospitalProfile.coordinator}</InfoField>
          <InfoField label="Phone">
            <span className="font-mono">{mockHospitalProfile.phoneMasked}</span>
          </InfoField>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-[14px] font-semibold text-ink">Emergency coordination</h2>
        <div className="mt-1">
          {coordinationSettings.map((setting) => (
            <SettingToggleRow
              key={setting.key}
              label={setting.label}
              description={setting.description}
              on={settings[setting.key]}
              onToggle={(next) => setSettings((prev) => ({ ...prev, [setting.key]: next }))}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-[14px] font-semibold text-ink">Request limits</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="text-ink-secondary">Open requests</span>
              <span className="tabular font-medium text-ink">
                {mockHospitalProfile.openRequests.current} / {mockHospitalProfile.openRequests.limit}
              </span>
            </div>
            <ProgressBar value={mockHospitalProfile.openRequests.current} max={mockHospitalProfile.openRequests.limit} size="sm" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="text-ink-secondary">Requests today</span>
              <span className="tabular font-medium text-ink">
                {mockHospitalProfile.requestsToday.current} / {mockHospitalProfile.requestsToday.limit}
              </span>
            </div>
            <ProgressBar value={mockHospitalProfile.requestsToday.current} max={mockHospitalProfile.requestsToday.limit} size="sm" tone="info" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-[14px] font-semibold text-ink">Privacy &amp; Data</h2>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          Manage the information associated with this hospital account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link to="/hospital/privacy" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
            View Privacy Controls
          </Link>
          <Button variant="outline" size="sm" onClick={handleDataExport} leadingIcon={<Download size={14} />}>
            Data Export
          </Button>
        </div>
      </Card>
    </div>
  )
}

function InfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-ink">{children}</p>
    </div>
  )
}
