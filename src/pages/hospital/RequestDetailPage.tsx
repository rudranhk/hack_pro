import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Radio } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/hospital"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink-secondary hover:text-ink"
      >
        <ArrowLeft size={15} />
        Back to overview
      </Link>
      <ComingSoon
        icon={Radio}
        phase="Phase 4"
        title={`Live tracking for ${id ?? 'this request'}`}
        description="The escalation timeline, donor map, and explainable ranking panel for this request will render here."
      />
    </div>
  )
}
