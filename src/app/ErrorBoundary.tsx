import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  override componentDidCatch(error: unknown) {
    console.error(error)
  }
  override render() {
    return this.state.failed ? (
      <p role="alert">Something went wrong. Reload the page.</p>
    ) : (
      this.props.children
    )
  }
}
