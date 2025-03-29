"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface CommentDialogProps {
  onSave: (comment: string) => void
  onCancel: () => void
}

export default function CommentDialog({ onSave, onCancel }: CommentDialogProps) {
  const [comment, setComment] = useState("")

  const handleSave = () => {
    if (comment.trim()) {
      onSave(comment)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Comment</DialogTitle>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter your comment here..."
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!comment.trim()}>
            Add Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

