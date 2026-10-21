"use client";

import { useEffect, useId, useRef } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full rounded-lg border border-[#e2ded3] bg-white px-3 text-sm text-[#4b5735] outline-none transition placeholder:text-neutral-400 focus:border-[#4b5735] focus:ring-2 focus:ring-[#4b5735]/10 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass = cn(inputClass, "h-auto min-h-24 py-2.5");

export const primaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4b5735] px-4 text-sm font-medium text-white transition hover:bg-[#3d482b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b5735]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e2ded3] bg-white px-4 text-sm font-medium text-[#4b5735] transition hover:bg-[#f5f4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b5735]/20 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-60";

export const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-[#f0eee8] hover:text-[#4b5735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b5735]/20";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-xl border border-[#e9e6de] bg-white p-0 text-[#4b5735] shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
        size === "sm" && "max-w-md",
        size === "md" && "max-w-2xl",
        size === "lg" && "max-w-4xl",
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#eeeae2] px-6 py-5">
        <div>
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className={iconButtonClass}
        >
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
        {open && children}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Xóa",
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  pending?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="text-sm leading-6 text-neutral-600">{message}</div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className={secondaryButtonClass}
          disabled={pending}
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={dangerButtonClass}
          disabled={pending}
        >
          {pending && <LoaderCircle size={16} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-[#4b5735]">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export function FormActions({
  onCancel,
  pending,
  submitLabel,
}: {
  onCancel: () => void;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3 border-t border-[#eeeae2] pt-5">
      <button
        type="button"
        onClick={onCancel}
        className={secondaryButtonClass}
        disabled={pending}
      >
        Hủy
      </button>
      <button type="submit" className={primaryButtonClass} disabled={pending}>
        {pending && <LoaderCircle size={16} className="animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, "pl-9")}
      />
    </div>
  );
}

export function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}
