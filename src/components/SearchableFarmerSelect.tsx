import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, X, Check, User, Phone, Plus } from 'lucide-react'

export interface Farmer {
  id: string
  nama: string
  no_hp?: string | null
  [key: string]: any
}

interface SearchableFarmerSelectProps {
  farmers: Farmer[] | undefined | null
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  onOpenFarmerManager?: () => void
  disabled?: boolean
  isLoading?: boolean
}

export const SearchableFarmerSelect: React.FC<SearchableFarmerSelectProps> = ({
  farmers = [],
  value,
  onChange,
  error,
  placeholder = '-- Cari / Pilih Pengirim --',
  onOpenFarmerManager,
  disabled = false,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Find currently selected farmer object (if any)
  const selectedFarmer = useMemo(() => {
    if (!value || !farmers) return null
    return farmers.find((f) => f.nama.toLowerCase() === value.toLowerCase()) || null
  }, [value, farmers])

  // Filter farmers based on name or phone number
  const filteredFarmers = useMemo(() => {
    if (!farmers) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return farmers

    // Remove hyphens/spaces for flexible phone matching
    const cleanQ = q.replace(/[\s-]/g, '')

    return farmers.filter((f) => {
      const matchName = f.nama.toLowerCase().includes(q)
      const cleanPhone = (f.no_hp || '').replace(/[\s-]/g, '')
      const matchPhone = cleanPhone.includes(cleanQ)
      return matchName || matchPhone
    })
  }, [farmers, searchQuery])

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Auto focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow element to render
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  const handleSelect = (farmerName: string) => {
    onChange(farmerName)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => {
          if (!disabled && !isLoading) setIsOpen((prev) => !prev)
        }}
        className={`w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 select-none ${
          disabled || isLoading ? 'opacity-60 cursor-not-allowed bg-neutral-100' : 'bg-[#FAF7F2]'
        } ${isOpen ? 'ring-3 ring-[#4A2C2A]/10 border-[#4A2C2A]' : 'border-[#EFECE6]'}`}
        style={{
          borderColor: isOpen ? '#4A2C2A' : error ? '#DC2626' : '#EFECE6',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isLoading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-[#4A2C2A] border-t-transparent animate-spin shrink-0" />
              <span className="text-neutral-400 text-sm truncate">Memuat daftar pengirim...</span>
            </>
          ) : selectedFarmer ? (
            <>
              <div className="w-6 h-6 rounded-full bg-[#4A2C2A]/10 text-[#4A2C2A] flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[#2E2015] truncate text-xs sm:text-sm">
                  {selectedFarmer.nama}
                </span>
                {selectedFarmer.no_hp && (
                  <span className="text-[10px] text-[#8A7968] truncate flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 shrink-0" />
                    {selectedFarmer.no_hp}
                  </span>
                )}
              </div>
            </>
          ) : value ? (
            // In case value exists but farmer is not in list
            <>
              <User className="w-4 h-4 text-[#8A7968] shrink-0" />
              <span className="font-semibold text-[#2E2015] truncate text-sm">{value}</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-[#8A7968]/70 shrink-0" />
              <span className="text-neutral-400 text-sm truncate">{placeholder}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-neutral-400 hover:text-red-600 hover:bg-neutral-200/50 transition-colors"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#8A7968] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#4A2C2A]' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-[120] bg-white rounded-2xl border shadow-xl overflow-hidden animate-fade-in-up"
          style={{ borderColor: '#EFECE6' }}
        >
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-[#FAF7F2] bg-[#FAF7F2]/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#8A7968] absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama atau no HP..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border bg-white outline-none transition-all"
                style={{ borderColor: '#E8E4DC' }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false)
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filteredFarmers.length > 0) {
                      handleSelect(filteredFarmers[0].nama)
                    }
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Match Counter Info */}
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-[#8A7968]">
              <span>
                {filteredFarmers.length} dari {farmers?.length || 0} pengirim
              </span>
              {searchQuery && (
                <span className="italic text-[#4A2C2A] font-medium">Tekan Enter untuk memilih pertama</span>
              )}
            </div>
          </div>

          {/* Scrollable Farmers List */}
          <div className="max-h-52 overflow-y-auto p-1.5 space-y-1">
            {filteredFarmers.length > 0 ? (
              filteredFarmers.map((f) => {
                const isSelected = value.toLowerCase() === f.nama.toLowerCase()

                return (
                  <div
                    key={f.id}
                    onClick={() => handleSelect(f.nama)}
                    className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-[#3B5D3A]/10 text-[#3B5D3A] font-semibold'
                        : 'hover:bg-[#FAF7F2] text-[#2E2015]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isSelected
                            ? 'bg-[#3B5D3A] text-white'
                            : 'bg-[#4A2C2A]/10 text-[#4A2C2A]'
                        }`}
                      >
                        {f.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                          {f.nama}
                        </p>
                        {f.no_hp && (
                          <p className="text-[10px] text-[#8A7968] truncate flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            {f.no_hp}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#3B5D3A] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              // Empty State
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-[#8A7968]">
                  Tidak ada pengirim yang cocok dengan <span className="font-bold text-[#4A2C2A]">"{searchQuery}"</span>
                </p>
                {onOpenFarmerManager && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onOpenFarmerManager()
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#4A2C2A] bg-[#4A2C2A]/10 hover:bg-[#4A2C2A]/15 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan Petani Baru</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
