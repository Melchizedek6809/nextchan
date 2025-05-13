import { get, query, getFilesForPost } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Post } from "@/components/Post"
import { PostForm } from "@/components/PostForm"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, HomeIcon, List, Grid } from "lucide-react"
import type { Post as PostType, Board } from "@/lib/types"

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
  
  // Calculate offset for SQL query
  const offset = (currentPage - 1) * POSTS_PER_PAGE;
  
  const board = get<Board>(
    'SELECT id, name FROM boards WHERE id = ?',
    [boardId]
  )

  if (!board) {
    notFound()
  }

  // Get total number of top-level posts for pagination
  const totalPostsResult = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM posts WHERE board_id = ? AND parent_id IS NULL',
    [board.id]
  );
  
  const totalPosts = totalPostsResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  
  // If user tries to access a page beyond the maximum, redirect to the last valid page
  // But only if there are actual posts (avoid redirect if board is empty)
  if (totalPosts > 0 && currentPage > totalPages) {
    redirect(`/${boardId}?page=${totalPages}`);
  }

  // Get paginated top-level posts
  const posts = query<PostType>(
    'SELECT * FROM posts WHERE board_id = ? AND parent_id IS NULL ORDER BY creation_time DESC LIMIT ? OFFSET ?',
    [board.id, POSTS_PER_PAGE, offset]
  )

  // For each post, get the 3 most recent replies and total reply count
  const postsWithReplies = posts.map(post => {
    // Get total reply count
    const replyCount = get<{ count: number }>(
      'SELECT COUNT(*) as count FROM posts WHERE parent_id = ?',
      [post.id]
    )

    // Get the 3 most recent replies
    const replies = query<PostType>(
      'SELECT * FROM posts WHERE parent_id = ? ORDER BY creation_time DESC LIMIT 3',
      [post.id]
    )

    // Get files for this post
    const files = getFilesForPost(post.id)
    
    // Get files for each reply
    const repliesWithFiles = replies.map(reply => ({
      ...reply,
      files: getFilesForPost(reply.id)
    }))

    return {
      ...post,
      files,
      replies: repliesWithFiles.reverse(), // Show oldest first (like in a conversation)
      reply_count: replyCount ? replyCount.count : 0
    }
  })

  // Generate pagination URLs
  const createPageUrl = (page: number) => {
    return `/${boardId}?page=${page}`;
  };

  return (
    <div className="container mx-auto max-w-[1200px] py-6 px-4 sm:px-6">
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
          {currentPage > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem isCurrent>
                <BreadcrumbLink isCurrent>
                  Page {currentPage}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
        </Breadcrumb>
      </div>
      
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          /{board.id}/ - {board.name}
        </h1>
        
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Button size="sm" variant="default" className="pointer-events-none">
            <List className="mr-1 size-4" />
            Thread View
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${board.id}/catalog`} className="flex items-center">
              <Grid className="mr-1 size-4" />
              Catalog
            </Link>
          </Button>
        </div>
      </div>
      
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
      
      {/* Pagination UI */}
      {totalPages > 1 && (
        <nav aria-label="Board pagination" className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* First page button - only show if not near the beginning */}
            {currentPage > 3 && totalPages > 5 && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="hidden sm:flex"
                aria-label="Go to first page"
              >
                <Link href={createPageUrl(1)} className="flex items-center">
                  <ChevronLeft className="size-3 mr-1" />
                  <ChevronLeft className="size-3 -ml-2" />
                  <span className="ml-1">1</span>
                </Link>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              asChild={currentPage !== 1}
              aria-label="Go to previous page"
              aria-disabled={currentPage === 1}
            >
              {currentPage === 1 ? (
                <span className="flex items-center opacity-50">
                  <ChevronLeft className="size-4 mr-1" />
                  <span className="sm:block hidden">Previous</span>
                </span>
              ) : (
                <Link href={createPageUrl(currentPage - 1)} className="flex items-center">
                  <ChevronLeft className="size-4 mr-1" />
                  <span className="sm:block hidden">Previous</span>
                </Link>
              )}
            </Button>
            
            <div className="flex items-center gap-1 mx-1 sm:mx-2" role="group" aria-label="Page navigation">
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                // Logic to show pages around current page
                let pageNumber: number;
                
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all pages
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  // If at start, show first 5 pages
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // If at end, show last 5 pages
                  pageNumber = totalPages - 4 + i;
                } else {
                  // Show 2 pages before and after current
                  pageNumber = currentPage - 2 + i;
                }
                
                const isCurrentPage = pageNumber === currentPage;
                
                return (
                  <Button 
                    key={pageNumber} 
                    size="sm"
                    variant={isCurrentPage ? "default" : "outline"}
                    className={`w-9 ${isCurrentPage ? "pointer-events-none" : ""}`}
                    asChild={!isCurrentPage}
                    aria-label={`Page ${pageNumber}`}
                    aria-current={isCurrentPage ? "page" : undefined}
                  >
                    {isCurrentPage ? (
                      <span>{pageNumber}</span>
                    ) : (
                      <Link href={createPageUrl(pageNumber)}>
                        {pageNumber}
                      </Link>
                    )}
                  </Button>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              asChild={currentPage !== totalPages}
              aria-label="Go to next page"
              aria-disabled={currentPage === totalPages}
            >
              {currentPage === totalPages ? (
                <span className="flex items-center opacity-50">
                  <span className="sm:block hidden">Next</span>
                  <ChevronRight className="size-4 ml-1" />
                </span>
              ) : (
                <Link href={createPageUrl(currentPage + 1)} className="flex items-center">
                  <span className="sm:block hidden">Next</span>
                  <ChevronRight className="size-4 ml-1" />
                </Link>
              )}
            </Button>
            
            {/* Last page button - only show if not near the end */}
            {currentPage < totalPages - 2 && totalPages > 5 && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="hidden sm:flex"
                aria-label={`Go to last page, page ${totalPages}`}
              >
                <Link href={createPageUrl(totalPages)} className="flex items-center">
                  <span className="mr-1">{totalPages}</span>
                  <ChevronRight className="size-3 ml-1" />
                  <ChevronRight className="size-3 -ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </nav>
      )}
      
      {totalPosts > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages} ({totalPosts} threads total)
        </div>
      )}
    </div>
  )
} 