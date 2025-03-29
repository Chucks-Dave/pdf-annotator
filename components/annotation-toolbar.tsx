"use client"

import { HighlighterIcon, Underline, MessageSquare, Pen, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { AnnotationType } from "@/lib/types"

interface AnnotationToolbarProps {
  currentTool: AnnotationType
  setCurrentTool: (tool: AnnotationType) => void
  currentColor: string
  setCurrentColor: (color: string) => void
  onExport: () => void
}

const colorOptions = [
  { value: "#FFFF00", label: "Yellow" },
  { value: "#FF9999", label: "Red" },
  { value: "#99FF99", label: "Green" },
  { value: "#9999FF", label: "Blue" },
]

export default function AnnotationToolbar({
  currentTool,
  setCurrentTool,
  currentColor,
  setCurrentColor,
  onExport,
}: AnnotationToolbarProps) {
  return (
    <div className="bg-white border rounded-lg p-2 shadow-sm flex items-center gap-2 flex-wrap">
      <TooltipProvider>
        <div className="flex items-center gap-1 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === "highlight" ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentTool("highlight")}
              >
                <HighlighterIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Highlight Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === "underline" ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentTool("underline")}
              >
                <Underline className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === "comment" ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentTool("comment")}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Comment</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === "signature" ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentTool("signature")}
              >
                <Pen className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Draw Signature</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-6 border-r mx-1"></div>

        <div className="flex items-center gap-1 mr-2">
          {colorOptions.map((color) => (
            <Tooltip key={color.value}>
              <TooltipTrigger asChild>
                <button
                  className={`w-6 h-6 rounded-full border ${
                    currentColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setCurrentColor(color.value)}
                  aria-label={`Select ${color.label} color`}
                />
              </TooltipTrigger>
              <TooltipContent>{color.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="h-6 border-r mx-1"></div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Annotated PDF</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

