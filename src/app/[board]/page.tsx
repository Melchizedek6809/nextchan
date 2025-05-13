import { get, query } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Post } from "@/components/Post"
import { PostForm } from "@/components/PostForm"
import { Pagination } from "@/components/Pagination"
import { BoardLayout } from "@/components/BoardLayout"
import { getPaginatedThreads } from "@/lib/services/thread-service"
import { MessageSquare, FileText, Clock, Users } from "lucide-react"
import type { Board } from "@/lib/types"

type Props = {
  params: { board: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Number of posts to show per page
const POSTS_PER_PAGE = 3;

export default async function BoardPage(props: Props) {
  // Use object destructuring in the function body instead of parameters
  const params = await props.params;
  const searchParams = (await props.searchParams) || {};
  
  const boardId = params.board;
  
  // Get pagination parameters
  const pageParam = searchParams.page;
  let currentPage = pageParam ? parseInt(pageParam as string) : 1;
  
  // Validate page number
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }
  
  const board = get<Board>(
    'SELECT id, name FROM boards WHERE id = ?',
    [boardId]
  )

  if (!board) {
    notFound()
  }

  // Get paginated threads and pagination details
  const { threads: postsWithReplies, pagination } = await getPaginatedThreads(boardId, currentPage, POSTS_PER_PAGE);
  
  // If user tries to access a page beyond the maximum, redirect to the last valid page
  // But only if there are actual posts (avoid redirect if board is empty)
  if (pagination.totalItems > 0 && currentPage > pagination.totalPages) {
    redirect(`/${boardId}?page=${pagination.totalPages}`);
  }

  // Generate pagination URLs
  const createPageUrl = (page: number) => {
    return `/${boardId}?page=${page}`;
  };
  
  // Get board statistics
  const totalPosts = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM posts WHERE board_id = ?',
    [board.id]
  )?.count || 0;
  
  const totalFiles = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM files WHERE board_id = ?',
    [board.id]
  )?.count || 0;
  
  // Get posts from the last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayAgoString = oneDayAgo.toISOString();
  
  const postsToday = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM posts WHERE board_id = ? AND creation_time > datetime(?)',
    [board.id, oneDayAgoString]
  )?.count || 0;
  
  // Get most recent post time
  const latestPost = get<{ creation_time: string }>(
    'SELECT creation_time FROM posts WHERE board_id = ? ORDER BY creation_time DESC LIMIT 1',
    [board.id]
  );

  return (
    <BoardLayout
      board={board}
      currentView="thread"
      pageNumber={currentPage > 1 ? currentPage : undefined}
    >
      {/* Board stats section */}
      <div className="mb-8 bg-card border rounded-lg p-4 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
        <div className="flex flex-col md:flex-row justify-between gap-4 relative">
          <div>
            <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">/{board.id}/ - {board.name}</h2>
            <p className="text-muted-foreground text-sm">
              Welcome to the {board.name.toLowerCase()} board. Please follow the rules and be respectful to others.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md border-t-2 border-primary/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 mb-1">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="text-lg font-bold text-primary">{totalPosts}</div>
              <div className="text-xs text-muted-foreground">Total Posts</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md border-t-2 border-blue-400/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/15 mb-1">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-lg font-bold text-blue-500">{totalFiles}</div>
              <div className="text-xs text-muted-foreground">Files</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md border-t-2 border-amber-400/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15 mb-1">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-lg font-bold text-amber-500">{postsToday}</div>
              <div className="text-xs text-muted-foreground">Posts Today</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md border-t-2 border-emerald-400/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/15 mb-1">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-sm font-medium text-emerald-500">
                {latestPost ? new Date(latestPost.creation_time).toLocaleString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Latest Post</div>
            </div>
          </div>
        </div>
      </div>

      {/* Post form */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <MessageSquare className="size-4 mr-2 text-primary" />
          <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Create a new thread</span>
        </h3>
        <div className="bg-card border rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-blue-400/50 to-primary/50"></div>
          <PostForm boardId={board.id} />
        </div>
      </div>

      {/* Thread list with header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <span className="bg-gradient-to-br from-blue-500 to-primary bg-clip-text text-transparent">Threads</span>
          </h3>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/50 via-blue-400/30 to-transparent rounded-full"></div>
          <span className="text-sm text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            {pagination.totalItems} {pagination.totalItems === 1 ? 'thread' : 'threads'}
          </span>
        </div>
        
        <div className="space-y-6">
          {postsWithReplies.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-dashed flex flex-col items-center justify-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
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
      
      {/* Pagination Component */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        createPageUrl={createPageUrl}
        itemName="threads"
        totalItems={pagination.totalItems}
      />
    </BoardLayout>
  )
} 