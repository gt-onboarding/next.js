import { T } from 'gt-next'
import Link from 'next/link'

export default function NotFound() {
  return (
    <T>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-gray-600">Page not found</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Go back home
        </Link>
      </div>
    </T>
  )
}
