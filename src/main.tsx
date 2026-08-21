import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { RequestsProvider } from '@/lib/context/RequestsContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <RequestsProvider>
          <App />
        </RequestsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)
