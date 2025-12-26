import { ReactNode } from 'react'

interface ATMLayoutProps {
  children: ReactNode
  title?: string
}

export function ATMLayout({ children, title }: ATMLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#0d1117] to-[#010409] flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-[#ff6b9d] to-[#c44569] px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏦</span>
          <span className="text-white font-bold text-xl tracking-wide">HOME BANK</span>
        </div>
        {title && (
          <span className="text-white/80 text-sm font-medium">{title}</span>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 px-6 py-2 text-center">
        <span className="text-[#484f58] text-xs">ATM Terminal v2.0</span>
      </footer>
    </div>
  )
}
