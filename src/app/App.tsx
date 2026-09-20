import { DataProvider } from '@/context/DataContext'
import { DrawerProvider } from '@/context/DrawerContext'
import { AppLayout } from '@/layouts'
import { ErrorBoundary } from './ErrorBoundary'

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
