import { get, query } from "@/lib/db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

type Props = {
  params: { 
    board: string
    post: string
  }
}

interface Post {
  id: number
  board_id: string
  parent_id: number | null
  message: string
  creation_time: string
  update_time: string
  // For replies only
  replies?: Post[]
}

export default async function PostPage(props: Props) {
  // Use object destructuring in the function body instead of parameters
  const params = await props.params;
  const boardId = params.board
  const postIdString = params.post
  
  const postId = parseInt(postIdString)
  if (isNaN(postId)) {
    notFound()
  }

  const board = get<{ id: string; name: string }>(
    'SELECT id, name FROM boards WHERE id = ?',
    [boardId]
  )

  if (!board) {
    notFound()
  }

  const post = get<Post>(
    'SELECT * FROM posts WHERE id = ? AND board_id = ?',
    [postId, board.id]
  )

  if (!post) {
    notFound()
  }

  // This function recursively fetches all replies
  function getPostWithReplies(parentId: number): Post {
    const parentPost = get<Post>(
      'SELECT * FROM posts WHERE id = ?',
      [parentId]
    )

    if (!parentPost) {
      notFound()
    }

    // Get direct replies to this post
    const replies = query<Post>(
      'SELECT * FROM posts WHERE parent_id = ? ORDER BY creation_time ASC',
      [parentId]
    )

    // For each reply, recursively get its replies
    const repliesWithChildren = replies.map(reply => getPostWithReplies(reply.id))
    
    return {
      ...parentPost,
      replies: repliesWithChildren
    }
  }

  // Get the main post with all its nested replies
  const postWithReplies = getPostWithReplies(postId)

  return (
    <div className="container mx-auto max-w-[1200px] py-6">
      <div className="mb-6 flex items-center gap-2">
        <Link href={`/${board.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to /{board.id}/
        </Link>
        <span className="text-muted-foreground mx-2">|</span>
        <h1 className="text-xl font-semibold">
          Thread #{post.id}
        </h1>
      </div>

      <PostCard post={postWithReplies} boardId={board.id} isMainPost />

      <div className="mt-8 bg-card p-4 rounded-md border">
        <h2 className="text-lg font-medium mb-3">Reply to this thread</h2>
        <form action="/api/reply" method="post">
          <input type="hidden" name="boardId" value={board.id} />
          <input type="hidden" name="parentId" value={post.id.toString()} />
          <Textarea 
            name="message"
            placeholder="What's your reply?"
            className="min-h-[120px] mb-3"
            required
          />
          <div className="flex justify-end">
            <Button type="submit">
              Reply
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface PostCardProps {
  post: Post
  boardId: string
  isMainPost?: boolean
  depth?: number
}

function PostCard({ post, boardId, isMainPost = false, depth = 0 }: PostCardProps) {
  // Calculate padding based on depth, with a maximum depth
  const paddingLeft = depth > 0 ? Math.min(depth * 16, 64) : 0
  
  return (
    <div className="mb-4" style={{ paddingLeft: isMainPost ? 0 : paddingLeft }} id={`post-${post.id}`}>
      <div className={`bg-card p-4 rounded-md border ${isMainPost ? 'border-primary/50' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm text-muted-foreground">
            <Link 
              href={`#post-${post.id}`}
              className="font-medium hover:underline"
            >
              No.{post.id}
            </Link> • {new Date(post.creation_time).toLocaleString()}
            {post.creation_time !== post.update_time && 
              <span className="ml-2 text-xs">(edited)</span>
            }
          </div>
          <div className="flex items-center gap-2">
            {!isMainPost && (
              <Link 
                href={`/${boardId}/${post.id}`} 
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View Thread
              </Link>
            )}
            <Link
              href={`#post-${post.id}`}
              className="text-xs font-mono text-muted-foreground hover:text-foreground"
              title="Link to this post"
            >
              #
            </Link>
          </div>
        </div>
        <div className="whitespace-pre-wrap break-words">{post.message}</div>
      </div>

      {post.replies && post.replies.length > 0 && (
        <div className="mt-2">
          {post.replies.map(reply => (
            <PostCard 
              key={reply.id} 
              post={reply} 
              boardId={boardId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
} 