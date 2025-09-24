import * as React from 'react'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost' }
export const Button: React.FC<Props> = ({variant='primary', className='', ...props}) => (
  <button
    className={`rounded-2xl px-4 py-2 font-medium transition ${variant==='primary' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-transparent border border-slate-300 hover:bg-slate-50'} ${className}`}
    {...props}
  />
)
