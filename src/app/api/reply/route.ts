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
    
    const parentId = formData.get("parentId") as string
    if (!parentId) {
      return NextResponse.json({ error: "Parent post ID is required" }, { status: 400 })
    }
    
    const message = formData.get("message") as string
    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    // Insert the reply into the database
    execute(
      'INSERT INTO posts (board_id, parent_id, message) VALUES (?, ?, ?)',
      [boardId, parentId, message.trim()]
    )

    // Revalidate both the board page and the post page
    revalidatePath(`/${boardId}/${parentId}`)
    revalidatePath(`/${boardId}`)

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Redirect back to the thread with absolute URL
    return NextResponse.redirect(`${baseUrl}/${boardId}/${parentId}`)
  } catch (error) {
    console.error("Error creating reply:", error)
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
} 