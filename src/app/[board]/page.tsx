import { get, query } from "@/lib/db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

type Props = {
  params: { board: string }
}

interface Post {
  id: number
  board_id: string
  parent_id: number | null
  message: string
  creation_time: string
  update_time: string
}

export default async function BoardPage(props: Props) {
  // Use object destructuring in the function body instead of parameters
  const params = await props.params;
  const boardId = params.board
  
  const board = get<{ id: string; name: string }>(
    'SELECT id, name FROM boards WHERE id = ?',
    [boardId]
  )

  if (!board) {
    notFound()
  }

  // Get all top-level posts (where parent_id is null)
  const posts = query<Post>(
    'SELECT * FROM posts WHERE board_id = ? AND parent_id IS NULL ORDER BY creation_time DESC',
    [board.id]
  )

  return (
    <div className="container mx-auto max-w-[1200px] py-6">
      <h1 className="text-2xl font-bold mb-6">
        /{board.id}/ - {board.name}
      </h1>
      
      <div className="mb-8 bg-card p-4 rounded-md border">
        <h2 className="text-lg font-medium mb-3">Create a new post</h2>
        <form action="/api/post" method="post">
          <input type="hidden" name="boardId" value={board.id} />
          <Textarea 
            name="message"
            placeholder="What's on your mind?"
            className="min-h-[120px] mb-3"
            required
          />
          <div className="flex justify-end">
            <Button type="submit">
              Post
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No posts yet. Be the first to post!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-card p-4 rounded-md border">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-muted-foreground">
                  <Link 
                    href={`/${board.id}/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    No.{post.id}
                  </Link> • {new Date(post.creation_time).toLocaleString()}
                </div>
                <Link 
                  href={`/${board.id}/${post.id}`} 
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View thread
                </Link>
              </div>
              <div className="whitespace-pre-wrap break-words">{post.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 