import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function DemoModeControls() {
  return <Card className="flex flex-wrap items-center justify-between gap-4 border-primary-subtle-border p-5">
    <div><h2 className="font-semibold">Run the critical O− demonstration</h2>
      <p className="mt-1 text-sm text-ink-secondary">Start a fresh synthetic workspace, submit the request, then open a ranked donor’s inbox in a second tab.</p></div>
    <Button onClick={() => window.location.assign('/hospital/requests/new?demo=1&room=' + crypto.randomUUID())}>Start fresh demo</Button>
  </Card>
}
