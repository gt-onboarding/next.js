import { source } from '@/lib/source'
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { getMDXComponents } from '@/mdx-components'
import { getDefaultLocale } from 'gt-next/server'

export default async function Page(props: {
  params: Promise<{ slug?: string[]; locale?: string }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug, params.locale)
  if (!page) notFound()

  const { body: MDXContent, toc } = await page.data.load()

  const isApp = params.slug?.includes('app')
  const isPages = params.slug?.includes('pages')

  return (
    <DocsPage toc={toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={getMDXComponents(
            {
              // this allows you to link to other pages with relative file paths
              a: createRelativeLink(source, page),
            },
            { isApp, isPages }
          )}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  const allParams = source.generateParams('slug', 'locale')
  // Only prerender English pages at build time; other locales render on-demand
  return allParams.filter(
    (p: { locale?: string }) => p.locale === getDefaultLocale()
  )
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[]; locale?: string }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug, params.locale)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
