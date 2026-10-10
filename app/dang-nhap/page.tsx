import type { Metadata } from 'next'
import Image from 'next/image'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 md:grid-cols-2 md:px-8">
      <div className="relative hidden aspect-[4/5] overflow-hidden md:block">
        <Image src="/images/cat-women.png" alt="" fill sizes="50vw" className="object-cover" />
      </div>
      <div className="flex flex-col justify-center md:px-8 lg:px-16">
        <AuthForm />
      </div>
    </div>
  )
}
