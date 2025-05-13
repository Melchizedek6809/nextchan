"use server"

import { execute } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createReply(formData: FormData) {
  const boardId = formData.get("boardId") as string
  if (!boardId) {
    throw new Error("Board ID is required")
  }
  
  const parentId = formData.get("parentId") as string
  if (!parentId) {
    throw new Error("Parent post ID is required")
  }
  
  const message = formData.get("message") as string
  if (!message || message.trim() === "") {
    return
  }

  // Insert the reply into the database
  execute(
    'INSERT INTO posts (board_id, parent_id, message) VALUES (?, ?, ?)',
    [boardId, parentId, message.trim()]
  )

  // Revalidate both the board page and the post page
  revalidatePath(`/${boardId}/${parentId}`)
  revalidatePath(`/${boardId}`)
} 