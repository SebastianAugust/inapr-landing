import { useTheme, type ThemePreference } from '@/hooks/useTheme'
import { useI18n } from '@/i18n/useI18n'
import { SegmentedToggle } from './SegmentedToggle'

export function ThemeToggle() {
  const { t } = useI18n()
  const { preference, setPreference } = useTheme()
  const options: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t.nav.themes.light },
    { value: 'dark', label: t.nav.themes.dark },
    { value: 'system', label: t.nav.themes.system },
  ]
  return (
    <SegmentedToggle label={t.nav.themeLabel} options={options} value={preference} onChange={setPreference} />
  )
}
