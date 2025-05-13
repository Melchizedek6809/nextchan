import { get, query, getFilesForPost } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import React from "react"
import { Post } from "@/components/Post"
import { PostForm } from "@/components/PostForm"
import { BoardLayout } from "@/components/BoardLayout"
import { Button } from "@/components/ui/button"
import { MessageCircle, CalendarClock, FileText, Reply as ReplyIcon, Link2, ChevronUp } from "lucide-react"
import type { Post as PostType, Board } from "@/lib/types"

type Props = {
  params: { 
    board: string
    post: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function PostPage(props: Props) {
  // Use object destructuring in the function body instead of parameters
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const boardId = params.board
  const postIdString = params.post
  
  const postId = parseInt(postIdString)
  if (isNaN(postId)) {
    notFound()
  }

  const board = get<Board>(
    'SELECT id, name FROM boards WHERE id = ?',
    [boardId]
  )

  if (!board) {
    notFound()
  }

  const post = get<PostType>(
    'SELECT * FROM posts WHERE id = ? AND board_id = ?',
    [postId, board.id]
  )

  if (!post) {
    notFound()
  }

  // Check if we're replying to a specific post
  const replyToId = searchParams.reply ? Number(searchParams.reply) : undefined;

  // Get the parent thread hierarchy if this is a reply to another post
  const threadHierarchy: PostType[] = [];
  
  // Function to build thread hierarchy
  function buildThreadHierarchy(postId: number | null) {
    if (!postId) return;
    
    const parentPost = get<PostType>(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );
    
    if (parentPost) {
      // Add to the beginning of the array to maintain hierarchy order
      threadHierarchy.unshift(parentPost);
      
      // Continue up the chain if there's a parent
      if (parentPost.parent_id) {
        buildThreadHierarchy(parentPost.parent_id);
      }
    }
  }
  
  // Only build hierarchy if this is a reply post
  if (post.parent_id) {
    buildThreadHierarchy(post.parent_id);
  }

  // This function recursively fetches all replies
  function getPostWithReplies(parentId: number): PostType {
    const parentPost = get<PostType>(
      'SELECT * FROM posts WHERE id = ?',
      [parentId]
    )

    if (!parentPost) {
      notFound()
    }

    // Get direct replies to this post
    const replies = query<PostType>(
      'SELECT * FROM posts WHERE parent_id = ? ORDER BY creation_time ASC',
      [parentId]
    )

    // For each reply, recursively get its replies
    const repliesWithChildren = replies.map(reply => getPostWithReplies(reply.id))
    
    // Get files for this post
    const files = getFilesForPost(parentId)
    
    return {
      ...parentPost,
      files,
      replies: repliesWithChildren
    }
  }

  // Get the main post with all its nested replies
  const postWithReplies = getPostWithReplies(postId)

  // Get a preview of the post content for the breadcrumb
  const postPreview = post.message.length > 30 
    ? post.message.substring(0, 30) + '...' 
    : post.message;

  // Find the target post if we're replying to a specific post
  let replyToPost: PostType | undefined = undefined;
  if (replyToId) {
    replyToPost = get<PostType>(
      'SELECT * FROM posts WHERE id = ?',
      [replyToId]
    );
  }

  // Generate a short preview for each post in the thread hierarchy
  function getShortPreview(message: string): string {
    // Make previews shorter to prevent breadcrumb wrapping issues
    return message.length > 10 ? message.substring(0, 10) + '...' : message;
  }
  
  // Create breadcrumb items for BoardLayout
  const breadcrumbItems = [
    ...(threadHierarchy.map(threadPost => ({
      label: `#${threadPost.id}`,
      href: `/${board.id}/${threadPost.id}`
    }))),
    {
      label: `#${post.id}`,
      isCurrent: true
    }
  ];
  
  // Calculate thread stats
  const totalReplies = countTotalReplies(postWithReplies);
  const uniquePosters = countUniquePosters(postWithReplies);
  const totalFiles = countTotalFiles(postWithReplies);
  
  // Functions to calculate thread statistics
  function countTotalReplies(post: PostType): number {
    if (!post.replies || post.replies.length === 0) return 0;
    return post.replies.length + post.replies.reduce((sum, reply) => sum + countTotalReplies(reply), 0);
  }
  
  function countTotalFiles(post: PostType): number {
    const currentPostFiles = post.files?.length || 0;
    if (!post.replies || post.replies.length === 0) return currentPostFiles;
    
    return currentPostFiles + post.replies.reduce((sum, reply) => {
      return sum + countTotalFiles(reply);
    }, 0);
  }
  
  function countUniquePosters(post: PostType): number {
    const posterSet = new Set<string>();
    
    // Add a placeholder for the poster of the current post
    // In a real system with user IDs, you'd use those
    posterSet.add(`poster-${post.id}`);
    
    function addPosterRecursively(currentPost: PostType) {
      if (currentPost.replies && currentPost.replies.length > 0) {
        for (const reply of currentPost.replies) {
          posterSet.add(`poster-${reply.id}`);
          addPosterRecursively(reply);
        }
      }
    }
    
    addPosterRecursively(post);
    return posterSet.size;
  }

  return (
    <BoardLayout
      board={board}
      currentView="thread"
      breadcrumbItems={breadcrumbItems}
    >
      {/* Thread info card */}
      <div className="mb-6 bg-card border rounded-lg shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none"></div>
        <div className="p-4 border-b bg-muted/30">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <MessageCircle className="size-5 text-primary" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                Thread #{post.id}
              </span>
            </h1>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarClock className="size-4" />
                <span>Created {new Date(post.creation_time).toLocaleDateString()}</span>
              </div>
              
              <Link 
                href="#reply-form" 
                className="bg-gradient-to-r from-primary/80 to-blue-500/80 hover:from-primary hover:to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-all shadow-sm"
              >
                <ReplyIcon className="size-3.5" />
                Reply to Thread
              </Link>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 border-primary/20 hover:bg-primary/5"
                asChild
              >
                <Link href={`/${board.id}`}>
                  <ChevronUp className="size-3.5" />
                  Back to Board
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-4 text-sm">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="text-center p-1.5 rounded-md bg-primary/5">
              <div className="text-lg font-bold text-primary">{totalReplies}</div>
              <div className="text-xs text-muted-foreground">Replies</div>
            </div>
            <div className="text-center p-1.5 rounded-md bg-blue-500/5">
              <div className="text-lg font-bold text-blue-500">{totalFiles}</div>
              <div className="text-xs text-muted-foreground">Files</div>
            </div>
            <div className="text-center p-1.5 rounded-md bg-amber-500/5">
              <div className="text-lg font-bold text-amber-500">{uniquePosters}</div>
              <div className="text-xs text-muted-foreground">Posters</div>
            </div>
            <div className="text-center p-1.5 rounded-md bg-emerald-500/5">
              <div className="text-lg font-bold text-emerald-500">{Math.max(1, Math.floor(totalReplies / 10))}</div>
              <div className="text-xs text-muted-foreground">Pages</div>
            </div>
            <div className="text-center col-span-2 md:col-span-2 flex items-center justify-center p-1.5 rounded-md bg-slate-500/5">
              <div className="text-xs flex items-center gap-2">
                <Link2 className="size-3.5 text-blue-500" />
                <span className="text-muted-foreground">Share URL: </span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs border border-border/50">{`/${board.id}/${post.id}`}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main thread post and all replies */}
      <div className="mb-8">
        <Post post={postWithReplies} boardId={board.id} isMainPost inThread showAllReplies={postId === replyToId} />
      </div>

      {/* Reply form section */}
      <div id="reply-form" className="pt-4 mt-8 border-t border-t-primary/10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ReplyIcon className="size-4 text-primary" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Reply to this Thread</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1 pl-6">
            Your reply will be added to this thread. Please follow the board rules when posting.
          </p>
        </div>
        
        {replyToPost && replyToId !== postId && (
          <div className="mb-6 bg-gradient-to-r from-primary/5 to-blue-500/5 p-4 rounded-lg border border-primary/15">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium flex items-center gap-1">
                <ReplyIcon className="size-3.5 text-primary" />
                Replying to:
              </div>
              <Link 
                href={`/${board.id}/${postId}`}
                className="text-xs text-primary hover:text-blue-500 transition-colors"
              >
                Clear
              </Link>
            </div>
            <div className="pl-4 border-l-2 border-primary/20">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                <div className="bg-primary/10 px-1.5 py-0.5 rounded-full">
                  <Link 
                    href={`#post-${replyToPost.id}`} 
                    className="font-medium hover:text-primary transition-colors"
                  >
                    No.{replyToPost.id}
                  </Link>
                </div>
                <span>•</span>
                <time dateTime={replyToPost.creation_time}>
                  {new Date(replyToPost.creation_time).toLocaleString()}
                </time>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {replyToPost.message.length > 120 
                  ? `${replyToPost.message.substring(0, 120)}...` 
                  : replyToPost.message}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-card border rounded-lg p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500/50 to-primary"></div>
          <PostForm boardId={board.id} parentId={post.id} />
        </div>
        
        {/* Back to top button - only visible on large threads */}
        {totalReplies > 5 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 border-primary/20"
              asChild
            >
              <Link href="#" className="flex items-center gap-1">
                <ChevronUp className="size-3.5" />
                Back to Top
              </Link>
            </Button>
          </div>
        )}
      </div>
    </BoardLayout>
  )
} 