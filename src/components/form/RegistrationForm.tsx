import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { FieldCopy, SuccessCopy } from '@/i18n/types'
import { useI18n } from '@/i18n/useI18n'
import {
  LIMITS,
  clean,
  validateEmail,
  validateOptionalUrl,
  validateText,
  type FieldError,
} from '@/lib/forms'
import { ROUTE } from '@/lib/routes'
import { postJson, type SubmitResult } from '@/lib/submit'
import { buttonGhost, buttonPrimary, cx } from '@/lib/ui'
import { useCurrentYear } from '@/lib/year'
import { CheckboxField, Honeypot, SelectField, TextField } from './Field'
import { ErrorSummary, StatusBox } from './FormNotices'

type FieldKey = 'nama' | 'email' | 'institusi' | 'tahun' | 'bukti' | 'consent'
type Errors = Partial<Record<FieldKey, string>>

interface RegistrationFormProps {
  /** Awalan id elemen (unik per halaman). */
  idPrefix: string
  /** Path di bawah /api/public/, mis. "registrations" atau "activities/{id}/register". */
  endpoint: string
  /** member = pendaftaran anggota (institusi wajib, tahun, tautan bukti); participant = peserta kegiatan. */
  kind: 'member' | 'participant'
  fields: { nama: FieldCopy; email: FieldCopy; institusi: FieldCopy; tahun?: FieldCopy; bukti?: FieldCopy }
  submitLabel: string
  success: SuccessCopy
}

/**
 * Formulir pendaftaran (anggota atau peserta kegiatan). Aturan:
 * - validasi di klien dengan pesan spesifik per kolom (aria-live) + ringkasan galat yang menerima fokus;
 * - tombol kirim nonaktif selama mengirim, timeout 8 detik (lib/submit.ts);
 * - sukses HANYA bila server menjawab { ok: true }. API tidak ada / tak terjangkau → kotak "belum aktif";
 *   TIDAK PERNAH sukses palsu. Pengecualian satu-satunya: kolom jebakan bot (honeypot) terisi → berpura-pura sukses
 *   tanpa mengirim, supaya bot tidak belajar;
 * - isian tidak disimpan di localStorage dan tidak dicatat ke konsol.
 */
