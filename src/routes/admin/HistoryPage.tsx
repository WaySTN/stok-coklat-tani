import { History as HistoryIcon } from 'lucide-react'
import { HistoryTimeline } from '../../components/HistoryTimeline'

export function AdminHistoryPage() {
  return (
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header Kakao Premium */}
      <div
        className="px-6 pt-10 pb-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #361E1C 0%, #1F0F0E 100%)',
          borderBottomLeftRadius: '48px',
          borderBottomRightRadius: '48px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="absolute -top-16 -right-16 pointer-events-none opacity-[0.03] animate-float">
          <HistoryIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="p-2.5 rounded-2xl flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            <HistoryIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-white">
              Riwayat Transaksi
            </h1>
            <p className="text-xs font-medium text-white/60 tracking-wide mt-0.5">
              Log masuk &amp; keluar stok gudang (Admin)
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="px-5 -mt-8 relative z-20">
        <HistoryTimeline />
      </div>
    </div>
  )
}
