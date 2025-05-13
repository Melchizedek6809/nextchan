import { get, query, getFilesForPost } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Eye, HomeIcon, MessageSquare, List, Grid, ChevronLeft, ChevronRight } from "lucide-react"
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

  return (
    <div className="container mx-auto max-w-[1400px] py-6 px-4 sm:px-6">
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
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${board.id}/catalog`}>
              Catalog
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
          /{board.id}/ - {board.name} - Catalog
        </h1>
        
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${board.id}`} className="flex items-center">
              <List className="mr-1 size-4" />
              Thread View
            </Link>
          </Button>
          <Button size="sm" variant="default" className="pointer-events-none">
            <Grid className="mr-1 size-4" />
            Catalog
          </Button>
        </div>
      </div>

      {threadsWithFiles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No threads yet. Be the first to post!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {threadsWithFiles.map(thread => (
            <Link 
              href={`/${board.id}/${thread.id}`}
              key={thread.id}
              className="block group"
            >
              <div className="bg-card border rounded-md overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
                <div className="relative h-40 w-full bg-muted/50">
                  {thread.files && thread.files.length > 0 ? (
                    <Image
                      src={`/api/files/${thread.files[0].id}`}
                      alt="Thread thumbnail"
                      fill
                      className="object-cover object-center"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                  {thread.files && thread.files.length > 1 && (
                    <div className="absolute top-2 right-2 bg-background/80 rounded px-1.5 py-0.5 text-xs">
                      +{thread.files.length - 1} files
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5">
                    <span>No.{thread.id}</span>
                    <span>{new Date(thread.creation_time).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="text-sm line-clamp-3 mb-2">
                    {truncateText(thread.message, 120)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        <MessageSquare className="mr-1 size-3.5" />
                        {thread.reply_count}
                      </span>
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        {thread.files?.length || 0} {thread.files?.length === 1 ? 'file' : 'files'}
                      </span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="mr-1 size-3.5" />
                      <span className="text-xs">View</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* Pagination UI */}
      {totalPages > 1 && (
        <nav aria-label="Catalog pagination" className="mt-8">
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
      
      {totalThreads > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages} ({totalThreads} threads total)
        </div>
      )}
    </div>
  );
} 