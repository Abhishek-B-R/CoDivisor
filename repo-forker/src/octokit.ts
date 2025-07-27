import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// await octokit.repos.createForAuthenticatedUser({
//   name: "codivisor-test-repo",
// });

export async function forkRepository(repoUrl: string) {
  const [owner, repo] = repoUrl.split("/").slice(-2);
  if (!owner || !repo) {
    throw new Error(
      "Invalid repository URL format. Expected format: 'owner/repo'."
    );
  }
  try {
    const response = await octokit.repos.createFork({
      owner,
      repo,
    });
    return response.data;
  } catch (error) {
    console.error("Error forking repository:", error);
    throw error;
  }
}
