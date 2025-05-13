"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, File as FileIcon, FileText, FileImage, FileVideo, FileAudio, Archive, AlertCircle } from "lucide-react"
import { useState, useRef, useEffect, FormEvent } from "react"
import Image from "next/image"

interface PostFormProps {
  boardId: string
  parentId?: number
}

export function PostForm({ boardId, parentId }: PostFormProps) {
  const isReply = parentId !== undefined;
  const [filePreview, setFilePreview] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Cleanup object URL when component unmounts or when filePreview changes
  useEffect(() => {
    return () => {
      if (filePreview?.url) {
        URL.revokeObjectURL(filePreview.url);
      }
    };
  }, [filePreview]);

  // Clear error when file is selected
  useEffect(() => {
    if (filePreview) {
      setError(null);
    }
  }, [filePreview]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFilePreview(null);
      return;
    }
    
    // Revoke previous object URL if it exists
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url);
    }
    
    const url = URL.createObjectURL(file);
    setFilePreview({
      url,
      name: file.name,
      type: file.type,
      size: file.size
    });
  };
  
  const processFile = (file: File) => {
    // Revoke previous object URL if it exists
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url);
    }
    
    const url = URL.createObjectURL(file);
    setFilePreview({
      url,
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Update the file input element
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    // For new threads (not replies), require a file
    if (!isReply && !filePreview) {
      e.preventDefault();
      setError("New threads require an attached file");
      // Scroll error into view
      setTimeout(() => {
        document.getElementById("file-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }
    
    setError(null);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };
  
  const clearFileSelection = () => {
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url);
    }
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get appropriate icon based on file type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="text-blue-500" size={24} />;
    if (type.startsWith('video/')) return <FileVideo className="text-purple-500" size={24} />;
    if (type.startsWith('audio/')) return <FileAudio className="text-green-500" size={24} />;
    if (type.includes('pdf')) return <FileText className="text-red-500" size={24} />;
    if (type.includes('word') || type.includes('document') || type.includes('text')) 
      return <FileText className="text-blue-400" size={24} />;
    if (type.includes('zip') || type.includes('compressed') || type.includes('archive')) 
      return <Archive className="text-yellow-500" size={24} />;
    return <FileIcon className="text-muted-foreground" size={24} />;
  };
  
  // Function to trigger file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="bg-card p-4 rounded-md border">
      <h2 className="text-lg font-medium mb-3">
        {isReply ? "Reply to this thread" : "Create a new thread"}
      </h2>
      <form 
        action="/api/posts" 
        method="post" 
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <input type="hidden" name="boardId" value={boardId} />
        {isReply && <input type="hidden" name="parentId" value={parentId.toString()} />}
        <Textarea 
          name="message"
          placeholder={isReply ? "What's your reply?" : "What's on your mind?"}
          className="min-h-[120px] mb-3"
          required
        />
        
        <div className="mb-3">
          {!isReply && (
            <p className="text-sm mb-2 flex items-center gap-1">
              <span className={error ? "text-destructive font-medium" : "text-muted-foreground"}>
                {error ? "File required: " : "File required for new threads"}
              </span>
              {!filePreview && !isReply && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">Required</span>
              )}
            </p>
          )}
          
          {filePreview ? (
            <div className="mb-3 border rounded-md p-2 bg-muted/20 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">File attachment:</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFileSelection}
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  disabled={!isReply} // Disable removing files if this is a new thread
                  title={!isReply ? "Files are required for new threads" : "Remove file"}
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="flex gap-3 items-center">
                {filePreview.type.startsWith('image/') ? (
                  <div className="relative h-20 w-20 bg-muted rounded overflow-hidden ring-1 ring-muted transition-all hover:ring-primary/50 hover:shadow-sm flex-shrink-0">
                    <Image 
                      src={filePreview.url} 
                      alt={filePreview.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 bg-muted/50 rounded flex items-center justify-center ring-1 ring-muted transition-all hover:ring-primary/50 hover:shadow-sm flex-shrink-0">
                    {getFileIcon(filePreview.type)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium truncate break-words">{filePreview.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(filePreview.size)}</p>
                  <p className="text-xs text-muted-foreground break-all truncate">{filePreview.type}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div 
                className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary/70 bg-primary/5' 
                    : error 
                      ? 'border-destructive/50 bg-destructive/5'
                      : 'border-muted-foreground/20 hover:border-muted-foreground/30'
                } cursor-pointer`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    openFileDialog();
                  }
                }}
              >
                {error ? (
                  <AlertCircle 
                    size={24} 
                    className="mx-auto mb-2 text-destructive" 
                    id="file-error"
                  />
                ) : (
                  <Upload 
                    size={24} 
                    className={`mx-auto mb-2 ${isDragging ? 'text-primary animate-bounce' : 'text-muted-foreground/70'}`} 
                  />
                )}
                <p 
                  className={`block text-sm font-medium mb-1 cursor-pointer transition-colors ${
                    error ? 'text-destructive' : 'hover:text-primary'
                  }`}
                >
                  {error 
                    ? error 
                    : isDragging 
                      ? 'Drop file here' 
                      : 'Drag & drop a file or click to browse'
                  }
                </p>
                <p className="text-xs text-muted-foreground break-all">
                  Supported file types: images, videos, documents, and more
                </p>
              </div>
            </>
          )}
          
          <Input 
            id="file" 
            name="file" 
            type="file" 
            className="sr-only"
            aria-describedby="file-description"
            onChange={handleFileChange}
            ref={fileInputRef}
            required={!isReply}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit">
            {isReply ? "Reply" : "Post"}
          </Button>
        </div>
      </form>
    </div>
  )
} 