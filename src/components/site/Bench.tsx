import type { ReactNode } from 'react'

type BenchProps = {
  children: ReactNode
  selected?: boolean
  tab?: string
  className?: string
}

// The dotted bench with an editor-style frame; `selected` draws the orange selection outline.
export function Bench({ children, selected = false, tab, className = '' }: BenchProps) {
  return (
    <div className={`bench rounded-lg border border-rule p-5 sm:p-8 ${className}`}>
      <div
        className={`relative rounded-md bg-paper p-5 sm:p-6 ${
          selected ? 'outline-[3px] outline-orange outline-solid' : 'border border-rule'
        }`}
      >
        {selected && tab && (
          <span className="absolute -top-[30px] -left-[3px] rounded-t-md bg-orange px-2.5 py-1 text-[0.8125rem] font-semibold text-violet">
            {tab}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}
