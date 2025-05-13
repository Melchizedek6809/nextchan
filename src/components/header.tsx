import Link from "next/link"
import { query } from "@/lib/db"
import type { Board } from "@/lib/types"

export function Header() {
  const boards = query<Board>('SELECT id, name FROM boards ORDER BY id')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-[1200px] flex h-14 items-center">
        <div className="flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">NextChan</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/${board.id}`}
                className="transition-colors hover:text-foreground/80"
              >
                /{board.id}/
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
} 