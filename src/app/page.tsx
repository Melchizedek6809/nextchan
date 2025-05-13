import { query, get } from "@/lib/db"
import Link from "next/link"
import type { Board } from "@/lib/types"
import { MessageSquare, Sparkles, ArrowRight, TrendingUp, Activity, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const boards = query<Board>('SELECT id, name FROM boards ORDER BY id')
  
  // Get actual statistics from database
  const totalThreads = get<{count: number}>('SELECT COUNT(*) as count FROM posts WHERE parent_id IS NULL')
  const totalPosts = get<{count: number}>('SELECT COUNT(*) as count FROM posts')
  const totalFiles = get<{count: number}>('SELECT COUNT(*) as count FROM files')
  
  // Get posts from the last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  const oneDayAgoString = oneDayAgo.toISOString()
  
  const postsToday = get<{count: number}>(
    'SELECT COUNT(*) as count FROM posts WHERE creation_time > datetime(?)',
    [oneDayAgoString]
  )

  return (
    <div className="container mx-auto max-w-[1200px] py-6">
      {/* Hero Section with gradient background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 mb-10">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="text-center py-20 px-6 relative">
          <div className="mb-2 flex items-center justify-center">
            <span className="relative inline-flex h-8 overflow-hidden rounded-full p-[1px]">
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,theme(colors.pink.500)_0%,theme(colors.purple.500)_50%,theme(colors.indigo.500)_100%)]" />
              <div className="inline-flex h-full items-center justify-center rounded-full bg-background/90 px-4 py-1 text-sm text-foreground backdrop-blur-3xl">
                <Sparkles className="size-3.5 mr-1 text-pink-500" />
                <span>Nextchan v1.0</span>
              </div>
            </span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-md">Welcome to NextChan</h1>
          <p className="text-white/90 max-w-lg mx-auto text-lg backdrop-blur-sm bg-black/10 rounded-full px-6 py-2 inline-block">
            An imageboard built with Next.js, TypeScript, and SQLite
          </p>
          
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild variant="default" size="lg" className="gap-2 group">
              <Link href={boards.length > 0 ? `/${boards[0]?.id}` : '#'}>
                Browse Boards
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 bg-primary/10 rounded-full mb-2">
              <MessageSquare className="size-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{totalThreads?.count || 0}</div>
            <div className="text-xs text-muted-foreground">Active Threads</div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 bg-blue-500/10 rounded-full mb-2">
              <Activity className="size-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{postsToday?.count || 0}</div>
            <div className="text-xs text-muted-foreground">Daily Posts</div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 bg-green-500/10 rounded-full mb-2">
              <TrendingUp className="size-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{totalFiles?.count || 0}</div>
            <div className="text-xs text-muted-foreground">Total Images</div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 bg-amber-500/10 rounded-full mb-2">
              <Users className="size-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold">{totalPosts?.count || 0}</div>
            <div className="text-xs text-muted-foreground">Total Posts</div>
          </div>
        </div>
      </div>

      {/* Boards Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Available Boards</h2>
          <div className="h-1 grow bg-gradient-to-r from-primary/50 to-transparent rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boards.map((board) => {
            // Get board-specific statistics
            const boardThreads = get<{count: number}>(
              'SELECT COUNT(*) as count FROM posts WHERE board_id = ? AND parent_id IS NULL',
              [board.id]
            );
            
            const boardPostsToday = get<{count: number}>(
              'SELECT COUNT(*) as count FROM posts WHERE board_id = ? AND creation_time > datetime(?)',
              [board.id, oneDayAgoString]
            );
            
            return (
              <Link 
                key={board.id}
                href={`/${board.id}`}
                className="group flex items-start p-6 bg-card rounded-xl border hover:border-primary transition-all hover:shadow-md hover:shadow-primary/5"
              >
                <div className="mr-4 p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <MessageSquare className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">/{board.id}/ - {board.name}</h2>
                  <p className="text-muted-foreground">Browse the {board.name.toLowerCase()} board</p>
                  <div className="mt-2 text-xs text-muted-foreground/80">
                    {boardThreads?.count || 0} threads • {boardPostsToday?.count || 0} posts today
                  </div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="size-4 text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-16 pt-6 border-t text-center">
        <p className="text-sm text-muted-foreground">
          Powered by <span className="text-primary font-medium">Next.js</span>, <span className="text-primary font-medium">TypeScript</span>, and <span className="text-primary font-medium">SQLite</span>
        </p>
      </div>
    </div>
  );
}
