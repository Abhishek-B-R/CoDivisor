"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bot, Sparkles } from "lucide-react"

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

export default function LLMSelection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedLLM, setSelectedLLM] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const repoName = searchParams.get("repo")
  const repoUrl = searchParams.get("repoUrl")

  const handleContinue = async () => {
    if (!selectedLLM || !repoUrl) return

    setLoading(true)
    try {
      // Call the fork API
      const response = await fetch("/api/fork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl,
          llm: selectedLLM,
        }),
      })

      if (response.ok) {
        router.push(`/editor?repo=${encodeURIComponent(repoName!)}&llm=${selectedLLM}`)
      } else {
        console.error("Failed to fork repository")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to repositories
        </Button>

        <h1 className="text-3xl font-bold mb-2">Choose Your AI Assistant</h1>
        <p className="text-muted-foreground">
          Select the LLM that will help you code in <span className="font-semibold">{repoName}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
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
                    <CardTitle className="text-xl">{llm.name}</CardTitle>
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

      <div className="flex justify-center">
        <Button onClick={handleContinue} disabled={!selectedLLM || loading} size="lg" className="px-8">
          {loading ? "Setting up..." : "Continue to Editor"}
        </Button>
      </div>
    </div>
  )
}