export function RegistrationForm({ idPrefix, endpoint, kind, fields, submitLabel, success }: RegistrationFormProps) {
  const { t } = useI18n()
  const f = t.form
  const member = kind === 'member'
  const year = useCurrentYear()
  const yearOptions = useMemo(() => [String(year), String(year + 1)], [year])

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [institusi, setInstitusi] = useState('')
  const [tahunRaw, setTahun] = useState(yearOptions[0])
  const [bukti, setBukti] = useState('')
  const [consent, setConsent] = useState(false)
  const [honey, setHoney] = useState('')

  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [notice, setNotice] = useState<Exclude<SubmitResult, { status: 'ok' }> | null>(null)

  const summaryRef = useRef<HTMLDivElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const [summaryTick, setSummaryTick] = useState(0)
  const [noticeTick, setNoticeTick] = useState(0)

  // Fokus dipindah setelah render: ke ringkasan galat, ke kotak galat kirim, atau ke pesan sukses.
  useEffect(() => {
    if (summaryTick) summaryRef.current?.focus()
  }, [summaryTick])
  useEffect(() => {
    if (noticeTick) noticeRef.current?.focus()
  }, [noticeTick])
  useEffect(() => {
    if (done) successRef.current?.focus()
  }, [done])

  const tahun = yearOptions.includes(tahunRaw) ? tahunRaw : yearOptions[0]
  const id = (name: string) => `${idPrefix}-${name}`

  const describe = (error: FieldError, label: string): string => {
    switch (error.code) {
      case 'required':
        return f.required(label)
      case 'tooShort':
        return f.tooShort(label, error.min)
      case 'tooLong':
        return f.tooLong(label, error.max)
      case 'email':
        return f.invalidEmail
      case 'url':
        return f.invalidUrl(label)
    }
  }

  const validate = (): Errors => {
    const next: Errors = {}
    const check = (key: FieldKey, error: FieldError | null, label: string) => {
      if (error) next[key] = describe(error, label)
    }
    check('nama', validateText(nama, LIMITS.nama.min, LIMITS.nama.max, true), fields.nama.label)
    check('email', validateEmail(email), fields.email.label)
    check('institusi', validateText(institusi, LIMITS.institusi.min, LIMITS.institusi.max, member), fields.institusi.label)
    if (member && fields.bukti) check('bukti', validateOptionalUrl(bukti), fields.bukti.label)
    if (!consent) next.consent = f.consentRequired
    return next
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (sending) return
    setNotice(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setSummaryTick((n) => n + 1)
      return
    }
    // Jebakan bot terisi: pura-pura sukses, tidak ada yang dikirim.
    if (honey.trim() !== '') {
      setDone(true)
      return
    }
    const body = member
      ? {
          nama: clean(nama),
          email: email.trim(),
          institusi: clean(institusi),
          tahun_daftar: Number(tahun),
          ...(bukti.trim() ? { bukti_bayar: bukti.trim() } : {}),
        }
      : {
          nama: clean(nama),
          email: email.trim(),
          ...(clean(institusi) ? { institusi: clean(institusi) } : {}),
        }
    setSending(true)
    const result = await postJson(endpoint, body)
    setSending(false)
    if (result.status === 'ok') {
      // Hapus isian dari memori; tampilan sukses menggantikan formulir.
      setNama('')
      setEmail('')
      setInstitusi('')
      setBukti('')
      setDone(true)
      return
    }
    setNotice(result)
    setNoticeTick((n) => n + 1)
  }

  if (done) {
    return (
      <StatusBox ref={successRef} tone="success" title={success.title}>
        <p className="m-0">{success.body}</p>
      </StatusBox>
    )
  }

  const summary = (['nama', 'email', 'institusi', 'bukti', 'consent'] as const)
    .filter((key) => errors[key])
    .map((key) => ({ id: id(key), message: errors[key] as string }))

  return (
    <form onSubmit={onSubmit} noValidate className="js-only relative grid gap-5" aria-busy={sending}>
      <p className="m-0 text-[0.92rem] text-muted">{f.requiredLegend}</p>
      <ErrorSummary ref={summaryRef} title={f.errorSummary(summary.length)} items={summary} />

      <TextField
        id={id('nama')}
        name="nama"
        label={fields.nama.label}
        hint={fields.nama.hint}
        value={nama}
        onChange={setNama}
        autoComplete="name"
        maxLength={LIMITS.nama.max + 50}
        required
        error={errors.nama}
      />
      <TextField
        id={id('email')}
        name="email"
        type="email"
        inputMode="email"
        label={fields.email.label}
        hint={fields.email.hint}
        value={email}
        onChange={setEmail}
        autoComplete="email"
        maxLength={LIMITS.email.max + 20}
        required
        error={errors.email}
      />
      <TextField
        id={id('institusi')}
        name="institusi"
        label={fields.institusi.label}
        hint={fields.institusi.hint}
        value={institusi}
        onChange={setInstitusi}
        autoComplete="organization"
        maxLength={LIMITS.institusi.max + 50}
        required={member}
        optionalText={member ? undefined : f.optional}
        error={errors.institusi}
      />
      {member && fields.tahun && (
        <SelectField
          id={id('tahun')}
          name="tahun_daftar"
          label={fields.tahun.label}
          hint={fields.tahun.hint}
          value={tahun}
          onChange={setTahun}
          options={yearOptions.map((value) => ({ value, label: value }))}
          required
        />
      )}
      {member && fields.bukti && (
        <TextField
          id={id('bukti')}
          name="bukti_bayar"
          type="url"
          inputMode="url"
          label={fields.bukti.label}
          hint={fields.bukti.hint}
          placeholder={fields.bukti.placeholder}
          value={bukti}
          onChange={setBukti}
          autoComplete="off"
          maxLength={LIMITS.bukti.max + 100}
          optionalText={f.optional}
          error={errors.bukti}
        />
      )}
      <CheckboxField id={id('consent')} name="persetujuan" checked={consent} onChange={setConsent} error={errors.consent}>
        {f.consent.before}
        <a href={ROUTE.privasi} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          {f.consent.link}
          <span className="sr-only"> ({t.common.newTab})</span>
        </a>
        {f.consent.after}
      </CheckboxField>
      <Honeypot value={honey} onChange={setHoney} />

      {notice && (
        <StatusBox
          ref={noticeRef}
          tone="error"
          title={notice.status === 'unavailable' ? f.unavailable.title : f.serverError.title}
        >
          <p className="m-0">
            {notice.status === 'unavailable' && f.unavailable.body}
            {notice.status === 'error' && f.serverError.body}
            {notice.status === 'conflict' && f.conflict}
            {notice.status === 'rate' && f.rateLimited}
            {notice.status === 'rejected' && (notice.message ? f.rejected(notice.message) : f.serverError.body)}
          </p>
          {notice.status === 'unavailable' && (
            <p className="m-0">
              <a href={ROUTE.kontak} className={cx(buttonGhost, 'no-underline')}>
                {f.unavailable.cta}
              </a>
            </p>
          )}
        </StatusBox>
      )}

      <div>
        <button type="submit" disabled={sending} className={cx(buttonPrimary, 'cursor-pointer disabled:cursor-wait disabled:opacity-70')}>
          {sending ? f.sending : submitLabel}
        </button>
      </div>
    </form>
  )
}
