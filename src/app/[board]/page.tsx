import { get, query } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Post } from "@/components/Post"
import { PostForm } from "@/components/PostForm"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { HomeIcon } from "lucide-react"

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
  replies?: Post[]
  reply_count?: number
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

  // For each post, get the 3 most recent replies and total reply count
  const postsWithReplies = posts.map(post => {
    // Get total reply count
    const replyCount = get<{ count: number }>(
      'SELECT COUNT(*) as count FROM posts WHERE parent_id = ?',
      [post.id]
    )

    // Get the 3 most recent replies
    const replies = query<Post>(
      'SELECT * FROM posts WHERE parent_id = ? ORDER BY creation_time DESC LIMIT 3',
      [post.id]
    )

    return {
      ...post,
      replies: replies.reverse(), // Show oldest first (like in a conversation)
      reply_count: replyCount ? replyCount.count : 0
    }
  })

  return (
    <div className="container mx-auto max-w-[1200px] py-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <HomeIcon className="size-3.5 mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrent>
            <BreadcrumbLink isCurrent>
              /{board.id}/ - {board.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">
        /{board.id}/ - {board.name}
      </h1>
      
      <div className="mb-8">
        <PostForm boardId={board.id} />
      </div>

      <div className="space-y-6">
        {postsWithReplies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No posts yet. Be the first to post!
          </div>
        ) : (
          postsWithReplies.map((post) => (
            <Post 
              key={post.id} 
              post={post} 
              boardId={board.id} 
              showReplies={true} 
              replyCount={post.reply_count}
            />
          ))
        )}
      </div>
    </div>
  )
} 