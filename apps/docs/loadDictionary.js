import gtConfig from '@/gt.config.json'

export default async function loadDictionary(locale) {
  try {
    const mod = await import(`./public/fuma-content/${locale}.json`)
    return mod.default
  } catch (err) {
    const fallback = await import(
      `./public/fuma-content/${gtConfig.defaultLocale}.json`
    )
    return fallback.default
  }
}
