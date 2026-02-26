export default async function loadTranslations(locale) {
  try {
    if (locale === 'ja') {
      return (await import(`./public/_gt/ja.json`)).default
    }
    return {}
  } catch (error) {
    console.warn(`Failed to load translations for locale ${locale}:`, error)
    return {}
  }
}
