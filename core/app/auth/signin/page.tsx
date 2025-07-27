"use client"

import type React from "react"

import { signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Github, Lock } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push("/repositories")
      }
    }
    checkSession()
  }, [router])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        password,
        redirect: false,
      })

      if (result?.ok) {
        router.push("/repositories")
      } else {
        alert("Invalid password")
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to CodeForge</CardTitle>
          <CardDescription>Sign in to access your repositories and start coding with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="github">GitHub OAuth</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="github" className="space-y-4">
              <Button onClick={() => signIn("github", { callbackUrl: "/repositories" })} className="w-full" size="lg">
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
              </Button>
            </TabsContent>

            <TabsContent value="password" className="space-y-4">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter static password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  <Lock className="mr-2 h-4 w-4" />
                  {isLoading ? "Signing in..." : "Sign in with Password"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
