'use client'

import ErrorBoundaryClass from '@/components/shared/error-boundary'
import { ReactNode } from 'react'

interface CheckoutErrorBoundaryProps {
  children: ReactNode
}

export default function CheckoutErrorBoundary({ children }: CheckoutErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass
      onReset={() => {
        // Clear cart state on error reset if needed
        window.location.reload()
      }}
    >
      {children}
    </ErrorBoundaryClass>
  )
}
