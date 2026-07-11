import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
      setErrorMsg('Email atau password salah.')
      setIsSubmitting(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg border border-border p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Login Admin</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Masuk untuk mengelola stok coklat
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-background"
              placeholder="admin@contoh.com"
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-background"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-danger text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/')} 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Kembali ke halaman publik
          </button>
        </div>
      </div>
    </div>
  )
}
