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

    // Insert the post into the database
    const result = execute(
      'INSERT INTO posts (board_id, message) VALUES (?, ?)',
      [boardId, message.trim()]
    )

    // Revalidate the board page
    revalidatePath(`/${boardId}`)

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Check if we have the last inserted ID
    if (result.lastInsertRowid) {
      // If available, redirect to the new post with absolute URL
      return NextResponse.redirect(`${baseUrl}/${boardId}/${result.lastInsertRowid}`)
    }

    // Otherwise, just go back to the board with absolute URL
    return NextResponse.redirect(`${baseUrl}/${boardId}`)
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
} 