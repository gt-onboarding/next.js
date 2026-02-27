import type { PageTree } from 'fumadocs-core/server'
import { searchPath } from 'fumadocs-core/breadcrumb'
import Link from 'fumadocs-core/link'

/**
 * Renders cards linking to child pages when the current page is a folder index.
 * Returns null for leaf pages (safe to include on every docs page).
 */
export function ChildCards({
  tree,
  pageUrl,
}: {
  tree: PageTree.Root
  pageUrl: string
}) {
  const path = searchPath(tree.children, pageUrl)
  if (!path) return null

  const last = path[path.length - 1]

  let folder: PageTree.Folder | undefined

  if (last.type === 'folder' && last.index?.url === pageUrl) {
    folder = last
  } else if (path.length >= 2) {
    const parent = path[path.length - 2]
    if (parent.type === 'folder' && parent.index?.url === pageUrl) {
      folder = parent
    }
  }

  if (!folder) return null

  const items = folder.children.filter(
    (child): child is PageTree.Item | PageTree.Folder =>
      child.type === 'page' || child.type === 'folder'
  )

  if (items.length === 0) return null

  return (
    <div className="not-prose mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const url = item.type === 'folder' ? item.index?.url : item.url
        const name = item.name
        const description = item.description

        if (!url) return null

        return (
          <Link
            key={url}
            href={url}
            className="block rounded-lg border border-fd-border bg-fd-card p-5 text-fd-card-foreground transition-colors hover:bg-fd-accent/80"
          >
            <h3 className="mb-1 text-base font-semibold">{name}</h3>
            {description ? (
              <p className="my-0 text-sm text-fd-muted-foreground">
                {description}
              </p>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
