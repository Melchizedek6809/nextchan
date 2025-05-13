import { get, query, getFilesForPost } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import React from "react"
import { Post } from "@/components/Post"
import { PostForm } from "@/components/PostForm"
import { BoardLayout } from "@/components/BoardLayout"
import type { Post as PostType, Board } from "@/lib/types"

type Props = {
  params: { 
    board: string
    post: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function PostPage(props: Props) {
  // Use object destructuring in the function body instead of parameters
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const boardId = params.board
  const postIdString = params.post
  
  const postId = parseInt(postIdString)
  if (isNaN(postId)) {
    notFound()
  }

  const board = get<Board>(
    'SELECT id, name FROM boards WHERE id = ?',
    [boardId]
  )

  if (!board) {
    notFound()
  }

  const post = get<PostType>(
    'SELECT * FROM posts WHERE id = ? AND board_id = ?',
    [postId, board.id]
  )

  if (!post) {
    notFound()
  }

  // Check if we're replying to a specific post
  const replyToId = searchParams.reply ? Number(searchParams.reply) : undefined;

  // Get the parent thread hierarchy if this is a reply to another post
  const threadHierarchy: PostType[] = [];
  
  // Function to build thread hierarchy
  function buildThreadHierarchy(postId: number | null) {
    if (!postId) return;
    
    const parentPost = get<PostType>(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );
    
    if (parentPost) {
      // Add to the beginning of the array to maintain hierarchy order
      threadHierarchy.unshift(parentPost);
      
      // Continue up the chain if there's a parent
      if (parentPost.parent_id) {
        buildThreadHierarchy(parentPost.parent_id);
      }
    }
  }
  
  // Only build hierarchy if this is a reply post
  if (post.parent_id) {
    buildThreadHierarchy(post.parent_id);
  }

  // This function recursively fetches all replies
  function getPostWithReplies(parentId: number): PostType {
    const parentPost = get<PostType>(
      'SELECT * FROM posts WHERE id = ?',
      [parentId]
    )

    if (!parentPost) {
      notFound()
    }

    // Get direct replies to this post
    const replies = query<PostType>(
      'SELECT * FROM posts WHERE parent_id = ? ORDER BY creation_time ASC',
      [parentId]
    )

    // For each reply, recursively get its replies
    const repliesWithChildren = replies.map(reply => getPostWithReplies(reply.id))
    
    // Get files for this post
    const files = getFilesForPost(parentId)
    
    return {
      ...parentPost,
      files,
      replies: repliesWithChildren
    }
  }

  // Get the main post with all its nested replies
  const postWithReplies = getPostWithReplies(postId)

  // Get a preview of the post content for the breadcrumb
  const postPreview = post.message.length > 30 
    ? post.message.substring(0, 30) + '...' 
    : post.message;

  // Find the target post if we're replying to a specific post
  let replyToPost: PostType | undefined = undefined;
  if (replyToId) {
    replyToPost = get<PostType>(
      'SELECT * FROM posts WHERE id = ?',
      [replyToId]
    );
  }

  // Generate a short preview for each post in the thread hierarchy
  function getShortPreview(message: string): string {
    // Make previews shorter to prevent breadcrumb wrapping issues
    return message.length > 10 ? message.substring(0, 10) + '...' : message;
  }
  
  // Create breadcrumb items for BoardLayout
  const breadcrumbItems = [
    ...(threadHierarchy.map(threadPost => ({
      label: `#${threadPost.id}`,
      href: `/${board.id}/${threadPost.id}`
    }))),
    {
      label: `#${post.id}`,
      isCurrent: true
    }
  ];

  return (
    <BoardLayout
      board={board}
      currentView="thread"
      breadcrumbItems={breadcrumbItems}
    >
      <Post post={postWithReplies} boardId={board.id} isMainPost inThread showAllReplies={postId === replyToId} />

      <div className="mt-8">
        {replyToPost && replyToId !== postId && (
          <div className="mb-6 bg-muted/30 p-4 rounded-md border border-muted">
            <div className="text-sm font-medium mb-2">Replying to:</div>
            <div className="pl-4 border-l-2 border-muted">
              <div className="text-xs text-muted-foreground mb-1">
                <Link href={`#post-${replyToPost.id}`} className="font-medium hover:underline">
                  No.{replyToPost.id}
                </Link>
                {' '} • {new Date(replyToPost.creation_time).toLocaleString()}
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {replyToPost.message.length > 120 
                  ? `${replyToPost.message.substring(0, 120)}...` 
                  : replyToPost.message}
              </div>
            </div>
          </div>
        )}
        <PostForm boardId={board.id} parentId={post.id} />
      </div>
    </BoardLayout>
  )
} 