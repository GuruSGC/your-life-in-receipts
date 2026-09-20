import { DataProvider } from '@/context/DataContext'
import { DrawerProvider } from '@/context/DrawerContext'
import { AppLayout } from '@/layouts'
import { ErrorBoundary } from './ErrorBoundary'

/** The application root: error boundary, data and drawer providers, and the page layout. */
export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <DrawerProvider>
          <AppLayout />
        </DrawerProvider>
      </DataProvider>
    </ErrorBoundary>
  )
}
