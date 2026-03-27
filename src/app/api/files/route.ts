import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { homedir } from "os";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || homedir() + "/.openclaw";

// Files to show in the document browser
const ROOT_FILES = ["MEMORY.md", "SOUL.md", "USER.md", "AGENTS.md", "TOOLS.md", "IDENTITY.md"];
const MEMORY_DIR = "memory";
const SKILLS_DIR = "skills";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildMarkdownFolderTree(
  folderPath: string,
  relativePath: string,
  options: { recursive: boolean; reverseFiles?: boolean }
): Promise<FileNode | null> {
  if (!(await fileExists(folderPath))) {
    return null;
  }

  const stats = await fs.stat(folderPath);
  if (!stats.isDirectory()) {
    return null;
  }

  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const childFolders = options.recursive
    ? entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const childFiles = entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith(".") && entry.name.endsWith(".md"))
    .sort((a, b) =>
      options.reverseFiles ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    );

  const children: FileNode[] = [];

  for (const folder of childFolders) {
    const childPath = `${relativePath}/${folder.name}`;
    const childTree = await buildMarkdownFolderTree(
      path.join(folderPath, folder.name),
      childPath,
      options
    );
    if (childTree) {
      children.push(childTree);
    }
  }

  for (const file of childFiles) {
    children.push({
      name: file.name,
      path: `${relativePath}/${file.name}`,
      type: "file",
    });
  }

  if (children.length === 0) {
    return null;
  }

  return {
    name: path.basename(relativePath),
    path: relativePath,
    type: "folder",
    children,
  };
}

async function getFileTree(workspacePath: string): Promise<FileNode[]> {
  const tree: FileNode[] = [];

  for (const file of ROOT_FILES) {
    const fullPath = path.join(workspacePath, file);
    if (await fileExists(fullPath)) {
      tree.push({
        name: file,
        path: file,
        type: "file",
      });
    }
  }

  const memoryTree = await buildMarkdownFolderTree(
    path.join(workspacePath, MEMORY_DIR),
    MEMORY_DIR,
    { recursive: false, reverseFiles: true }
  );
  if (memoryTree) {
    tree.push(memoryTree);
  }

  const skillsTree = await buildMarkdownFolderTree(
    path.join(workspacePath, SKILLS_DIR),
    SKILLS_DIR,
    { recursive: true }
  );
  if (skillsTree) {
    tree.push(skillsTree);
  }

  return tree;
}

function sanitizePath(requestedPath: string): string | null {
  // Prevent directory traversal
  const normalized = path.normalize(requestedPath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return null;
  }

  // Only allow .md files
  if (!normalized.endsWith(".md")) {
    return null;
  }

  // Only allow root files or files in memory/skills
  const isRootFile = ROOT_FILES.includes(normalized);
  const isMemoryFile = normalized.startsWith(`${MEMORY_DIR}/`);
  const isSkillFile = normalized.startsWith(`${SKILLS_DIR}/`);

  if (!isRootFile && !isMemoryFile && !isSkillFile) {
    return null;
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace") || "workspace";
  const filePath = searchParams.get("path");

  try {
    // Determine workspace path
    const workspacePath = path.join(OPENCLAW_DIR, workspace);
    
    // Validate workspace exists
    if (!(await fileExists(workspacePath))) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (!filePath) {
      // Return file tree
      const tree = await getFileTree(workspacePath);
      return NextResponse.json(tree);
    }

    // Read specific file
    const safePath = sanitizePath(filePath);
    if (!safePath) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    const fullPath = path.join(workspacePath, safePath);
    if (!(await fileExists(fullPath))) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const content = await fs.readFile(fullPath, "utf-8");
    return NextResponse.json({ path: safePath, content });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace = "workspace", path: filePath, content } = body;

    if (!filePath || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing path or content" },
        { status: 400 }
      );
    }

    const safePath = sanitizePath(filePath);
    if (!safePath) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    const workspacePath = path.join(OPENCLAW_DIR, workspace);
    
    // Validate workspace exists
    if (!(await fileExists(workspacePath))) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const fullPath = path.join(workspacePath, safePath);

    // Create memory directory if needed
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(fullPath, content, "utf-8");

    return NextResponse.json({ success: true, path: safePath });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
}
