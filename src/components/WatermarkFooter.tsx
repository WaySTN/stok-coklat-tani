import React from 'react'

interface WatermarkFooterProps {
  className?: string
}

export const WatermarkFooter: React.FC<WatermarkFooterProps> = ({ className = '' }) => {
  return (
    <div className={`w-full flex items-center justify-center pt-3 pb-1 ${className}`}>
      <div 
        className="w-full max-w-sm py-2 px-5 rounded-full bg-white border flex items-center justify-between gap-3 shadow-xs"
        style={{ borderColor: '#EBE7DF', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
      >
        <img 
          src="/logo_tutwuri.png" 
          alt="Kemendikbudristek" 
          className="h-7 w-auto object-contain shrink-0" 
        />
        <img 
          src="/logo_upn.png" 
          alt="UPN Veteran Jawa Timur" 
          className="h-7 w-auto object-contain shrink-0" 
        />
        <img 
          src="/logo_lppm.jpg" 
          alt="LPPM UPN Veteran Jawa Timur" 
          className="h-7 w-auto object-contain shrink-0 rounded-full" 
        />
        <img 
          src="/logo_dikti.png" 
          alt="Diktisaintek Berdampak" 
          className="h-6 w-auto max-w-[120px] object-contain shrink-0" 
        />
      </div>
    </div>
  )
}
