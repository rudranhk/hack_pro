import { Link } from 'react-router-dom'
import { Plus, Siren } from 'lucide-react'
import { EmergencyRequestCard, EmergencyRequestListHeader } from '@/components/hospital/EmergencyRequestCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/Button'
import { useRequests } from '@/lib/context/RequestsContext'

export function RequestsPage() {
  const { requests } = useRequests()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Emergency requests</h2>
          <p className="text-[12.5px] text-ink-secondary">Every request City Hospital has raised, active or resolved.</p>
        </div>
        <Link to="/hospital/requests/new" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
          <Plus size={15} className="-ml-0.5" />
          New request
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Siren}
          title="No requests yet"
          description="Emergency requests you raise will show up here, active or resolved."
          action={
            <Link to="/hospital/requests/new" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              <Plus size={15} className="-ml-0.5" />
              New request
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          <EmergencyRequestListHeader />
          {requests.map((request) => (
            <EmergencyRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}
