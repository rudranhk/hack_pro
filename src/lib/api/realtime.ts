import { endpoint } from './workspace'

export type Connection = 'Connecting' | 'Live' | 'Reconnecting' | 'Polling'
export function subscribe(channel: string, refresh: () => void, status: (value: Connection) => void) {
  if (import.meta.env.VITE_HOSTED_DEMO === '1') {
    status('Polling')
    refresh()
    const timer = window.setInterval(refresh, 3000)
    return () => clearInterval(timer)
  }
  let disposed = false
  let attempts = 0
  let retry = 0
  let heartbeat = 0
  let socket: WebSocket
  const connect = () => {
    const url = endpoint('/ws/requests/' + encodeURIComponent(channel))
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    status(attempts ? 'Reconnecting' : 'Connecting')
    socket = new WebSocket(url)
    let lastMessage = Date.now()
    socket.onmessage = ({data}) => {
      if (disposed) return
      lastMessage = Date.now()
      attempts = 0
      status('Live')
      if (data !== 'pong') refresh()
    }
    socket.onopen = () => {
      heartbeat = window.setInterval(() => {
        if (Date.now() - lastMessage > 45000) socket.close()
        else if (socket.readyState === WebSocket.OPEN) socket.send('ping')
      }, 15000)
    }
    socket.onclose = () => {
      clearInterval(heartbeat)
      if (disposed) return
      status('Reconnecting')
      retry = window.setTimeout(connect, Math.min(15000, 500 * 2 ** attempts++) + Math.random() * 250)
    }
    socket.onerror = () => socket.close()
  }
  connect()
  return () => {
    disposed = true
    clearInterval(heartbeat)
    clearTimeout(retry)
    socket.onopen = null
    socket.close()
  }
}
