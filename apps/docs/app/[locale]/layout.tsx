import './global.css'
import { RootProvider } from 'fumadocs-ui/provider'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import { getLocale, getLocales } from 'gt-next/server'
import { GTProvider } from 'gt-next'
import { getLocaleProperties } from 'generaltranslation'
import loadDictionary from '@/loadDictionary'

const inter = Inter({
  subsets: ['latin'],
})

export default async function Layout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const locales = getLocales()
  return (
    <html
      className={inter.className}
      suppressHydrationWarning
      lang={await getLocale()}
    >
      <body className="flex flex-col min-h-screen">
        <GTProvider>
          <RootProvider
            i18n={{
              locale,
              locales: locales.map((locale) => ({
                name: getLocaleProperties(locale).name,
                locale: locale,
              })),
              translations: await loadDictionary(locale),
            }}
          >
            {children}
          </RootProvider>
        </GTProvider>
      </body>
    </html>
  )
}
