import * as React from 'react'
export const Card: React.FC<React.PropsWithChildren<{title?: string; className?: string}>> = ({title, className='', children}) => (
  <div className={`rounded-2xl shadow-md p-6 bg-white ${className}`}>
    {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
    {children}
  </div>
)
