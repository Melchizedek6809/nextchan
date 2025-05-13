"use server"

import { execute } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createPost(formData: FormData) {
  const boardId = formData.get("boardId") as string
  if (!boardId) {
    throw new Error("Board ID is required")
  }
  
  const message = formData.get("message") as string
  if (!message || message.trim() === "") {
    return
  }

  // Insert the post into the database
  execute(
    'INSERT INTO posts (board_id, message) VALUES (?, ?)',
    [boardId, message.trim()]
  )

  // Revalidate the board page
  revalidatePath(`/${boardId}`)
} 