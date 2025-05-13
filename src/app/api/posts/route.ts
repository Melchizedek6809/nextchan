import { execute, saveFile } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import path from "path"

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
    
    // Get file from form data
    const file = formData.get("file") as File | null
    
    // Enforce file requirement for new threads
    if (!parentId && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: "New threads require an attached file" }, 
        { status: 400 }
      )
    }
    
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
    
    // Process file upload if present
    if (file && file.size > 0) {
      const postId = Number(result.lastInsertRowid);
      
      // Get file details
      const fileName = file.name;
      const fileExtension = path.extname(fileName).substring(1);
      const fileContent = Buffer.from(await file.arrayBuffer());
      
      // Save the file to the database
      saveFile({
        name: fileName,
        extension: fileExtension,
        mime: file.type,
        content: fileContent,
        index_num: 0, // First (and only) file for this post
        board_id: boardId,
        post_id: postId
      });
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