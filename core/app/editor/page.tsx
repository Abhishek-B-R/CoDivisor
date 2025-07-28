"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  Play,
  Settings,
  Bot,
  Sparkles,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Code2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
})

interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  content?: string
  children?: FileNode[]
  isGenerating?: boolean
  isComplete?: boolean
  hasReview?: boolean
  review?: {
    message: string
    code: string
  }
}

interface StreamingData {
  filePath: string
  review:
    | string
    | {
        message: string
        code: string
      }
}

export default function Editor() {
  const searchParams = useSearchParams()
  const wsRef = useRef<WebSocket | null>(null)
  const [files, setFiles] = useState<FileNode[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [processedFiles, setProcessedFiles] = useState(0)

  const repoName = searchParams.get("repo")
  const llm = searchParams.get("llm")
  const analysisType = searchParams.get("analysisType")
  const inputPath = searchParams.get("inputPath")

  useEffect(() => {
    // Connect to WebSocket server at localhost:8081
    const connectWebSocket = () => {
      const ws = new WebSocket("ws://localhost:8081")
      wsRef.current = ws

      ws.onopen = () => {
        console.log("Connected to WebSocket server")
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data: StreamingData = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onclose = () => {
        console.log("WebSocket connection closed")
        setIsConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleWebSocketMessage = (data: StreamingData) => {
    if (data.filePath === "[DONE]") {
      setAnalysisComplete(true)
      return
    }

    // Parse the review data
    let reviewData: { message: string; code: string }

    if (typeof data.review === "string") {
      try {
        reviewData = JSON.parse(data.review)
      } catch (error) {
        console.error("Error parsing review JSON:", error)
        return
      }
    } else {
      reviewData = data.review
    }

    // Update or create file node
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles]
      const existingFileIndex = updatedFiles.findIndex((file) => file.path === data.filePath)

      const fileNode: FileNode = {
        name: data.filePath.split("/").pop() || data.filePath,
        path: data.filePath,
        type: "file",
        content: reviewData.code,
        isGenerating: false,
        isComplete: true,
        hasReview: true,
        review: reviewData,
      }

      if (existingFileIndex >= 0) {
        updatedFiles[existingFileIndex] = fileNode
      } else {
        updatedFiles.push(fileNode)
      }

      return updatedFiles
    })

    // Set as active file if it's the first one
    if (!activeFile) {
      setActiveFile(data.filePath)
    }

    // Update processed files count
    setProcessedFiles((prev) => prev + 1)
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
      java: "java",
      cpp: "cpp",
      c: "c",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
    }
    return languageMap[ext || ""] || "plaintext"
  }

  const getCurrentFile = (): FileNode | null => {
    if (!activeFile) return null
    return files.find((file) => file.path === activeFile) || null
  }

  const getAnalysisTypeIcon = () => {
    switch (analysisType) {
      case "CODE_COMMENTING":
        return <MessageSquare className="h-4 w-4" />
      case "CODE_QUALITY":
        return <Code2 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getAnalysisTypeLabel = () => {
    switch (analysisType) {
      case "CODE_COMMENTING":
        return "Code Commenting"
      case "CODE_QUALITY":
        return "Code Quality"
      default:
        return analysisType
    }
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center py-2 px-3 hover:bg-accent rounded-md cursor-pointer text-sm transition-colors",
            activeFile === node.path && "bg-accent font-medium",
            level > 0 && "ml-4",
          )}
          onClick={() => {
            if (node.type === "file") {
              setActiveFile(node.path)
            } else {
              toggleFolder(node.path)
            }
          }}
        >
          {node.type === "folder" ? (
            expandedFolders.has(node.path) ? (
              <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
            )
          ) : (
            <FileText className="h-4 w-4 mr-2 text-gray-500" />
          )}
          <span className="truncate flex-1">{node.name}</span>
          {node.isGenerating && <Loader2 className="h-3 w-3 ml-2 animate-spin text-primary" />}
          {node.isComplete && <CheckCircle className="h-3 w-3 ml-2 text-green-500" />}
        </div>
        {node.children && expandedFolders.has(node.path) && (
          <div className="ml-2">{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  const currentFile = getCurrentFile()

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">{repoName}</h1>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                {llm === "openai" ? <Bot className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                <span>{llm === "openai" ? "OpenAI" : "Gemini"}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                {getAnalysisTypeIcon()}
                <span>{getAnalysisTypeLabel()}</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
              <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
              {!analysisComplete && files.length > 0 && (
                <span className="text-sm text-muted-foreground">({processedFiles} files processed)</span>
              )}
              {analysisComplete && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm mb-2">Files</h3>
            <div className="text-xs text-muted-foreground">
              Path: <code className="bg-muted px-1 py-0.5 rounded">{inputPath}</code>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {files.length > 0 ? (
                renderFileTree(files)
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {isConnected ? (
                    <div className="space-y-2">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p>Waiting for analysis results...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AlertCircle className="h-6 w-6 mx-auto" />
                      <p>Connecting to server...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {currentFile ? (
            <>
              {/* File Tabs */}
              <div className="border-b bg-background">
                <Tabs value={activeFile!} onValueChange={setActiveFile}>
                  <TabsList className="h-auto p-0 bg-transparent rounded-none">
                    <TabsTrigger
                      value={activeFile!}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {currentFile.name}
                      {currentFile.hasReview && <CheckCircle className="h-3 w-3 ml-2 text-green-500" />}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Review Message */}
              {currentFile.review && (
                <div className="border-b bg-muted/50 p-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        {getAnalysisTypeIcon()}
                        <span className="ml-2">AI Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{currentFile.review.message}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Monaco Editor */}
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  language={getFileLanguage(currentFile.path)}
                  value={currentFile.content || ""}
                  theme="vs-dark"
                  options={{
                    readOnly: false,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    renderWhitespace: "selection",
                    bracketPairColorization: { enabled: true },
                    guides: {
                      bracketPairs: true,
                      indentation: true,
                    },
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                {!isConnected ? (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Connecting to Analysis Server</h3>
                    <p className="text-muted-foreground">Establishing connection to receive your analysis results...</p>
                  </>
                ) : files.length === 0 ? (
                  <>
                    <div className="relative mb-4">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <Loader2 className="h-6 w-6 absolute -top-1 -right-1 animate-spin text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Analysis in Progress</h3>
                    <p className="text-muted-foreground">
                      AI is analyzing your code in <code className="bg-muted px-1 py-0.5 rounded">{inputPath}</code>
                      <br />
                      Results will appear here as they&apos;re generated...
                    </p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a File</h3>
                    <p className="text-muted-foreground">
                      Choose a file from the sidebar to view the AI analysis and improved code.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
