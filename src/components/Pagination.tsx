import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  createPageUrl: (page: number) => string;
  itemName?: string;
  totalItems?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  createPageUrl,
  itemName = "items",
  totalItems,
}: PaginationProps) {
  return (
    <>
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8">
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
      
      {totalItems !== undefined && totalItems > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages} ({totalItems} {totalItems === 1 ? itemName.replace(/s$/, '') : itemName} total)
        </div>
      )}
    </>
  );
} 