import { ReactNode } from 'react'

interface ATMLayoutProps {
  children: ReactNode
  title?: string
}

export function ATMLayout({ children, title }: ATMLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#0d1117] to-[#010409] flex flex-col">
      <header className="flex-shrink-0 bg-gradient-to-r from-[#ff6b9d] to-[#c44569] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏦</span>
          <span className="text-white font-bold text-base">HOME BANK</span>
        </div>
        {title && (
          <span className="text-white/80 text-xs">{title}</span>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center p-3 overflow-auto">
        {children}
      </main>
    </div>
  )
}
