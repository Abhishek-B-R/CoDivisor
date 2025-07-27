import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { repoUrl, llm } = body

    // Forward request to Express server at localhost:8080
    const response = await fetch("http://localhost:8080/fork", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repoUrl,
        llm,
        accessToken: session.accessToken,
      }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fork API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
