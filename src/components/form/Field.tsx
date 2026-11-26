import type { ReactNode } from 'react'
import { cx, fieldLabel } from '@/lib/ui'

const control =
  'min-h-11 w-full min-w-0 rounded-md border bg-surface px-3 font-body text-base text-ink placeholder:text-muted'
const controlBorder = (error: boolean) => (error ? 'border-2 border-accent' : 'border border-muted')

interface FieldFrameProps {
  id: string
  label: string
  required?: boolean
  optionalText?: string
  hint?: string
  error?: string
  children: ReactNode
}

/** Label terlihat + kontrol + petunjuk + pesan galat (aria-live). `children` adalah kontrolnya. */
function FieldFrame({ id, label, required, optionalText, hint, error, children }: FieldFrameProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={fieldLabel}>
        {label}
        {required ? (
          <span aria-hidden="true"> *</span>
        ) : (
          optionalText && <span className="font-normal tracking-normal normal-case"> ({optionalText})</span>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="m-0 text-[0.88rem] text-muted">
          {hint}
        </p>
      )}
      <p id={`${id}-error`} aria-live="polite" className="m-0 text-[0.92rem] font-semibold text-accent empty:hidden">
        {error}
      </p>
    </div>
  )
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

interface TextFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'url'
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'url'
  maxLength?: number
  placeholder?: string
  required?: boolean
  optionalText?: string
  hint?: string
  error?: string
}

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
  maxLength,
  placeholder,
  required,
  optionalText,
  hint,
  error,
}: TextFieldProps) {
  return (
    <FieldFrame id={id} label={label} required={required} optionalText={optionalText} hint={hint} error={error}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        spellCheck={false}
        className={cx(control, controlBorder(Boolean(error)))}
      />
    </FieldFrame>
  )
}

interface SelectFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  hint?: string
  error?: string
  required?: boolean
}

export function SelectField({ id, name, label, value, onChange, options, hint, error, required }: SelectFieldProps) {
  return (
    <FieldFrame id={id} label={label} required={required} hint={hint} error={error}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(control, controlBorder(Boolean(error)), 'cursor-pointer')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  )
}

interface CheckboxFieldProps {
  id: string
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  children: ReactNode
}

/** Kotak centang dengan label (boleh memuat tautan) dan pesan galat. Area klik ≥ 44px. */
export function CheckboxField({ id, name, checked, onChange, error, children }: CheckboxFieldProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-accent"
        />
        <label htmlFor={id} className="cursor-pointer pt-0.5 leading-snug">
          {children}
          <span aria-hidden="true"> *</span>
        </label>
      </div>
      <p id={`${id}-error`} aria-live="polite" className="m-0 text-[0.92rem] font-semibold text-accent empty:hidden">
        {error}
      </p>
    </div>
  )
}

/**
 * Kolom jebakan bot: tidak terlihat, tidak bisa difokus, tidak diumumkan pembaca layar. Manusia tidak
 * mengisinya; bila terisi, formulir berpura-pura sukses tanpa mengirim.
 */
export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="alamat-web">Alamat web</label>
      <input
        id="alamat-web"
        name="alamat_web"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
