import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, ArrowLeft, Leaf, Sparkles, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { session, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Jika sudah login, redirect ke dashboard admin
  if (session && !authLoading) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setErrorMsg('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setErrorMsg('Email atau password salah. Silakan periksa kembali.')
      setIsSubmitting(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" 
      style={{ backgroundColor: '#FAF7F2' }}
    >
      {/* Decorative Background Elements */}
      <div 
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: '#4A2C2A' }}
      ></div>
      <div 
        className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: '#3B5D3A' }}
      ></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md animate-float"
            style={{ backgroundColor: '#4A2C2A' }}
          >
            <Leaf className="w-7 h-7 text-[#F5EFE6]" />
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight" style={{ color: '#4A2C2A' }}>
            SITANDES Coklat
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#8A7968' }}>
            Panel Pengelola Gudang
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="animate-fade-in-up delay-100 p-8 rounded-3xl border shadow-xl transition-all duration-300"
          style={{ 
            backgroundColor: '#FFFFFF', 
            borderColor: '#EFECE6',
            boxShadow: '0 20px 40px rgba(74, 44, 42, 0.04)'
          }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: '#2E2015' }}>
              Masuk Sistem
            </h2>
            <p className="text-xs mt-1" style={{ color: '#8A7968' }}>
              Gunakan akun administrasi terverifikasi Anda
            </p>
          </div>

          {errorMsg && (
            <div 
              className="mb-6 p-4 rounded-2xl text-xs font-medium border flex items-center gap-2.5 animate-pulse-soft"
              style={{ 
                backgroundColor: 'rgba(176, 58, 46, 0.06)', 
                borderColor: 'rgba(176, 58, 46, 0.15)',
                color: '#B03A2E'
              }}
            >
              <span>⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wide" style={{ color: '#2E2015' }}>
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-neutral-400 group-focus-within:text-[#4A2C2A] transition-colors" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full text-sm pl-10 pr-4 py-3 rounded-2xl border transition-all duration-300 outline-none"
                  style={{ 
                    backgroundColor: '#FAF7F2',
                    borderColor: '#EFECE6'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4A2C2A';
                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EFECE6';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="nama@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] font-semibold text-red-600 mt-1 pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wide" style={{ color: '#2E2015' }}>
                Kata Sandi
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-neutral-400 group-focus-within:text-[#4A2C2A] transition-colors" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full text-sm pl-10 pr-4 py-3 rounded-2xl border transition-all duration-300 outline-none"
                  style={{ 
                    backgroundColor: '#FAF7F2',
                    borderColor: '#EFECE6'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4A2C2A';
                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EFECE6';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-[10px] font-semibold text-red-600 mt-1 pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-bold text-sm py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-70 hover:scale-[1.01]"
              style={{ 
                backgroundColor: '#4A2C2A',
                boxShadow: '0 4px 12px rgba(74, 44, 42, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6F4E37';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4A2C2A';
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#D4A373]" />
                  <span>Masuk Aplikasi</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center animate-fade-in-up delay-200">
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 text-xs font-bold transition-all duration-300 hover:gap-3"
            style={{ color: '#8A7968' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4A2C2A'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#8A7968'}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>
      </div>
    </div>
  )
}
