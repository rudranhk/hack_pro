import { Card } from '@/components/ui/Card'
export function HospitalPrivacyPage() {
  return <Card className="max-w-3xl space-y-4 p-6"><h2 className="text-lg font-semibold">Privacy & workspace data</h2>
    <p>This local demonstration uses synthetic hospital and donor identities. Both role views can inspect the shared workspace.</p>
    <p>SQLite stores anonymous donor IDs, example review dates, approximate distances, invitations, responses and collection records on this computer. Records persist across restarts.</p>
    <p>With cloud retrieval enabled, Gemini receives synthetic profile and requirement text. Qdrant stores synthetic profile vectors and matching metadata. Provider credentials stay in the backend.</p>
    <p>Starting a fresh demonstration opens a separate workspace. Previous runs remain available in their original tabs.</p></Card>
}
