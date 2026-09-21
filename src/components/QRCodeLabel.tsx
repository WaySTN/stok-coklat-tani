import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeLabelProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeLabel: React.FC<QRCodeLabelProps> = ({
  value,
  size = 84,
  className = '',
}) => {
  if (!value) return null

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="p-2 bg-white rounded-xl border border-neutral-100 shadow-2xs">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          fgColor="#2E2015"
          bgColor="#FFFFFF"
        />
      </div>
      <span className="text-[9px] font-mono tracking-widest text-[#5E4E42] mt-1 font-bold">
        *{value}*
      </span>
    </div>
  )
}
