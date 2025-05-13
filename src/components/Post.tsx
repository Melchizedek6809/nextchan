import Link from "next/link"
import Image from "next/image"
import type { Post as PostType, FileMetadata } from "@/lib/types"

interface PostProps {
  post: PostType
  boardId: string
  isMainPost?: boolean
  depth?: number
  inThread?: boolean
  showReplies?: boolean
  replyCount?: number
  showAllReplies?: boolean
}

export function Post({ 
  post, 
  boardId, 
  isMainPost = false, 
  depth = 0, 
  inThread = false, 
  showReplies = false,
  replyCount = 0,
  showAllReplies = false
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
            {!isMainPost && (
              <Link 
                href={`/${boardId}/${post.id}`} 
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View thread
              </Link>
            )}
            {inThread && (
              <>
                <Link
                  href={`#post-${post.id}`}
                  className="text-xs font-mono text-muted-foreground hover:text-foreground"
                  title="Link to this post"
                >
                  #
                </Link>
                <Link
                  href={`/${boardId}/${post.parent_id || post.id}?reply=${post.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reply
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Display attached files if any */}
        {post.files && post.files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.files.map((file) => (
              <FileAttachment key={file.id} file={file} boardId={boardId} />
            ))}
          </div>
        )}
        
        <div className="whitespace-pre-wrap break-words">{post.message}</div>
      </div>

      {/* Show nested replies in threads */}
      {inThread && post.replies && post.replies.length > 0 && (
        <div className="mt-2">
          {showAllReplies ? (
            // Show all replies
            post.replies.map(reply => (
              <Post 
                key={reply.id} 
                post={reply} 
                boardId={boardId}
                depth={depth + 1}
                inThread={inThread}
              />
            ))
          ) : (
            // Show only the 3 most recent replies
            <>
              {post.replies.length > 3 && (
                <div className="text-xs text-muted-foreground mb-2 pl-4">
                  <Link 
                    href={`/${boardId}/${post.id}`} 
                    className="hover:text-foreground"
                  >
                    {post.replies.length} replies - Click to view all
                  </Link>
                </div>
              )}
              {post.replies.slice(-3).map(reply => (
                <Post 
                  key={reply.id} 
                  post={reply} 
                  boardId={boardId}
                  depth={depth + 1}
                  inThread={inThread}
                />
              ))}
            </>
          )}
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
              
              {/* Display file thumbnails for replies */}
              {reply.files && reply.files.length > 0 && (
                <div className="mb-1 flex flex-wrap gap-1">
                  {reply.files.map((file) => (
                    <Link 
                      key={file.id} 
                      href={`/${boardId}/${reply.id}`}
                      className="inline-block"
                    >
                      <div className="bg-muted w-8 h-8 rounded overflow-hidden flex items-center justify-center text-xs">
                        {file.extension}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
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

// File attachment component
interface FileAttachmentProps {
  file: FileMetadata
  boardId: string
}

function FileAttachment({ file, boardId }: FileAttachmentProps) {
  // Determine file type
  const isImage = file.mime.startsWith('image/');
  
  return (
    <Link 
      href={`/api/files/${file.id}`} 
      target="_blank"
      className="block"
    >
      <div className="bg-muted/50 border rounded overflow-hidden hover:bg-muted transition-colors">
        {isImage ? (
          <div className="w-32 h-32 relative">
            <Image
              src={`/api/files/${file.id}`}
              alt={file.name}
              fill
              sizes="128px"
              className="object-cover"
              unoptimized={true}
            />
          </div>
        ) : (
          <div className="w-32 h-32 flex flex-col items-center justify-center p-2">
            <div className="text-xl mb-1">📄</div>
            <div className="text-xs text-center break-all">
              {file.name}
            </div>
            <div className="text-xs uppercase font-mono mt-1 text-muted-foreground">
              {file.extension}
            </div>
          </div>
        )}
        <div className="px-2 py-1 text-xs truncate border-t">
          {file.name}
        </div>
      </div>
    </Link>
  );
} 