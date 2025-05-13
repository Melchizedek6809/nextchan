import { get, query, getFilesForPost } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { BoardLayout } from "@/components/BoardLayout"
import { Button } from "@/components/ui/button"
import { Eye, MessageSquare, FileText, Clock, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import type { Post as PostType, Board } from "@/lib/types"

type Props = {
  params: { board: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Number of threads to show per page
const THREADS_PER_PAGE = 12;

export default async function CatalogPage(props: Props) {
  const params = await props.params;
  const searchParams = props.searchParams || {};
  
  const boardId = params.board;
  
  // Get pagination parameters
  const pageParam = searchParams.page;
  let currentPage = pageParam ? parseInt(pageParam as string) : 1;
  
  // Validate page number
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }
  
  // Calculate offset for SQL query
  const offset = (currentPage - 1) * THREADS_PER_PAGE;
  
  const board = get<Board>(
    'SELECT id, name FROM boards WHERE id = ?',
    [boardId]
  )

  if (!board) {
    notFound()
  }

  // Get total number of threads for pagination
  const totalThreadsResult = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM posts WHERE board_id = ? AND parent_id IS NULL',
    [board.id]
  );
  
  const totalThreads = totalThreadsResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalThreads / THREADS_PER_PAGE));
  
  // If user tries to access a page beyond the maximum, redirect to the last valid page
  if (totalThreads > 0 && currentPage > totalPages) {
    redirect(`/${boardId}/catalog?page=${totalPages}`);
  }

  // Get paginated threads
  const threads = query<PostType>(
    'SELECT * FROM posts WHERE board_id = ? AND parent_id IS NULL ORDER BY creation_time DESC LIMIT ? OFFSET ?',
    [board.id, THREADS_PER_PAGE, offset]
  )

  // Get reply counts and files for each thread
  const threadsWithFiles = threads.map(thread => {
    // Get reply count
    const replyCount = get<{ count: number }>(
      'SELECT COUNT(*) as count FROM posts WHERE parent_id = ?',
      [thread.id]
    );

    // Get files for this thread
    const files = getFilesForPost(thread.id);
    
    return {
      ...thread,
      reply_count: replyCount ? replyCount.count : 0,
      files
    };
  });

  // Function to truncate text to a specific length
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Generate pagination URLs
  const createPageUrl = (page: number) => {
    return `/${boardId}/catalog?page=${page}`;
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

  return (
    <BoardLayout
      board={board}
      currentView="catalog"
      pageNumber={currentPage > 1 ? currentPage : undefined}
      breadcrumbItems={[
        {
          label: "Catalog",
          href: `/${board.id}/catalog`,
          isCurrent: currentPage === 1
        },
        ...(currentPage > 1 ? [{
          label: `Page ${currentPage}`,
          isCurrent: true
        }] : [])
      ]}
    >
      {/* Header with stats */}
      <div className="mb-8 bg-card border rounded-lg p-4 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/5 to-transparent"></div>
        <div className="flex flex-col md:flex-row justify-between gap-4 relative">
          <div>
            <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">/{board.id}/ - {board.name} - Catalog</h2>
            <p className="text-muted-foreground text-sm">
              Viewing all threads in a grid layout. 
              <Link href={`/${board.id}`} className="ml-1 text-primary hover:text-blue-500 transition-colors">
                Switch to thread view
              </Link>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg border-l-2 border-primary/40">
              <div className="flex items-center gap-1 text-sm">
                <MessageSquare className="size-4 text-primary" />
                <span><strong className="text-primary">{totalThreads}</strong> threads</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <FileText className="size-4 text-blue-500" />
                <span><strong className="text-blue-500">{totalPosts - totalThreads}</strong> replies</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <ImageIcon className="size-4 text-emerald-500" />
                <span><strong className="text-emerald-500">{totalFiles}</strong> files</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {threadsWithFiles.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-b from-card/80 to-card rounded-lg border border-dashed">
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-full bg-muted/50 mb-3">
              <ImageIcon className="size-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-medium mb-1 text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">No Threads Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              This board doesn't have any threads yet. Visit the thread view to create a new thread.
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90">
              <Link href={`/${board.id}`}>
                Go to thread view
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {threadsWithFiles.map(thread => (
            <Link 
              href={`/${board.id}/${thread.id}`}
              key={thread.id}
              className="group relative"
            >
              <div className="bg-card border rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-primary/40 flex flex-col h-full relative">
                {thread.files && thread.files.length > 0 && (
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/20 to-transparent transform rotate-45"></div>
                  </div>
                )}
                <div className="relative h-48 w-full bg-muted/50 overflow-hidden">
                  {thread.files && thread.files.length > 0 ? (
                    <>
                      <Image
                        src={`/api/files/${thread.files[0].id}`}
                        alt="Thread thumbnail"
                        fill
                        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col text-muted-foreground/70 bg-muted/30">
                      <ImageIcon className="size-10 mb-2 opacity-60" />
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                  
                  {/* Thread stats badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-xs border border-white/10">
                      <MessageSquare className="size-3 text-primary" />
                      {thread.reply_count}
                    </div>
                    
                    {thread.files && thread.files.length > 0 && (
                      <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-xs border border-white/10">
                        <ImageIcon className="size-3 text-blue-400" />
                        {thread.files.length}
                      </div>
                    )}
                  </div>
                  
                  {/* View button that appears on hover */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-gradient-to-r from-primary to-blue-500 text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm">
                      <Eye className="size-3" />
                      View thread
                    </div>
                  </div>
                  
                  {/* Post number and date */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-gradient-to-t from-black/80 to-transparent text-xs text-white flex justify-between items-center">
                    <span className="font-medium">#{thread.id}</span>
                    <span>{new Date(thread.creation_time).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm line-clamp-3 flex-1">
                    {truncateText(thread.message, 120)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3 text-amber-500" />
                      <time dateTime={thread.creation_time}>
                        {new Date(thread.creation_time).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </div>
                    
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                      {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* Pagination UI - Only show if there are multiple pages */}
      {totalPages > 1 && (
        <nav aria-label="Catalog pagination" className="mt-10">
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
            >
              {currentPage !== 1 ? (
                <Link href={createPageUrl(currentPage - 1)}>
                  <ChevronLeft className="size-4" />
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="size-4" />
                </span>
              )}
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Calculate what page numbers to show
              let pageNum;
              if (totalPages <= 5) {
                // If we have 5 or fewer pages, show all of them
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                // If we're near the beginning, show 1-5
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If we're near the end, show the last 5 pages
                pageNum = totalPages - 4 + i;
              } else {
                // Otherwise show 2 before and 2 after current page
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  asChild={pageNum !== currentPage}
                  aria-current={pageNum === currentPage ? "page" : undefined}
                  className="w-9"
                >
                  {pageNum !== currentPage ? (
                    <Link href={createPageUrl(pageNum)}>
                      {pageNum}
                    </Link>
                  ) : (
                    <span>{pageNum}</span>
                  )}
                </Button>
              );
            })}
            
            {/* Next page button */}
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              asChild={currentPage !== totalPages}
              aria-label="Go to next page"
            >
              {currentPage !== totalPages ? (
                <Link href={createPageUrl(currentPage + 1)}>
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span>
                  <ChevronRight className="size-4" />
                </span>
              )}
            </Button>
            
            {/* Last page button - only show if not near the end */}
            {currentPage < totalPages - 2 && totalPages > 5 && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="hidden sm:flex"
                aria-label="Go to last page"
              >
                <Link href={createPageUrl(totalPages)} className="flex items-center">
                  <span className="mr-1">{totalPages}</span>
                  <ChevronRight className="size-3 ml-1" />
                  <ChevronRight className="size-3 -ml-2" />
                </Link>
              </Button>
            )}
          </div>
          
          <div className="text-center text-xs text-muted-foreground mt-3">
            Page {currentPage} of {totalPages} • Showing {Math.min(THREADS_PER_PAGE, threadsWithFiles.length)} of {totalThreads} threads
          </div>
        </nav>
      )}
    </BoardLayout>
  );
} 