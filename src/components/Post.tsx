import Link from "next/link"

interface Post {
  id: number
  board_id: string
  parent_id: number | null
  message: string
  creation_time: string
  update_time: string
  replies?: Post[]
}

interface PostProps {
  post: Post
  boardId: string
  isMainPost?: boolean
  depth?: number
  inThread?: boolean
  showReplies?: boolean
  replyCount?: number
}

export function Post({ 
  post, 
  boardId, 
  isMainPost = false, 
  depth = 0, 
  inThread = false, 
  showReplies = false,
  replyCount = 0
}: PostProps) {
  // Calculate padding based on depth, with a maximum depth
  const paddingLeft = depth > 0 ? Math.min(depth * 16, 64) : 0
  
  return (
    <div 
      className="mb-4" 
      style={{ paddingLeft: isMainPost ? 0 : paddingLeft }} 
      id={`post-${post.id}`}
    >
      <div className={`bg-card p-4 rounded-md border ${isMainPost ? 'border-primary/50' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm text-muted-foreground">
            <Link 
              href={inThread ? `#post-${post.id}` : `/${boardId}/${post.id}`}
              className="font-medium hover:underline"
            >
              No.{post.id}
            </Link> • {new Date(post.creation_time).toLocaleString()}
            {post.creation_time !== post.update_time && 
              <span className="ml-2 text-xs">(edited)</span>
            }
          </div>
          <div className="flex items-center gap-2">
            {!isMainPost && !inThread && (
              <Link 
                href={`/${boardId}/${post.id}`} 
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View thread
              </Link>
            )}
            {inThread && (
              <Link
                href={`#post-${post.id}`}
                className="text-xs font-mono text-muted-foreground hover:text-foreground"
                title="Link to this post"
              >
                #
              </Link>
            )}
          </div>
        </div>
        <div className="whitespace-pre-wrap break-words">{post.message}</div>
      </div>

      {/* Show nested replies in threads */}
      {inThread && post.replies && post.replies.length > 0 && (
        <div className="mt-2">
          {post.replies.map(reply => (
            <Post 
              key={reply.id} 
              post={reply} 
              boardId={boardId}
              depth={depth + 1}
              inThread={inThread}
            />
          ))}
        </div>
      )}

      {/* Show latest replies on board page */}
      {!inThread && showReplies && post.replies && post.replies.length > 0 && (
        <div className="mt-2 pl-4 border-l-2 border-muted">
          <div className="text-xs text-muted-foreground mb-2 mt-1">
            {replyCount > post.replies.length 
              ? `${replyCount} replies, showing the latest ${post.replies.length}:`
              : `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}:`}
          </div>
          {post.replies.map(reply => (
            <div key={reply.id} className="mb-3 last:mb-0">
              <div className="flex items-start gap-2 text-xs text-muted-foreground mb-1">
                <Link 
                  href={`/${boardId}/${reply.id}`}
                  className="font-medium hover:underline"
                >
                  No.{reply.id}
                </Link>
                <span>•</span>
                <span>{new Date(reply.creation_time).toLocaleString()}</span>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {reply.message.length > 120 
                  ? `${reply.message.substring(0, 120)}...` 
                  : reply.message}
              </div>
            </div>
          ))}
          <div className="mt-2">
            <Link 
              href={`/${boardId}/${post.id}`} 
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center"
            >
              {replyCount > post.replies.length && `View all ${replyCount} replies →`}
              {replyCount <= post.replies.length && `View thread →`}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 