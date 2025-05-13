import { query, get, getFilesForPost } from '@/lib/db';
import type { Post, Thread, FileMetadata, BasePost } from '@/lib/types';

/**
 * Helper function to convert a Post to a Thread
 */
function postToThread(post: BasePost, replyCount: number, files?: FileMetadata[]): Thread {
  return {
    id: post.id,
    board_id: post.board_id,
    parent_id: post.parent_id,
    message: post.message,
    creation_time: post.creation_time,
    update_time: post.update_time,
    reply_count: replyCount,
    files: files || []
  };
}

/**
 * Get paginated threads for a board
 */
export async function getPaginatedThreads(boardId: string, page: number, threadsPerPage: number) {
  // Calculate offset for SQL query
  const offset = (page - 1) * threadsPerPage;

  // Get total number of top-level posts for pagination
  const totalThreadsResult = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM posts WHERE board_id = ? AND parent_id IS NULL',
    [boardId]
  );
  
  const totalThreads = totalThreadsResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalThreads / threadsPerPage));

  // Get paginated threads
  const threads = query<Post>(
    'SELECT * FROM posts WHERE board_id = ? AND parent_id IS NULL ORDER BY creation_time DESC LIMIT ? OFFSET ?',
    [boardId, threadsPerPage, offset]
  );

  // Enhance threads with reply counts and files
  const threadsWithData: Thread[] = threads.map(thread => {
    // Get reply count
    const replyCount = get<{ count: number }>(
      'SELECT COUNT(*) as count FROM posts WHERE parent_id = ?',
      [thread.id]
    );

    // Get files for this thread
    const files = getFilesForPost(thread.id);
    
    return postToThread(thread, replyCount ? replyCount.count : 0, files);
  });

  return {
    threads: threadsWithData,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalThreads
    }
  };
}

/**
 * Get a thread with its latest replies for board view
 */
export async function getThreadWithLatestReplies(threadId: number, boardId: string, replyLimit = 3): Promise<Thread | null> {
  // Get the thread
  const thread = get<Post>(
    'SELECT * FROM posts WHERE id = ? AND board_id = ?',
    [threadId, boardId]
  );
  
  if (!thread) {
    return null;
  }

  // Get reply count
  const replyCount = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM posts WHERE parent_id = ?',
    [thread.id]
  );

  // Get the most recent replies
  const replies = query<Post>(
    'SELECT * FROM posts WHERE parent_id = ? ORDER BY creation_time DESC LIMIT ?',
    [thread.id, replyLimit]
  );

  // Get files for thread and replies
  const files = getFilesForPost(thread.id);
  
  const repliesWithFiles: Thread[] = replies.map(reply => {
    const replyFiles = getFilesForPost(reply.id);
    return postToThread(reply, 0, replyFiles);
  });

  const result = postToThread(thread, replyCount ? replyCount.count : 0, files);
  result.replies = repliesWithFiles.reverse(); // Show oldest first
  
  return result;
}

/**
 * Get a thread with all its replies for the thread page
 */
export async function getThreadWithAllReplies(threadId: number, boardId: string): Promise<Thread | null> {
  // Get the thread
  const thread = get<Post>(
    'SELECT * FROM posts WHERE id = ? AND board_id = ?',
    [threadId, boardId]
  );
  
  if (!thread) {
    return null;
  }

  // Get all replies to this thread
  const replies = query<Post>(
    'SELECT * FROM posts WHERE parent_id = ? ORDER BY creation_time ASC',
    [thread.id]
  );

  // Get files for the thread
  const files = getFilesForPost(thread.id);

  // Get files for each reply
  const repliesWithFiles: Thread[] = replies.map(reply => {
    const replyFiles = getFilesForPost(reply.id);
    return postToThread(reply, 0, replyFiles);
  });

  const result = postToThread(thread, replies.length, files);
  result.replies = repliesWithFiles;
  
  return result;
} 