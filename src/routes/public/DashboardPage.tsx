import { StockSummary } from '../../components/StockSummary'
import { Warehouse, Info, ShieldCheck, RefreshCw } from 'lucide-react'
import { WatermarkFooter } from '../../components/WatermarkFooter'

export function PublicDashboardPage() {
  return (
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Premium Cocoa Gradient Header with Soft Curve */}
      <div
        className="px-6 pt-10 pb-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #361E1C 0%, #1F0F0E 100%)',
          borderBottomLeftRadius: '48px',
          borderBottomRightRadius: '48px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Floating Abstract Cacao Seed Background Pattern */}
        <div className="absolute -top-16 -right-16 pointer-events-none animate-float opacity-[0.03]">
          <Warehouse className="w-64 h-64 text-white" />
        </div>

        <div className="absolute top-20 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-[0.06]" style={{ background: '#3B5D3A' }}></div>

        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md" style={{ backgroundColor: 'rgba(212, 163, 115, 0.2)', color: '#D4A373' }}>
              SITANDES
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
            </span>
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-white mt-1">
            Gudang Coklat
          </h1>
          <p className="text-xs font-medium text-white/60 tracking-wide mt-0.5">
            Sistem Informasi & Pemantauan Stok Coklat Kelompok Tani Mulyojati
          </p>
        </div>
      </div>

      {/* Main Container - Pulling up cards into the header */}
      <div className="px-5 -mt-8 relative z-20">
        <StockSummary />
      </div>

      {/* Interactive Feature Cards */}
      <div className="px-5 mt-8 space-y-4">
        {/* Main Info Card - Glassmorphism style */}
        <div
          className="animate-fade-in-up delay-300 p-6 rounded-3xl flex flex-col gap-4 border transition-all duration-300 hover:shadow-md"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#EFECE6',
            boxShadow: '0 4px 20px rgba(74, 44, 42, 0.02)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner"
              style={{ backgroundColor: '#F5EFE6' }}
            >
              <Info className="w-5 h-5" style={{ color: '#4A2C2A' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight" style={{ color: '#2E2015' }}>
                Pemantauan Mandiri
              </h2>
              <p className="text-[11px] font-medium" style={{ color: '#8A7968' }}>
                Akses terbuka untuk petani & pengelola
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: '#5E4E42' }}>
            Seluruh data tonase yang ditampilkan bersumber langsung dari pencatatan log masuk dan log keluar digital tim administrasi di timbangan gudang secara <strong style={{ color: '#3B5D3A' }}>real-time</strong>.
          </p>
        </div>

        {/* Dynamic badges row */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up delay-300">
          <div
            className="p-4 rounded-2xl border flex items-center gap-2.5"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#3B5D3A' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#2E2015' }}>
              FEFO System Active
            </span>
          </div>

          <div
            className="p-4 rounded-2xl border flex items-center gap-2.5"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
          >
            <RefreshCw className="w-4 h-4 shrink-0 animate-spin" style={{ color: '#D4A373', animationDuration: '8s' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#2E2015' }}>
              Auto Sync Realtime
            </span>
          </div>
        </div>

        {/* Monev / Abdimas Watermark Sponsor Banner */}
        <WatermarkFooter className="mt-4" />
      </div>
    </div>
  )
}
