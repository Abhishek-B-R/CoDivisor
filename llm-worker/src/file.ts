import fs from "fs/promises";
import path from "path";

export async function getAllFilesWithContent(folderPath: string): Promise<{ path: string; content: string }[]> {
  let result: { path: string; content: string }[] = [];

  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      const subResults = await getAllFilesWithContent(fullPath);
      result = result.concat(subResults);
    } else {
      const content = await fs.readFile(fullPath, "utf-8");
      result.push({ path: fullPath, content });
    }
  }

  return result;
}
