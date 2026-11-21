import { useRef, useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

export function ActionButton({run, children, disabled, confirm, success, ...props}: ButtonProps & {
  run: () => Promise<unknown>; confirm?:string; success?:string
}) {
  const [busy,setBusy] = useState(false)
  const [confirming,setConfirming] = useState(false)
  const pending = useRef(false)
  const {toast} = useToast()
  const execute = async () => {
    if (pending.current) return
    if (confirm && !confirming) {setConfirming(true);return}
    pending.current = true
    setBusy(true)
    try {
      await run()
      setConfirming(false)
      if (success) toast({title:success,tone:'success'})
    } catch (err) {
      toast({title:'Action could not be completed', description:err instanceof Error ? err.message : 'Please retry.',tone:'critical'})
    } finally {pending.current=false;setBusy(false)}
  }
  return <>{confirming && <span role="status" className="text-sm">{confirm}</span>}
    <Button {...props} disabled={busy || disabled} aria-busy={busy} onClick={execute}>{busy ? 'Working…' : confirming ? 'Confirm action' : children}</Button>
    {confirming && <Button size="sm" variant="ghost" disabled={busy} onClick={()=>setConfirming(false)}>Go back</Button>}</>
}
