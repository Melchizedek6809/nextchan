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
 * Base Post interface representing a post in the application
 */
export interface BasePost {
  id: number
  board_id: string
  parent_id: number | null
  message: string
  creation_time: string
  update_time: string
}

/**
 * Extended Post interface with optional fields for UI rendering
 */
export interface Post extends BasePost {
  replies?: Post[]
  reply_count?: number
  files?: FileMetadata[]
}

/**
 * Thread interface representing a post with required reply_count
 * Used for thread listings and catalog views
 */
export interface Thread extends BasePost {
  reply_count: number
  files?: FileMetadata[]
  replies?: Thread[]
}

/**
 * Board interface representing a board in the application
 */
export interface Board {
  id: string
  name: string
} 