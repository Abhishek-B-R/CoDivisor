"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Folder, FolderOpen, Loader2, Play, Settings, Bot, Sparkles } from "lucide-react"
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
}

interface StreamingFile {
  filename: string
  content: string
  isComplete: boolean
}

export default function Editor() {
  const searchParams = useSearchParams()
  const wsRef = useRef<WebSocket | null>(null)
  const [files, setFiles] = useState<FileNode[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [streamingFiles, setStreamingFiles] = useState<Map<string, StreamingFile>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const repoName = searchParams.get("repo")
  const llm = searchParams.get("llm")

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
          const data = JSON.parse(event.data)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWebSocketMessage = (data: any) => {
    if (data.type === "file_start") {
      // New file started
      const newStreamingFile: StreamingFile = {
        filename: data.filename,
        content: "",
        isComplete: false,
      }

      setStreamingFiles((prev) => new Map(prev.set(data.filename, newStreamingFile)))

      // Add to file tree if not exists
      setFiles((prev) => {
        const exists = findFileInTree(prev, data.filename)
        if (!exists) {
          return [...prev, createFileNode(data.filename, "", false)]
        }
        return prev
      })

      // Set as active file if it's the first one
      if (!activeFile) {
        setActiveFile(data.filename)
      }
    } else if (data.type === "file_content") {
      // Streaming content
      setStreamingFiles((prev) => {
        const current = prev.get(data.filename)
        if (current) {
          const updated = {
            ...current,
            content: current.content + data.content,
          }
          return new Map(prev.set(data.filename, updated))
        }
        return prev
      })
    } else if (data.type === "file_complete") {
      // File generation complete
      setStreamingFiles((prev) => {
        const current = prev.get(data.filename)
        if (current) {
          const updated = {
            ...current,
            isComplete: true,
          }

          // Update file tree
          setFiles((prevFiles) => updateFileInTree(prevFiles, data.filename, current.content, true))

          return new Map(prev.set(data.filename, updated))
        }
        return prev
      })
    }
  }

  const createFileNode = (filename: string, content: string, isComplete: boolean): FileNode => {
    const parts = filename.split("/")
    return {
      name: parts[parts.length - 1],
      path: filename,
      type: "file",
      content,
      isGenerating: !isComplete,
      isComplete,
    }
  }

  const findFileInTree = (tree: FileNode[], path: string): FileNode | null => {
    for (const node of tree) {
      if (node.path === path) {
        return node
      }
      if (node.children) {
        const found = findFileInTree(node.children, path)
        if (found) return found
      }
    }
    return null
  }

  const updateFileInTree = (tree: FileNode[], path: string, content: string, isComplete: boolean): FileNode[] => {
    return tree.map((node) => {
      if (node.path === path) {
        return {
          ...node,
          content,
          isGenerating: !isComplete,
          isComplete,
        }
      }
      if (node.children) {
        return {
          ...node,
          children: updateFileInTree(node.children, path, content, isComplete),
        }
      }
      return node
    })
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
    }
    return languageMap[ext || ""] || "plaintext"
  }

  const getCurrentFileContent = (): string => {
    if (!activeFile) return ""

    const streamingFile = streamingFiles.get(activeFile)
    if (streamingFile) {
      return streamingFile.content
    }

    const fileNode = findFileInTree(files, activeFile)
    return fileNode?.content || ""
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer text-sm",
            activeFile === node.path && "bg-accent",
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
          <span className="truncate">{node.name}</span>
          {node.isGenerating && <Loader2 className="h-3 w-3 ml-2 animate-spin text-primary" />}
        </div>
        {node.children && expandedFolders.has(node.path) && (
          <div className="ml-2">{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">{repoName}</h1>
            <Badge variant="secondary" className="flex items-center space-x-1">
              {llm === "openai" ? <Bot className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              <span>{llm === "openai" ? "OpenAI" : "Gemini"}</span>
            </Badge>
            <div className="flex items-center space-x-2">
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
              <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
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
      <div className="flex-1 flex">
        {/* Sidebar - File Explorer */}
        <div className="w-64 border-r bg-muted/30">
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm">Files</h3>
          </div>
          <ScrollArea className="h-full">
            <div className="p-2">
              {files.length > 0 ? (
                renderFileTree(files)
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {isConnected ? "Waiting for files..." : "Connecting..."}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {activeFile ? (
            <>
              <div className="border-b bg-background">
                <Tabs value={activeFile} onValueChange={setActiveFile}>
                  <TabsList className="h-auto p-0 bg-transparent">
                    <TabsTrigger
                      value={activeFile}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {activeFile.split("/").pop()}
                      {streamingFiles.get(activeFile)?.isComplete === false && (
                        <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  language={getFileLanguage(activeFile)}
                  value={getCurrentFileContent()}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: "on",
                    wordWrap: "on",
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No file selected</h3>
                <p className="text-muted-foreground">
                  {isConnected
                    ? "Select a file from the sidebar or wait for generation to start"
                    : "Connecting to server..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
