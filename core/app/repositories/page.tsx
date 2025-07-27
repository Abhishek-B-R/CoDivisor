"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitFork, Lock, Search, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  stargazers_count: number
  forks_count: number
  language: string
  updated_at: string
  html_url: string
}

export default function Repositories() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.accessToken) {
      fetchRepositories()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchRepositories = async () => {
    try {
      const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
          Authorization: `token ${session?.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      })
      const repos = await response.json()
      setRepositories(repos)
    } catch (error) {
      console.error("Error fetching repositories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo)
    router.push(
      `/llm-selection?repo=${encodeURIComponent(repo.full_name)}&repoUrl=${encodeURIComponent(repo.html_url)}`,
    )
  }

  const filteredRepos = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const publicRepos = filteredRepos.filter((repo) => !repo.private)
  const privateRepos = filteredRepos.filter((repo) => repo.private)

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Select a Repository</h1>
        <p className="text-muted-foreground">Choose a repository to start coding with AI assistance</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search repositories..."
            value={searchTerm}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e:any) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">All ({repositories.length})</TabsTrigger>
          <TabsTrigger value="public">Public ({publicRepos.length})</TabsTrigger>
          <TabsTrigger value="private">Private ({privateRepos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <RepositoryGrid repositories={filteredRepos} onSelect={handleSelectRepo} />
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          <RepositoryGrid repositories={publicRepos} onSelect={handleSelectRepo} />
        </TabsContent>

        <TabsContent value="private" className="mt-6">
          <RepositoryGrid repositories={privateRepos} onSelect={handleSelectRepo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RepositoryGrid({
  repositories,
  onSelect,
}: { repositories: Repository[]; onSelect: (repo: Repository) => void }) {
  if (repositories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No repositories found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {repositories.map((repo) => (
        <Card key={repo.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(repo)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-semibold truncate">{repo.name}</CardTitle>
              {repo.private && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />}
            </div>
            <CardDescription className="line-clamp-2 min-h-[2.5rem]">
              {repo.description || "No description available"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  {repo.stargazers_count}
                </div>
                <div className="flex items-center">
                  <GitFork className="h-3 w-3 mr-1" />
                  {repo.forks_count}
                </div>
              </div>
            </div>
            {repo.language && (
              <Badge variant="secondary" className="text-xs">
                {repo.language}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
