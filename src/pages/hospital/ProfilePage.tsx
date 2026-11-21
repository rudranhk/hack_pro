import { useRequests } from '@/lib/context/RequestsContext'
import { ActionButton } from '@/components/shared/ActionButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'

export function ProfilePage() {
  const {data, mutate, activeRequests} = useRequests()
  if (!data) return null
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {type:'application/json'}))
    const link = document.createElement('a')
    link.href = url
    link.download = 'blood-buddy-synthetic-workspace.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="max-w-3xl space-y-4"><Card className="space-y-3 p-5"><Badge>Synthetic hospital</Badge>
    <h2 className="text-xl font-semibold">{data.hospital.name}</h2><p>42 Marina Road, Sector 9</p><p>{activeRequests.length} open requests · {data.requests.length} total</p></Card>
    <Card className="space-y-3 p-5"><h2 className="font-semibold">Invitation preferences</h2>
      <p className="text-sm">Automatic invitations are {data.hospital.autoInvite ? 'on' : 'off'}. When enabled, matching invites the highest-ranked donors up to the outstanding unit count.</p>
      <ActionButton variant="outline" run={() => mutate('/hospital/settings', {autoInvite:!data.hospital.autoInvite})}>{data.hospital.autoInvite ? 'Switch to manual invitations' : 'Enable automatic invitations'}</ActionButton></Card>
    <Card className="space-y-3 p-5"><h2 className="font-semibold">Workspace data</h2><p className="text-sm">Download this hospital’s synthetic records, request history and activity.</p>
      <Button onClick={download}>Export JSON</Button> <Link className="text-sm text-primary" to="/hospital/privacy">Privacy details</Link></Card></div>
}
