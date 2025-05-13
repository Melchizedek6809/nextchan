import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare } from "lucide-react";
import type { Post, FileMetadata } from "@/lib/types";

interface ThreadTileProps {
  thread: Post & { 
    reply_count: number;
    files?: FileMetadata[];
  };
  boardId: string;
}

// Function to truncate text to a specific length
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export function ThreadTile({ thread, boardId }: ThreadTileProps) {
  return (
    <Link 
      href={`/${boardId}/${thread.id}`}
      className="block group"
    >
      <div className="bg-card border rounded-md overflow-hidden transition-all hover:shadow-md hover:border-primary/50 h-full flex flex-col">
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
        
        <div className="p-3 flex-1 flex flex-col">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5">
            <span>No.{thread.id}</span>
            <span>{new Date(thread.creation_time).toLocaleDateString()}</span>
          </div>
          
          <p className="text-sm line-clamp-3 mb-2 flex-grow">
            {truncateText(thread.message, 120)}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
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
  );
} 