import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  ChevronDown, ChevronUp, Calendar, Info, Clock,
  AlertCircle, ArrowDownLeft, ArrowUpRight, User,
  Filter, Search
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

type HistoryEntry = {
  id: string
  type: 'masuk' | 'keluar'
  tanggal: string
  created_at: string
  kode_batch: string
  jenis_coklat: string
  jumlah: number
  asal_petani?: string | null
  keterangan?: string | null
}

type FilterType = 'Semua' | 'Masuk' | 'Keluar'

// ── Helper: Date shortcuts ─────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getStartOfWeek(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getStartOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

// ── Component ──────────────────────────────────────────

export function HistoryTimeline() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<FilterType>('Semua')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeQuick, setActiveQuick] = useState<string>('semua')

  // ── Fetch stock OUT ──
  const { data: stockOutData, isLoading: isLoadingOut } = useQuery({
    queryKey: ['history-stock-out'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          id,
          jumlah_keluar,
          tanggal_keluar,
          keterangan,
          created_at,
          batches (
            kode_batch,
            jenis_coklat
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  // ── Fetch stock IN (batches) ──
  const { data: batchesData, isLoading: isLoadingIn } = useQuery({
    queryKey: ['history-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('id, kode_batch, jenis_coklat, jumlah_masuk, tanggal_masuk, asal_petani, created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const isLoading = isLoadingOut || isLoadingIn

  // ── Merge + Sort + Filter ──
  const entries: HistoryEntry[] = useMemo(() => {
    const result: HistoryEntry[] = []

    // Map stock OUT → HistoryEntry
    stockOutData?.forEach((item: any) => {
      result.push({
        id: `out-${item.id}`,
        type: 'keluar',
        tanggal: item.tanggal_keluar,
        created_at: item.created_at,
        kode_batch: item.batches?.kode_batch || 'Batch Dihapus',
        jenis_coklat: item.batches?.jenis_coklat || '-',
        jumlah: Number(item.jumlah_keluar),
        keterangan: item.keterangan,
      })
    })

    // Map batches → HistoryEntry
    batchesData?.forEach((item: any) => {
      result.push({
        id: `in-${item.id}`,
        type: 'masuk',
        tanggal: item.tanggal_masuk,
        created_at: item.created_at,
        kode_batch: item.kode_batch,
        jenis_coklat: item.jenis_coklat,
        jumlah: Number(item.jumlah_masuk),
        asal_petani: item.asal_petani,
      })
    })

    // Sort by tanggal DESC, then created_at DESC
    result.sort((a, b) => {
      const dateCompare = b.tanggal.localeCompare(a.tanggal)
      if (dateCompare !== 0) return dateCompare
      return b.created_at.localeCompare(a.created_at)
    })

    return result
  }, [stockOutData, batchesData])

  // ── Apply Filters ──
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter by type
      if (filterType === 'Masuk' && entry.type !== 'masuk') return false
      if (filterType === 'Keluar' && entry.type !== 'keluar') return false

      // Filter by date range
      if (dateFrom && entry.tanggal < dateFrom) return false
      if (dateTo && entry.tanggal > dateTo) return false

      return true
    })
  }, [entries, filterType, dateFrom, dateTo])

  // ── Quick filter handlers ──
  const applyQuickFilter = (key: string) => {
    setActiveQuick(key)
    switch (key) {
      case 'hari-ini':
        setDateFrom(getToday())
        setDateTo(getToday())
        break
      case 'minggu-ini':
        setDateFrom(getStartOfWeek())
        setDateTo(getToday())
        break
      case 'bulan-ini':
        setDateFrom(getStartOfMonth())
        setDateTo(getToday())
        break
      case 'semua':
      default:
        setDateFrom('')
        setDateTo('')
        break
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // ── Summary stats ──
  const totalMasuk = filteredEntries.filter((e) => e.type === 'masuk').reduce((s, e) => s + e.jumlah, 0)
  const totalKeluar = filteredEntries.filter((e) => e.type === 'keluar').reduce((s, e) => s + e.jumlah, 0)

  return (
    <div className="space-y-4">
      {/* ── Filter Bar: Type Segmented ── */}
      <div
        className="flex gap-1.5 p-1 rounded-2xl border bg-white shadow-md"
        style={{ borderColor: '#EFECE6' }}
      >
        {(['Semua', 'Masuk', 'Keluar'] as const).map((type) => {
          const isActive = filterType === type
          const colors: Record<string, string> = {
            Semua: '#735751',
            Masuk: '#3B5D3A',
            Keluar: '#B03A2E',
          }
          return (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className="flex-1 py-2 text-[10px] font-bold rounded-xl transition-all duration-300 cursor-pointer text-center"
              style={{
                backgroundColor: isActive ? colors[type] : 'transparent',
                color: isActive ? '#FFFFFF' : '#8A7968',
                boxShadow: isActive ? '0 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              {type === 'Masuk' ? '↓ Masuk' : type === 'Keluar' ? '↑ Keluar' : type}
            </button>
          )
        })}
      </div>

      {/* ── Filter Bar: Date Range ── */}
      <div
        className="p-4 rounded-2xl border bg-white shadow-sm space-y-3"
        style={{ borderColor: '#EFECE6' }}
      >
        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          <Filter className="w-3 h-3" />
          <span>Rentang Tanggal</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Dari</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setActiveQuick('') }}
              className="w-full text-xs px-3 py-2 rounded-xl border outline-none transition-all duration-300 bg-[#FAF7F2]"
              style={{ borderColor: '#EFECE6' }}
              onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
              onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Sampai</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setActiveQuick('') }}
              className="w-full text-xs px-3 py-2 rounded-xl border outline-none transition-all duration-300 bg-[#FAF7F2]"
              style={{ borderColor: '#EFECE6' }}
              onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
              onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'hari-ini', label: 'Hari Ini' },
            { key: 'minggu-ini', label: 'Minggu Ini' },
            { key: 'bulan-ini', label: 'Bulan Ini' },
            { key: 'semua', label: 'Semua Waktu' },
          ].map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => applyQuickFilter(q.key)}
              className="px-3 py-1.5 text-[9px] font-bold rounded-lg border transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: activeQuick === q.key ? '#4A2C2A' : 'transparent',
                color: activeQuick === q.key ? '#FFFFFF' : '#8A7968',
                borderColor: activeQuick === q.key ? '#4A2C2A' : '#EFECE6',
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      {filteredEntries.length > 0 && (
        <div
          className="grid grid-cols-3 gap-2.5 animate-fade-in-up"
        >
          <div className="p-3 rounded-2xl border bg-white text-center" style={{ borderColor: '#EFECE6' }}>
            <span className="text-[8px] font-bold text-neutral-400 uppercase block">Total Entri</span>
            <span className="text-base font-black text-[#2E2015]">{filteredEntries.length}</span>
          </div>
          <div className="p-3 rounded-2xl border bg-white text-center" style={{ borderColor: '#E2EFE2' }}>
            <span className="text-[8px] font-bold text-neutral-400 uppercase block">Masuk</span>
            <span className="text-base font-black text-[#3B5D3A]">+{totalMasuk.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-neutral-400">Kg</span></span>
          </div>
          <div className="p-3 rounded-2xl border bg-white text-center" style={{ borderColor: '#F5E5E3' }}>
            <span className="text-[8px] font-bold text-neutral-400 uppercase block">Keluar</span>
            <span className="text-base font-black text-[#B03A2E]">-{totalKeluar.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-neutral-400">Kg</span></span>
          </div>
        </div>
      )}

      {/* ── Timeline List ── */}
      {isLoading ? (
        <div className="bg-white p-8 rounded-3xl border border-[#EFECE6] text-center shadow-md animate-pulse">
          <p style={{ color: '#8A7968' }} className="text-sm font-medium">
            Memuat catatan riwayat...
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div
          className="animate-fade-in-up p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-md border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#FAF7F2]">
            <AlertCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-serif font-bold mb-1" style={{ color: '#4A2C2A' }}>
            {dateFrom || dateTo || filterType !== 'Semua'
              ? 'Tidak Ada Data Cocok'
              : 'Catatan Masih Kosong'}
          </h3>
          <p className="text-xs max-w-[260px] leading-relaxed" style={{ color: '#8A7968' }}>
            {dateFrom || dateTo || filterType !== 'Semua'
              ? 'Tidak ditemukan riwayat yang sesuai dengan filter yang dipilih. Coba ubah rentang tanggal atau jenis transaksi.'
              : 'Belum ada catatan transaksi masuk maupun keluar di gudang.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry, index) => {
            const isExpanded = expandedId === entry.id
            const isMasuk = entry.type === 'masuk'

            const indicatorColor = isMasuk ? '#3B5D3A' : '#B03A2E'
            const badgeBg = isMasuk ? 'rgba(59,93,58,0.08)' : 'rgba(176,58,46,0.08)'
            const badgeColor = isMasuk ? '#3B5D3A' : '#B03A2E'

            return (
              <div
                key={entry.id}
                className="animate-fade-in-up rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#EFECE6',
                  animationDelay: `${index * 25}ms`,
                }}
              >
                {/* ── Collapsed Row ── */}
                <div
                  onClick={() => toggleExpand(entry.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Type indicator bar */}
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: indicatorColor }}
                    />

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        {isMasuk ? (
                          <ArrowDownLeft className="w-3 h-3 text-[#3B5D3A]" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-[#B03A2E]" />
                        )}
                        <span className="font-extrabold text-sm" style={{ color: '#2E2015' }}>
                          {entry.kode_batch}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-bold tracking-wide uppercase mt-0.5">
                        {new Date(entry.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Type badge */}
                    <span
                      className="px-2 py-0.5 text-[8px] font-extrabold tracking-wider uppercase rounded-full"
                      style={{ backgroundColor: badgeBg, color: badgeColor }}
                    >
                      {isMasuk ? 'Masuk' : entry.jenis_coklat === 'Fermentasi' ? 'Ferm' : 'Mentah'}
                    </span>

                    {/* Amount */}
                    <span
                      className="font-serif font-black text-sm"
                      style={{ color: indicatorColor }}
                    >
                      {isMasuk ? '+' : '-'}
                      {entry.jumlah.toLocaleString('id-ID')}{' '}
                      <span className="text-[10px] font-sans font-medium text-neutral-500">Kg</span>
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* ── Expanded Detail ── */}
                {isExpanded && (
                  <div
                    className="px-5 pb-5 pt-3 border-t text-xs text-neutral-500 space-y-3 animate-fade-in-up"
                    style={{
                      backgroundColor: '#FCFAF7',
                      borderColor: '#F5EFE6',
                      animationDuration: '200ms',
                    }}
                  >
                    {/* Jenis Coklat */}
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block px-2 py-0.5 text-[8px] font-extrabold tracking-wider uppercase rounded-full"
                        style={
                          entry.jenis_coklat === 'Fermentasi'
                            ? { backgroundColor: 'rgba(74,44,42,0.08)', color: '#4A2C2A' }
                            : { backgroundColor: 'rgba(59,93,58,0.08)', color: '#3B5D3A' }
                        }
                      >
                        {entry.jenis_coklat}
                      </span>
                      <span
                        className="inline-block px-2 py-0.5 text-[8px] font-extrabold tracking-wider uppercase rounded-full"
                        style={{ backgroundColor: badgeBg, color: badgeColor }}
                      >
                        {isMasuk ? 'Stok Masuk' : 'Stok Keluar'}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        {isMasuk ? 'Tanggal Masuk' : 'Tanggal Keluar'}:{' '}
                        <strong style={{ color: '#2E2015' }}>
                          {new Date(entry.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        Waktu Pencatatan:{' '}
                        <strong style={{ color: '#2E2015' }}>
                          {new Date(entry.created_at).toLocaleString('id-ID')}
                        </strong>
                      </span>
                    </div>

                    {/* Petani (for masuk) */}
                    {isMasuk && entry.asal_petani && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>
                          Anggota Tani:{' '}
                          <strong style={{ color: '#2E2015' }}>{entry.asal_petani}</strong>
                        </span>
                      </div>
                    )}

                    {/* Keterangan (for keluar) */}
                    {!isMasuk && (
                      entry.keterangan ? (
                        <div
                          className="p-3 rounded-2xl italic flex gap-2 border"
                          style={{
                            color: '#5E4E42',
                            backgroundColor: '#FFFFFF',
                            borderColor: '#EFECE6',
                          }}
                        >
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4A373]" />
                          <p className="text-[11px] leading-relaxed">"{entry.keterangan}"</p>
                        </div>
                      ) : (
                        <div className="text-[10px] italic text-neutral-400 pl-5">
                          Tidak ada keterangan/tujuan pengiriman.
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
