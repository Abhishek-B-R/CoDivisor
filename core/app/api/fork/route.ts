import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/db"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { repoUrl, repoName, repoId, llm, analysisType, inputPath } = body

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(session.user?.email ? [{ email: session.user.email }] : []),
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Extract username and repo name from full repo name
    const [username, reponame] = repoName.split("/")

    // Create or update repository in database
    const repository = await prisma.repository.upsert({
      where: { github_repo_id: repoId },
      create: {
        name: reponame,
        full_name: repoName,
        github_repo_id: repoId,
        url: repoUrl,
        private: false, // You might want to get this from GitHub API
        userId: user.id,
      },
      update: {
        name: reponame,
        full_name: repoName,
        url: repoUrl,
        userId: user.id,
      },
    })

    // Create analysis entry
    const analysis = await prisma.analysis.create({
      data: {
        llmUsed: llm.toUpperCase() as "OPENAI" | "GEMINI",
        analysisType,
        inputPath,
        summary: "Analysis in progress...",
        repositoryId: repository.id,
      },
    })

    // Forward request to Express server at localhost:8080 with expected payload
    const response = await fetch("http://localhost:8080/fork", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        reponame,
        id: repoId,
        accessToken: session.accessToken,
        // Additional data for internal use
        llm,
        analysisType,
        inputPath,
        analysisId: analysis.id,
      }),
    })

    if (!response.ok) {
      // If fork fails, update analysis with error
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          summary: "Analysis failed to start",
        },
      })
      throw new Error(`Fork API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      ...data,
      analysisId: analysis.id,
      repositoryId: repository.id,
    })
  } catch (error) {
    console.error("Fork API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
