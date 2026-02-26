import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { baseOptions } from '@/app/[locale]/layout.config'
import { source } from '@/lib/source'
import { getDefaultLocale, getLocale } from 'gt-next/server'

export default async function Layout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const tree = source.pageTree[locale] ?? source.pageTree[getDefaultLocale()]
  return (
    <DocsLayout tree={tree} {...baseOptions}>
      {children}
    </DocsLayout>
  )
}
