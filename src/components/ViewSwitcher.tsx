import Link from "next/link";
import { Button } from "@/components/ui/button";
import { List, Grid } from "lucide-react";

interface ViewSwitcherProps {
  boardId: string;
  currentView: 'thread' | 'catalog';
  pageParam?: string | number;
}

export function ViewSwitcher({ boardId, currentView, pageParam }: ViewSwitcherProps) {
  // Create URLs with the current page parameter if it exists
  const threadViewUrl = pageParam ? `/${boardId}?page=${pageParam}` : `/${boardId}`;
  const catalogViewUrl = pageParam ? `/${boardId}/catalog?page=${pageParam}` : `/${boardId}/catalog`;
  
  return (
    <div className="flex items-center space-x-2">
      <Button 
        size="sm" 
        variant={currentView === 'thread' ? 'default' : 'outline'} 
        className={currentView === 'thread' ? 'pointer-events-none' : ''}
        asChild={currentView !== 'thread'}
      >
        {currentView === 'thread' ? (
          <div className="flex items-center">
            <List className="mr-1 size-4" />
            Thread View
          </div>
        ) : (
          <Link href={threadViewUrl} className="flex items-center">
            <List className="mr-1 size-4" />
            Thread View
          </Link>
        )}
      </Button>
      
      <Button 
        size="sm" 
        variant={currentView === 'catalog' ? 'default' : 'outline'} 
        className={currentView === 'catalog' ? 'pointer-events-none' : ''}
        asChild={currentView !== 'catalog'}
      >
        {currentView === 'catalog' ? (
          <div className="flex items-center">
            <Grid className="mr-1 size-4" />
            Catalog
          </div>
        ) : (
          <Link href={catalogViewUrl} className="flex items-center">
            <Grid className="mr-1 size-4" />
            Catalog
          </Link>
        )}
      </Button>
    </div>
  );
} 