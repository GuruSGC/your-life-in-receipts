import { ErrorBoundary } from './ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <main id="main">
        <h1>Your Life, In Receipts</h1>
      </main>
    </ErrorBoundary>
  )
}
