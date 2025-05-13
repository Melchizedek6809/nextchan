import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PostFormProps {
  boardId: string
  parentId?: number
}

export function PostForm({ boardId, parentId }: PostFormProps) {
  const isReply = parentId !== undefined;
  
  return (
    <div className="bg-card p-4 rounded-md border">
      <h2 className="text-lg font-medium mb-3">
        {isReply ? "Reply to this thread" : "Create a new post"}
      </h2>
      <form action={isReply ? "/api/reply" : "/api/post"} method="post">
        <input type="hidden" name="boardId" value={boardId} />
        {isReply && <input type="hidden" name="parentId" value={parentId.toString()} />}
        <Textarea 
          name="message"
          placeholder={isReply ? "What's your reply?" : "What's on your mind?"}
          className="min-h-[120px] mb-3"
          required
        />
        <div className="flex justify-end">
          <Button type="submit">
            {isReply ? "Reply" : "Post"}
          </Button>
        </div>
      </form>
    </div>
  )
} 