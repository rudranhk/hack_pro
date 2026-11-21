import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { api, type Requirement, type Workspace } from '@/lib/api/workspace'
import { subscribe, type Connection } from '@/lib/api/realtime'

function useWorkspaceState() {
  const [data, setData] = useState<Workspace | null>(null)
  const [snapshotTime,setSnapshotTime] = useState(0)
  const [error, setError] = useState('')
  const [connection, setConnection] = useState<Connection>('Connecting')
  const sequence = useRef(0)
  const {pathname} = useLocation()
  const requestId = pathname.match(/^\/hospital\/requests\/(REQ-[A-Z0-9]+)$/)?.[1]
  const channel = requestId ?? 'workspace'
  const landing = pathname === '/'
  const refresh = useCallback(async () => {
    const call = ++sequence.current
    try {
      const value = await api<Workspace>('/workspace')
      if (sequence.current !== call) return
      for (const r of value.requests) {
        const seconds = Math.max(0, Math.floor(Date.now() / 1000) - r.created)
        r.hospitalName = value.hospital.name
        r.createdAtLabel = new Date(r.created * 1000).toLocaleString()
        r.timeElapsedLabel = Math.floor(seconds / 60) + 'm'
        r.escalationTier = r.radius === 5 ? 'NEARBY' : r.radius === 15 ? 'WIDE' : 'CITY'
      }
      setSnapshotTime(Date.now()/1000)
      setData(value)
      setError('')
    } catch (e) {
      if (sequence.current === call) setError(e instanceof Error ? e.message : 'Unable to load workspace.')
    }
  }, [])
  useEffect(() => {
    if (landing) return
    const initial = window.setTimeout(refresh, 0)
    const stop = subscribe(channel, refresh, setConnection)
    const sync = window.setInterval(refresh, 30000)
    return () => { stop(); clearTimeout(initial); clearInterval(sync) }
  }, [channel, landing, refresh])
  const mutate = async (path: string, body: unknown) => {
    const result = await api<{id?: string}>(path, body)
    await refresh()
    return result
  }
  const createRequest = async (input: Requirement, token: string) => {
    const result = await mutate('/requests', {...input, token})
    if (!result.id) throw new Error('Service returned no request ID.')
    return {id: result.id}
  }
  return { data, snapshotTime, error, refresh, connection, mutate, createRequest, requests: data?.requests ?? [],
    activeRequests: data?.requests.filter(r => !r.closed) ?? [] }
}

const Context = createContext<ReturnType<typeof useWorkspaceState> | null>(null)

export function RequestsProvider({children}: {children: ReactNode}) {
  const state = useWorkspaceState()
  const {pathname} = useLocation()
  if (pathname !== '/' && !state.data) return (
    <main className="mx-auto mt-16 max-w-lg space-y-4 rounded-lg border border-border bg-surface p-6" aria-live="polite">
      <h1 className="font-semibold">Blood Buddy workspace</h1>
      {state.error ? <><p role="alert">{state.error}</p><Button onClick={state.refresh}>Retry connection</Button></> :
        <><p>Loading hospital and donor records…</p><div className="h-12 animate-pulse rounded-md bg-surface-sunken" /></>}
    </main>
  )
  return <Context.Provider value={state}>
    {pathname !== '/' && state.error && <div role="alert" className="flex flex-wrap items-center gap-3 bg-warning-subtle px-4 py-2 text-sm">
      <span>Showing the last successful update. {state.error}</span>
      <Button size="sm" variant="outline" onClick={state.refresh}>Retry connection</Button>
    </div>}
    {children}
  </Context.Provider>
}
export function useRequests() {
  const state = useContext(Context)
  if (!state) throw new Error('Workspace provider is required')
  return state
}
