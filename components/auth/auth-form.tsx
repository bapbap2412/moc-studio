
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const inputClass =
  'h-11 w-full border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'success' | 'error' | ''>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setMessage('')
    setStatus('')
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    try {
      if (mode === 'login') {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ email, password }),
        })

        const result = await response.json()

        if (!response.ok) {
          setMessage(result.message || 'Email hoặc mật khẩu không chính xác.')
          setStatus('error')
          return
        }

        if (result.user?.role === 'admin') {
          window.location.assign('/admin')
        } else {
          window.location.assign('/')
        }

        return
      }

      const payload = {
        full_name: String(data.get('fullName') ?? '').trim(),
        email,
        password,
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.message || 'Đăng ký thất bại.')
        setStatus('error')
        return
      }

      setMessage(
        result.message || 'Đăng ký thành công! Bạn có thể đăng nhập.',
      )
      setStatus('success')
      form.reset()
    } catch (error) {
      console.error('Auth form error:', error)
      setMessage('Không thể kết nối máy chủ. Vui lòng thử lại.')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-4xl">
          {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'login'
            ? 'Đăng nhập để theo dõi đơn hàng và lưu địa chỉ giao hàng.'
            : 'Trở thành thành viên MỘC để nhận ưu đãi 10% cho đơn đầu tiên.'}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Chọn hình thức"
        className="grid grid-cols-2 border-b border-border"
      >
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m)
              setMessage('')
              setStatus('')
            }}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm transition-colors',
              mode === m
                ? 'border-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-xs text-muted-foreground">
              Họ và tên
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              maxLength={120}
              autoComplete="name"
              className={inputClass}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={255}
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs text-muted-foreground">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            className={inputClass}
          />
          {mode === 'register' && (
            <p className="text-xs text-muted-foreground">
              Mật khẩu tối thiểu 8 ký tự.
            </p>
          )}
        </div>

        {mode === 'login' && (
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="self-end text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Quên mật khẩu?
          </a>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? 'Đang xử lý...'
            : mode === 'login'
              ? 'Đăng nhập'
              : 'Tạo tài khoản'}
        </button>

        <p
          role="status"
          aria-live="polite"
          className={cn(
            'min-h-5 text-sm',
            status === 'success'
              ? 'text-green-700'
              : status === 'error'
                ? 'text-destructive'
                : 'text-accent',
          )}
        >
          {message}
        </p>
      </form>
    </div>
  )
}
