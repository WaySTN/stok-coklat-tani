import React from 'react'

interface WatermarkFooterProps {
  className?: string
}

export const WatermarkFooter: React.FC<WatermarkFooterProps> = ({ className = '' }) => {
  return (
    <div className={`w-full flex items-center justify-center pt-2 pb-1 ${className}`}>
      <div 
        className="inline-flex items-center justify-center gap-3 sm:gap-4 py-2 px-4 sm:px-5 rounded-full bg-white border shadow-xs"
        style={{ borderColor: '#E8E4DC', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
      >
        <img 
          src="/logo_tutwuri.png" 
          alt="Kemendikbudristek" 
          className="h-9 sm:h-10 w-auto object-contain shrink-0" 
        />
        <img 
          src="/logo_upn.png" 
          alt="UPN Veteran Jawa Timur" 
          className="h-9 sm:h-10 w-auto object-contain shrink-0" 
        />
        <img 
          src="/logo_lppm.jpg" 
          alt="LPPM UPN Veteran Jawa Timur" 
          className="h-9 sm:h-10 w-auto object-contain shrink-0 rounded-full" 
        />
        <img 
          src="/logo_dikti.png" 
          alt="Diktisaintek Berdampak" 
          className="h-8 sm:h-9 w-auto max-w-[135px] object-contain shrink-0" 
        />
      </div>
    </div>
  )
}
