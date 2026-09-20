import { DataProvider } from '@/context/DataContext'
import { DrawerProvider } from '@/context/DrawerContext'
import { PinsProvider } from '@/context/PinsContext'
import { AppLayout } from '@/layouts'
import { ErrorBoundary } from './ErrorBoundary'

/** The application root: error boundary, data and drawer providers, and the page layout. */
export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <DrawerProvider>
          <PinsProvider>
            <AppLayout />
          </PinsProvider>
        </DrawerProvider>
      </DataProvider>
    </ErrorBoundary>
  )
}
