/**
 * File metadata interface
 */
export interface FileMetadata {
  id: number
  creation_time: string
  name: string
  extension: string
  mime: string
  index_num: number
  board_id: string
  post_id: number
}

/**
 * Post interface representing a post or reply in the application
 */
export interface Post {
  id: number
  board_id: string
  parent_id: number | null
  message: string
  creation_time: string
  update_time: string
  replies?: Post[]
  reply_count?: number
  files?: FileMetadata[]
}

/**
 * Board interface representing a board in the application
 */
export interface Board {
  id: string
  name: string
} 