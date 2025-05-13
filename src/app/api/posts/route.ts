import { execute } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const boardId = formData.get("boardId") as string
    if (!boardId) {
      return NextResponse.json({ error: "Board ID is required" }, { status: 400 })
    }
    
    const message = formData.get("message") as string
    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    // Get optional parentId (if it's a reply)
    const parentId = formData.get("parentId") as string | null
    let result;

    // Insert into database based on whether it's a reply or new post
    if (parentId) {
      // It's a reply to an existing post
      result = execute(
        'INSERT INTO posts (board_id, parent_id, message) VALUES (?, ?, ?)',
        [boardId, parentId, message.trim()]
      )

      // Revalidate both the board page and the post page
      revalidatePath(`/${boardId}/${parentId}`)
    } else {
      // It's a new post
      result = execute(
        'INSERT INTO posts (board_id, message) VALUES (?, ?)',
        [boardId, message.trim()]
      )
    }
    
    // Always revalidate the board page
    revalidatePath(`/${boardId}`)

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Determine where to redirect
    if (parentId) {
      // If it's a reply, redirect back to the thread
      return NextResponse.redirect(`${baseUrl}/${boardId}/${parentId}`)
    } else if (result.lastInsertRowid) {
      // If it's a new post, redirect to the new post's thread
      return NextResponse.redirect(`${baseUrl}/${boardId}/${result.lastInsertRowid}`)
    } else {
      // Fallback to the board page
      return NextResponse.redirect(`${baseUrl}/${boardId}`)
    }
  } catch (error) {
    console.error("Error creating post/reply:", error)
    return NextResponse.json({ error: "Failed to create post/reply" }, { status: 500 })
  }
} 