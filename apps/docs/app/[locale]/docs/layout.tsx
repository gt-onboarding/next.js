import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { baseOptions } from '@/app/[locale]/layout.config'
import { source } from '@/lib/source'
import { useLocale } from 'gt-next'
import { getDefaultLocale } from 'gt-next/server'

export default function Layout({ children }: { children: ReactNode }) {
  const locale = useLocale()
  const tree = source.pageTree[locale] ?? source.pageTree[getDefaultLocale()]
  return (
    <DocsLayout tree={tree} {...baseOptions}>
      {children}
    </DocsLayout>
  )
}
