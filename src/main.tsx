import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { applyInitialTheme } from './hooks/useTheme'

applyInitialTheme()
const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
