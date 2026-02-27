import fs from 'node:fs'
import path from 'node:path'

const DOCS_ROOT = path.resolve(__dirname, '../../../docs')
const OUTPUT_DIR = path.resolve(__dirname, '../generated')

/**
 * Strip numeric ordering prefix from a single name segment.
 * "01-app" → "app", "ci-build-caching" → "ci-build-caching"
 */
function stripPrefix(name: string): string {
  return name.replace(/^\d+-/, '')
}

/**
 * Recursively copy the docs tree into the output directory with stripped
 * numeric prefixes, generating meta.json files to preserve ordering.
 *
 * @param siblingDirs - stripped names of sibling directories at the same level,
 *   passed to root folders so they can extract shared sections
 */
function copyAndGenerate(
  srcDir: string,
  destDir: string,
  siblingDirs?: string[]
): void {
  fs.mkdirSync(destDir, { recursive: true })

  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  // Collect children that have numeric prefixes for meta.json generation.
  // We sort by the original name (which sorts by numeric prefix) and store
  // the stripped name for the pages array.
  const numberedEntries: { original: string; stripped: string }[] = []
  // Track all child directory names (stripped) to pass as siblings to children
  const childDirNames: string[] = []

  for (const entry of entries) {
    const stripped = stripPrefix(entry.name)
    const hasNumericPrefix = /^\d+-/.test(entry.name)

    if (entry.isDirectory()) {
      childDirNames.push(stripped)
      if (hasNumericPrefix) {
        numberedEntries.push({ original: entry.name, stripped })
      }
    } else if (entry.isFile()) {
      const nameWithoutExt = stripped.replace(/\.\w+$/, '')

      if (hasNumericPrefix && nameWithoutExt !== 'index') {
        numberedEntries.push({ original: entry.name, stripped: nameWithoutExt })
      }
      fs.copyFileSync(
        path.join(srcDir, entry.name),
        path.join(destDir, stripped)
      )
    }
  }

  // Recurse into child directories, passing sibling info
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const stripped = stripPrefix(entry.name)
    copyAndGenerate(
      path.join(srcDir, entry.name),
      path.join(destDir, stripped),
      childDirNames
    )
  }

  // Check if this directory contains root folders (app/pages)
  const hasRootChildren =
    childDirNames.includes('app') && childDirNames.includes('pages')

  // Check if index.mdx exists in the output directory
  const hasIndex = fs.existsSync(path.join(destDir, 'index.mdx'))

  // Generate meta.json if this directory had numbered children or an index page
  if (numberedEntries.length > 0 || hasIndex) {
    // Sort by original name to preserve numeric ordering
    numberedEntries.sort((a, b) => a.original.localeCompare(b.original))

    const pages: string[] = []
    const meta: Record<string, unknown> = { pages }
    const dirName = path.basename(destDir)
    const isRoot = dirName === 'app' || dirName === 'pages'

    if (hasRootChildren) {
      // Locale-level meta: only list root dirs (app/pages), skip shared sections
      // (architecture, community) since they're already extracted into each root
      const rootOnly = numberedEntries.filter(
        (e) => e.stripped === 'app' || e.stripped === 'pages'
      )
      pages.push(...rootOnly.map((e) => e.stripped))
      pages.push('...')
    } else if (isRoot) {
      // Root folder meta
      pages.push('index')
      pages.push(...numberedEntries.map((e) => e.stripped))
      pages.push('...')

      meta.root = true

      // Extract shared sibling sections (non-root dirs like architecture, community)
      if (siblingDirs) {
        const sharedSiblings = siblingDirs.filter(
          (name) => name !== 'app' && name !== 'pages'
        )
        if (sharedSiblings.length > 0) {
          pages.push('---')
          for (const sibling of sharedSiblings) {
            pages.push('../' + sibling)
          }
        }
      }
    } else {
      // Regular directory meta
      pages.push(...numberedEntries.map((e) => e.stripped))
      pages.push('...')
    }

    // Read title from index.mdx if it exists
    const indexPath = path.join(destDir, 'index.mdx')
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8')
      const { frontmatter } = parseFrontmatter(indexContent)
      if (frontmatter.title) {
        meta.title = frontmatter.title
      }
    }

    const metaPath = path.join(destDir, 'meta.json')
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')
  }
}

/**
 * Parse frontmatter from an MDX file. Returns the frontmatter as a record
 * and the body content separately.
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>
  body: string
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, body: content }
  }

  const frontmatter: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    // Skip indented lines (nested YAML values)
    if (line.startsWith(' ') || line.startsWith('\t')) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    frontmatter[key] = value
  }

  return { frontmatter, body: match[2] }
}

/**
 * Serialize a frontmatter record back into a YAML frontmatter string.
 */
function serializeFrontmatter(fm: Record<string, string>): string {
  const lines = Object.entries(fm).map(([key, value]) => `${key}: ${value}`)
  return `---\n${lines.join('\n')}\n---\n`
}

/**
 * Scan the generated directory for MDX files with a `source` frontmatter field
 * and replace their body content with the content from the referenced file.
 */
function resolveSourceReferences(generatedDir: string): void {
  const mdxFiles = collectMdxFiles(generatedDir)

  for (const filePath of mdxFiles) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { frontmatter, body: _body } = parseFrontmatter(content)

    if (!frontmatter.source) continue

    // Determine locale from the file path relative to generated dir
    const relPath = path.relative(generatedDir, filePath)
    const locale = relPath.split(path.sep)[0]

    // The source value is a stripped path like "app/guides/ci-build-caching"
    const sourceValue = frontmatter.source
    const targetMdx = path.join(generatedDir, locale, sourceValue + '.mdx')
    const targetIndex = path.join(
      generatedDir,
      locale,
      sourceValue,
      'index.mdx'
    )

    let targetPath: string | null = null
    if (fs.existsSync(targetMdx)) {
      targetPath = targetMdx
    } else if (fs.existsSync(targetIndex)) {
      targetPath = targetIndex
    }

    if (!targetPath) {
      console.warn(
        `Warning: source reference "${sourceValue}" not found for ${relPath}`
      )
      continue
    }

    // Read the target file and extract its body
    const targetContent = fs.readFileSync(targetPath, 'utf-8')
    const { body: sourceBody } = parseFrontmatter(targetContent)

    // Remove the source field from frontmatter and write back with source content
    const newFrontmatter = { ...frontmatter }
    delete newFrontmatter.source

    const newContent = serializeFrontmatter(newFrontmatter) + sourceBody
    fs.writeFileSync(filePath, newContent)
  }
}

/**
 * Recursively collect all .mdx files under a directory.
 */
function collectMdxFiles(dir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectMdxFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      results.push(fullPath)
    }
  }

  return results
}

// --- Main ---

// Clean output directory
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true })
}

console.log(`Generating docs from ${DOCS_ROOT} → ${OUTPUT_DIR}`)

// Step 1 & 2: Copy with stripped prefixes and generate meta.json files
copyAndGenerate(DOCS_ROOT, OUTPUT_DIR)

// Step 3: Resolve source frontmatter references
resolveSourceReferences(OUTPUT_DIR)

console.log('Done.')
