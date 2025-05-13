import { query } from "@/lib/db"
import Link from "next/link"
import type { Board } from "@/lib/types"

export default function Home() {
  const boards = query<Board>('SELECT id, name FROM boards ORDER BY id')

  return (
    <div className="container mx-auto max-w-[1200px] py-6">
      <div className="flex flex-col gap-8">
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Welcome to NextChan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            An imageboard built with Next.js, TypeScript, and SQLite. Choose a board below to start browsing or posting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boards.map(board => (
            <Link 
              key={board.id}
              href={`/${board.id}`}
              className="block p-6 bg-card rounded-lg border hover:border-primary transition-colors"
            >
              <h2 className="text-xl font-bold mb-2">/{board.id}/ - {board.name}</h2>
              <p className="text-muted-foreground">Browse the {board.name.toLowerCase()} board</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
