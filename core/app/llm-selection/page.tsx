"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Bot, Sparkles, Folder, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const LLM_OPTIONS = [
  {
    id: "openai",
    name: "OpenAI GPT-4",
    description: "Advanced reasoning and code generation with GPT-4",
    features: ["Excellent code quality", "Strong reasoning", "Wide language support"],
    badge: "Popular",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Google's powerful multimodal AI model",
    features: ["Fast responses", "Multimodal capabilities", "Latest updates"],
    badge: "New",
  },
]

const ANALYSIS_TYPES = [
  {
    id: "CODE_COMMENTING",
    name: "Code Commenting",
    description: "Add comprehensive comments and documentation to your code",
  },
  {
    id: "CODE_QUALITY",
    name: "Code Quality Analysis",
    description: "Analyze code quality, patterns, and suggest improvements",
  },
]

export default function LLMSelection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedLLM, setSelectedLLM] = useState<string | null>(null)
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string>("/")
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFolders, setLoadingFolders] = useState(true)

  const repoName = searchParams.get("repo")
  const repoUrl = searchParams.get("repoUrl")
  const repoId = searchParams.get("repoId")

  useEffect(() => {
    if (repoName) {
      fetchFolders()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoName])

  const fetchFolders = async () => {
    try {
      setLoadingFolders(true)
      const [owner, repo] = repoName!.split("/")
      const response = await fetch(`/api/repositories/${repoId}/folders?owner=${owner}&repo=${repo}`)

      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders)
      } else {
        console.error("Failed to fetch folders")
        setFolders(["/"])
      }
    } catch (error) {
      console.error("Error fetching folders:", error)
      setFolders(["/"])
    } finally {
      setLoadingFolders(false)
    }
  }

  const handleContinue = async () => {
    if (!selectedLLM || !selectedAnalysisType || !repoUrl || !repoName) return

    setLoading(true)
    try {
      // Call the fork API with all required data
      const response = await fetch("/api/fork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl,
          repoName,
          repoId: Number.parseInt(repoId || "0"),
          llm: selectedLLM,
          analysisType: selectedAnalysisType,
          inputPath: selectedPath,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(
          `/editor?repo=${encodeURIComponent(repoName)}&llm=${selectedLLM}&analysisType=${selectedAnalysisType}&inputPath=${encodeURIComponent(selectedPath)}&analysisId=${data.analysisId}`,
        )
      } else {
        const error = await response.json()
        console.error("Failed to start analysis:", error)
        alert("Failed to start analysis. Please try again.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const canContinue = selectedLLM && selectedAnalysisType && selectedPath

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to repositories
        </Button>

        <h1 className="text-3xl font-bold mb-2">Configure AI Analysis</h1>
        <p className="text-muted-foreground">
          Set up your AI analysis for <span className="font-semibold">{repoName}</span>
        </p>
      </div>

      <div className="space-y-8">
        {/* LLM Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Choose Your AI Assistant</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {LLM_OPTIONS.map((llm) => (
              <Card
                key={llm.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedLLM === llm.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedLLM(llm.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {llm.id === "openai" ? (
                          <Bot className="h-6 w-6 text-primary" />
                        ) : (
                          <Sparkles className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{llm.name}</CardTitle>
                        {llm.badge && (
                          <Badge variant="secondary" className="mt-1">
                            {llm.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{llm.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {llm.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Analysis Type Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Analysis Type</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ANALYSIS_TYPES.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedAnalysisType === type.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedAnalysisType(type.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Path Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Input Path</h2>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The AI will only analyze files within the selected path. Choose the folder that contains the code you
                want to analyze.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="path-select">Select folder to analyze:</Label>
              {loadingFolders ? (
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading folders...</span>
                </div>
              ) : (
                <Select value={selectedPath} onValueChange={setSelectedPath}>
                  <SelectTrigger id="path-select">
                    <SelectValue>
                      <div className="flex items-center">
                        <Folder className="h-4 w-4 mr-2" />
                        {selectedPath}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 mr-2" />
                          {folder}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || loading || loadingFolders}
          size="lg"
          className="px-8"
        >
          {loading ? "Starting Analysis..." : "Start Analysis"}
        </Button>
      </div>
    </div>
  )
}
