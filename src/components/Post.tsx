import Link from "next/link"
import Image from "next/image"
import { MessageSquare, MessageCircle, Share2, Eye, Clock, Reply, Link2 } from "lucide-react"
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
      className="mb-4 relative group" 
      style={{ paddingLeft: isMainPost ? 0 : paddingLeft }} 
      id={`post-${post.id}`}
    >
      <div className={`bg-card p-4 rounded-lg border ${isMainPost ? 'border-primary/40 shadow-sm' : 'hover:border-primary/25 transition-all duration-200'}`}>
        {/* Post header with metadata */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-primary/10 px-2 py-0.5 rounded-full">
              <Link 
                href={inThread ? `#post-${post.id}` : `/${boardId}/${post.id}`}
                className="font-medium hover:text-primary transition-colors"
              >
                No.{post.id}
              </Link>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3" />
              <time dateTime={post.creation_time}>
                {new Date(post.creation_time).toLocaleString()}
              </time>
              {post.creation_time !== post.update_time && 
                <span className="ml-1 text-xs rounded-full bg-muted px-1.5 py-0.5">(edited)</span>
              }
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isMainPost && (
              <Link 
                href={`/${boardId}/${post.id}`} 
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
              >
                <Eye className="size-3" />
                <span>View</span>
              </Link>
            )}
            {inThread && (
              <>
                <Link
                  href={`#post-${post.id}`}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                  title="Link to this post"
                >
                  <Link2 className="size-3" />
                  <span>Link</span>
                </Link>
                <Link
                  href={`/${boardId}/${post.parent_id || post.id}?reply=${post.id}`}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                >
                  <Reply className="size-3" />
                  <span>Reply</span>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Display attached files if any */}
        {post.files && post.files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {post.files.map((file) => (
              <FileAttachment key={file.id} file={file} boardId={boardId} />
            ))}
          </div>
        )}
        
        {/* Post content with styling */}
        <div className="whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
          {post.message}
        </div>
      </div>

      {/* Show nested replies in threads */}
      {inThread && post.replies && post.replies.length > 0 && (
        <div className="mt-3 relative">
          <div className="absolute left-0 w-0.5 h-full bg-border rounded"></div>
          
          {showAllReplies ? (
            // Show all replies
            <div className="pl-4">
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
          ) : (
            // Show only the 3 most recent replies
            <div className="pl-4">
              {post.replies.length > 3 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 py-1 px-2 bg-muted/50 rounded-md">
                  <MessageSquare className="size-3 text-primary" />
                  <Link 
                    href={`/${boardId}/${post.id}`} 
                    className="hover:text-primary transition-colors"
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
            </div>
          )}
        </div>
      )}

      {/* Show latest replies on board page */}
      {!inThread && showReplies && post.replies && post.replies.length > 0 && (
        <div className="mt-2 pl-5 border-l-2 border-muted relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted/50"></div>
          
          <div className="flex items-center gap-1 text-xs mb-3 py-1 px-2 bg-muted/30 rounded-md w-fit">
            <MessageCircle className="size-3.5 text-primary" />
            <span className="text-muted-foreground">
              {replyCount > post.replies.length 
                ? `${replyCount} replies, showing the latest ${post.replies.length}:`
                : `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}:`}
            </span>
          </div>
          
          <div className="space-y-3">
            {post.replies.map(reply => (
              <div key={reply.id} className="bg-card/50 p-3 rounded-md border border-muted/50 hover:border-muted/80 transition-colors">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <div className="bg-primary/5 px-1.5 py-0.5 rounded-full">
                    <Link 
                      href={`/${boardId}/${reply.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      No.{reply.id}
                    </Link>
                  </div>
                  <span>•</span>
                  <time dateTime={reply.creation_time}>
                    {new Date(reply.creation_time).toLocaleString()}
                  </time>
                </div>
                
                {/* Display file thumbnails for replies */}
                {reply.files && reply.files.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {reply.files.map((file) => (
                      <Link 
                        key={file.id} 
                        href={`/${boardId}/${reply.id}`}
                        className="inline-block"
                      >
                        {file.mime.startsWith('image/') ? (
                          <div className="w-10 h-10 rounded overflow-hidden relative">
                            <Image
                              src={`/api/files/${file.id}`}
                              alt={file.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized={true}
                            />
                          </div>
                        ) : (
                          <div className="bg-muted w-10 h-10 rounded overflow-hidden flex items-center justify-center text-xs">
                            {file.extension}
                          </div>
                        )}
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
          </div>
          
          <div className="mt-3">
            <Link 
              href={`/${boardId}/${post.id}`} 
              className="text-xs bg-muted/30 hover:bg-muted/50 transition-colors px-3 py-1.5 rounded-md inline-flex items-center gap-1"
            >
              <Eye className="size-3.5" />
              {replyCount > post.replies.length && `View all ${replyCount} replies`}
              {replyCount <= post.replies.length && `View thread`}
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
      className="group"
    >
      <div className="bg-muted/30 border rounded-lg overflow-hidden hover:bg-muted/50 hover:shadow-sm hover:border-primary/30 transition-all duration-200">
        {isImage ? (
          <div className="w-36 h-36 relative">
            <Image
              src={`/api/files/${file.id}`}
              alt={file.name}
              fill
              sizes="144px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
              <div className="text-xs text-white font-medium">View full size</div>
            </div>
          </div>
        ) : (
          <div className="w-36 h-36 flex flex-col items-center justify-center p-3 group-hover:bg-muted/40 transition-colors">
            <div className="text-2xl mb-1">📄</div>
            <div className="text-xs text-center break-all">
              {file.name}
            </div>
            <div className="text-xs uppercase font-mono mt-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {file.extension}
            </div>
          </div>
        )}
        <div className="px-2 py-1.5 text-xs truncate border-t bg-card/50">
          {file.name}
        </div>
      </div>
    </Link>
  );
} 