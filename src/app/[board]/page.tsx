import { get } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Post } from "@/components/Post"
import { PostForm } from "@/components/PostForm"
import { Pagination } from "@/components/Pagination"
import { BoardLayout } from "@/components/BoardLayout"
import { getPaginatedThreads } from "@/lib/services/thread-service"
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

  return (
    <BoardLayout
      board={board}
      currentView="thread"
      pageNumber={currentPage > 1 ? currentPage : undefined}
    >
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