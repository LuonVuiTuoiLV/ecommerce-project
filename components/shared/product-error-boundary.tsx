'use client'

import ErrorBoundaryClass from '@/components/shared/error-boundary'
import { ReactNode } from 'react'

interface ProductErrorBoundaryProps {
  children: ReactNode
}

export default function ProductErrorBoundary({ children }: ProductErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass
      onReset={() => {
        window.location.reload()
      }}
    >
      {children}
    </ErrorBoundaryClass>
  )
}
