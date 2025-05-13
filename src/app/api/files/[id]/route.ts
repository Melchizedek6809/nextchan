import { getFile } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const p = await params;
    const fileId = parseInt(p.id);
    if (isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    const file = getFile(fileId)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Create headers with correct content type
    const headers = new Headers()
    headers.set("Content-Type", file.mime)
    headers.set("Content-Disposition", `inline; filename="${file.name}"`)
    
    // Return the file content
    return new NextResponse(file.content, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
} 