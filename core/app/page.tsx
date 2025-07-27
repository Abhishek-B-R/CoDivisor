"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Github, Sparkles } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/repositories")
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            CodeForge
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your GitHub repositories with AI-powered code generation. Choose your favorite LLM and watch your
            code come to life.
          </p>
          <Button size="lg" onClick={() => router.push("/auth/signin")} className="text-lg px-8 py-3">
            <Github className="mr-2 h-5 w-5" />
            Get Started with GitHub
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>GitHub Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamlessly connect with your GitHub repositories. Access both public and private repos with OAuth
                authentication.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multiple LLMs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose between OpenAI GPT-4 and Google Gemini. Each model brings unique strengths to your coding
                workflow.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time Streaming</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Watch your code generate in real-time with Monaco Editor. Stream files token by token for an immersive
                experience.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Connect GitHub</h3>
              <p className="text-sm text-muted-foreground">Sign in with your GitHub account</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Select Repository</h3>
              <p className="text-sm text-muted-foreground">Choose from your public or private repos</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Pick Your LLM</h3>
              <p className="text-sm text-muted-foreground">Choose between OpenAI or Gemini</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Code Generation</h3>
              <p className="text-sm text-muted-foreground">Watch AI generate your code in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
