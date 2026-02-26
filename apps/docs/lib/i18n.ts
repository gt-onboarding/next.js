import { defineI18n } from 'fumadocs-core/i18n'
import { getDefaultLocale, getLocales } from 'gt-next/server'

export const i18n = defineI18n({
  languages: getLocales(),
  defaultLanguage: getDefaultLocale(),
  fallbackLanguage: getDefaultLocale(),
})
