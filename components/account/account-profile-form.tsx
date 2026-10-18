'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateAccountProfile, type ProfileActionState } from '@/app/tai-khoan/actions'
import { cn } from '@/lib/utils'

const inputClass = 'h-11 w-full border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/30'
const initialState: ProfileActionState = { ok: false, message: '' }

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="h-11 bg-primary px-5 text-sm text-primary-foreground transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
    </button>
  )
}

type SavedAddress = { province: string; ward: string; street: string }
type Province = { code: number; name: string }
type Ward = { code: number; name: string }

export function AccountProfileForm({
  fullName,
  phone,
  address,
}: {
  fullName: string
  phone: string
  address: SavedAddress
}) {
  const [state, formAction] = useActionState(updateAccountProfile, initialState)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provinceCode, setProvinceCode] = useState('')
  const [provinceName, setProvinceName] = useState(address.province)
  const [wards, setWards] = useState<Ward[]>([])
  const [wardName, setWardName] = useState(address.ward)
  const [loadingProvinces, setLoadingProvinces] = useState(true)
  const [loadingWards, setLoadingWards] = useState(false)
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('https://provinces.open-api.vn/api/v2/p/', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Không tải được danh sách tỉnh thành.')
        return response.json() as Promise<Province[]>
      })
      .then(setProvinces)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          setAddressError('Không tải được danh sách địa chỉ. Vui lòng tải lại trang để thử lại.')
        }
      })
      .finally(() => setLoadingProvinces(false))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!provinceName) {
      setProvinceCode('')
      setWards([])
      return
    }
    const selectedProvince = provinces.find((province) => province.name === provinceName)
    if (selectedProvince) setProvinceCode(String(selectedProvince.code))
    else if (provinces.length > 0) setProvinceName('')
  }, [provinceName, provinces])

  useEffect(() => {
    if (!provinceCode) {
      setWards([])
      setLoadingWards(false)
      return
    }
    const controller = new AbortController()
    setLoadingWards(true)
    fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Không tải được danh sách phường xã.')
        return response.json() as Promise<{ wards?: Ward[] }>
      })
      .then((province) => setWards(province.wards ?? []))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          setWards([])
          setAddressError('Không tải được danh sách phường xã. Vui lòng chọn lại tỉnh thành.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingWards(false)
      })
    return () => controller.abort()
  }, [provinceCode])

  return (
    <form action={formAction} className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm text-muted-foreground">Họ và tên</label>
        <input id="fullName" name="fullName" required maxLength={120} autoComplete="name" defaultValue={fullName} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm text-muted-foreground">Số điện thoại</label>
        <input id="phone" name="phone" type="tel" required maxLength={20} autoComplete="tel" defaultValue={phone} className={inputClass} />
      </div>

      <div className="border-t border-border pt-5 sm:col-span-2">
        <h3 className="font-medium">Địa chỉ giao hàng</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="province" className="text-sm text-muted-foreground">Tỉnh / Thành phố</label>
        <select
          id="province"
          name="province"
          autoComplete="address-level1"
          className={inputClass}
          value={provinceName}
          disabled={loadingProvinces || provinces.length === 0}
          onChange={(event) => {
            setProvinceName(event.target.value)
            setWardName('')
            setAddressError('')
          }}
        >
          <option value="">{loadingProvinces ? 'Đang tải tỉnh thành...' : 'Chọn tỉnh / thành phố'}</option>
          {provinces.map((province) => <option key={province.code} value={province.name}>{province.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ward" className="text-sm text-muted-foreground">Phường / Xã / Đặc khu</label>
        <select
          id="ward"
          name="ward"
          autoComplete="address-level2"
          className={inputClass}
          value={wardName}
          disabled={!provinceCode || loadingWards || wards.length === 0}
          onChange={(event) => setWardName(event.target.value)}
        >
          <option value="">{!provinceCode ? 'Chọn tỉnh / thành phố trước' : loadingWards ? 'Đang tải phường / xã...' : 'Chọn phường / xã'}</option>
          {wards.map((ward) => <option key={ward.code} value={ward.name}>{ward.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="street" className="text-sm text-muted-foreground">Số nhà, tên đường</label>
        <input id="street" name="street" maxLength={255} autoComplete="street-address" defaultValue={address.street} className={inputClass} />
      </div>
      {addressError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{addressError}</p>}

      <div className="sm:col-span-2">
        <h3 className="font-medium">Đổi mật khẩu</h3>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="currentPassword" className="text-sm text-muted-foreground">Mật khẩu hiện tại</label>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm text-muted-foreground">Mật khẩu mới</label>
        <input id="newPassword" name="newPassword" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm text-muted-foreground">Xác nhận mật khẩu mới</label>
        <input id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <SaveButton />
        {state.message && (
          <p role={state.ok ? 'status' : 'alert'} className={cn('text-sm', state.ok ? 'text-emerald-700' : 'text-destructive')}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}
