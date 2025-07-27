"use client"

import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push("/repositories")
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to CodeForge</CardTitle>
          <CardDescription>Sign in with GitHub to access your repositories and start coding with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => signIn("github", { callbackUrl: "/repositories" })} className="w-full" size="lg">
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
