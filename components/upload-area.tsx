"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadAreaProps {
  onFileUpload: (file: File) => void
}

export default function UploadArea({ onFileUpload }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setIsDragging(false)
      setError(null)

      // Handle rejected files (wrong type, too large, etc.)
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors[0].code === "file-invalid-type") {
          setError("Please upload a PDF file.")
        } else if (rejection.errors[0].code === "file-too-large") {
          setError("File is too large. Maximum size is 10MB.")
        } else {
          setError(`Upload failed: ${rejection.errors[0].message}`)
        }
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        try {
          // Verify it's a PDF by checking the file signature
          const reader = new FileReader()
          reader.onload = (e) => {
            const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 5)
            const header = Array.from(arr)
              .map((byte) => byte.toString(16))
              .join("")

            // PDF signature check (%PDF-)
            if (header.startsWith("255044462d")) {
              onFileUpload(file)
            } else {
              setError("The selected file is not a valid PDF.")
            }
          }
          reader.onerror = () => {
            setError("Failed to read the file. Please try again.")
          }
          reader.readAsArrayBuffer(file.slice(0, 5))
        } catch (err) {
          console.error("Error processing file:", err)
          setError("Failed to process the file. Please try again.")
        }
      }
    },
    [onFileUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    maxSize: 10485760, // 10MB
  })

  return (
    <div className="w-full max-w-2xl">
      <div
        {...getRootProps()}
        className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary/50"}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-lg text-center mb-2">Drag & drop a PDF file here, or click to select</p>
        <p className="text-sm text-muted-foreground text-center">Supported file type: PDF (max 10MB)</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

