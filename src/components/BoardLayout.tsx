import { ReactNode } from "react";
import Link from "next/link";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import type { Board } from "@/lib/types";

interface BoardLayoutProps {
  board: Board;
  children: ReactNode;
  currentView: 'thread' | 'catalog';
  pageNumber?: number;
  breadcrumbItems?: {
    label: string;
    href?: string;
    isCurrent?: boolean;
  }[];
}

export function BoardLayout({ 
  board, 
  children, 
  currentView, 
  pageNumber,
  breadcrumbItems = []
}: BoardLayoutProps) {
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
          
          {/* Additional breadcrumb items */}
          {breadcrumbItems.map((item, index) => (
            <span key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem isCurrent={item.isCurrent}>
                {item.href && !item.isCurrent ? (
                  <BreadcrumbLink href={item.href}>
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbLink isCurrent={item.isCurrent}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
          
          {/* Page number */}
          {pageNumber && pageNumber > 1 && breadcrumbItems.length === 0 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem isCurrent>
                <BreadcrumbLink isCurrent>
                  Page {pageNumber}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
        </Breadcrumb>
      </div>
      
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          /{board.id}/ - {board.name}
          {currentView === 'catalog' && <span> - Catalog</span>}
          {pageNumber && pageNumber > 1 && <span> - Page {pageNumber}</span>}
        </h1>
        
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <ViewSwitcher 
            boardId={board.id} 
            currentView={currentView} 
            pageParam={pageNumber}
          />
        </div>
      </div>
      
      {children}
    </div>
  );
} 