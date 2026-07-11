import { X, AlertTriangle, CheckCircle2, Info, LogOut } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; // If provided, acts as Confirm (two buttons). If omitted, acts as Alert (one button).
  title: string;
  message: string;
  type?: 'danger' | 'success' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal'
}: ConfirmModalProps) {
  if (!isOpen) return null

  // Configure Colors & Icons based on Modal Type
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-[#B03A2E]" />,
          iconBg: 'rgba(176, 58, 46, 0.1)',
          primaryBtnBg: '#B03A2E',
          primaryBtnHover: '#952F26',
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-[#3B5D3A]" />,
          iconBg: 'rgba(59, 93, 58, 0.1)',
          primaryBtnBg: '#3B5D3A',
          primaryBtnHover: '#2E492D',
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-[#D9A441]" />,
          iconBg: 'rgba(217, 164, 65, 0.1)',
          primaryBtnBg: '#D9A441',
          primaryBtnHover: '#BE8D32',
        }
      case 'info':
      default:
        return {
          icon: <Info className="w-8 h-8 text-[#4A2C2A]" />,
          iconBg: 'rgba(74, 44, 42, 0.1)',
          primaryBtnBg: '#4A2C2A',
          primaryBtnHover: '#6F4E37',
        }
    }
  }

  const config = getTypeConfig()

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-sm rounded-[32px] border p-6 flex flex-col items-center text-center shadow-2xl animate-fade-in-up"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
      >
        {/* Large Rounded Icon Container */}
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-sm animate-float"
          style={{ backgroundColor: config.iconBg }}
        >
          {config.icon}
        </div>

        {/* Text Details */}
        <h3 className="text-lg font-serif font-black tracking-tight text-[#2E2015] mb-2">
          {title}
        </h3>
        <p className="text-xs text-[#8A7968] leading-relaxed mb-6 px-2">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2.5 w-full mt-auto">
          {onConfirm ? (
            // Two-button Confirmation Mode
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-2xl transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className="flex-1 text-white font-extrabold text-xs py-3 rounded-2xl transition-all duration-300 shadow-md cursor-pointer hover:scale-[1.01]"
                style={{ backgroundColor: config.primaryBtnBg }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.primaryBtnHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryBtnBg}
              >
                {confirmText}
              </button>
            </>
          ) : (
            // Single-button Alert Mode
            <button
              type="button"
              onClick={onClose}
              className="w-full text-white font-extrabold text-xs py-3.5 rounded-2xl transition-all duration-300 shadow-md cursor-pointer hover:scale-[1.01]"
              style={{ backgroundColor: config.primaryBtnBg }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.primaryBtnHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryBtnBg}
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
