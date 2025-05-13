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

  // Get a preview of the post content for the breadcrumb
  const postPreview = post.message.length > 30 
    ? post.message.substring(0, 30) + '...' 
    : post.message;

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
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${board.id}`}>
              /{board.id}/ - {board.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrent>
            <BreadcrumbLink isCurrent>
              Thread #{post.id} - {postPreview}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <Post post={postWithReplies} boardId={board.id} isMainPost inThread />

      <div className="mt-8">
        <PostForm boardId={board.id} parentId={post.id} />
      </div>
    </div>
  )
} 