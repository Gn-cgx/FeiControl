import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(os.homedir(), '.openclaw');
const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(OPENCLAW_DIR, 'workspace');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

interface SearchResult {
  type: 'memory' | 'activity' | 'task';
  title: string;
  snippet: string;
  path?: string;
  timestamp?: string;
}

function searchInFile(filePath: string, query: string): SearchResult[] {
  const results: SearchResult[] = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const lowerQuery = query.toLowerCase();
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowerQuery)) {
        const start = Math.max(0, index - 1);
        const end = Math.min(lines.length, index + 2);
        const snippet = lines.slice(start, end).join('\n');
        
        results.push({
          type: 'memory',
          title: path.basename(filePath),
          snippet: snippet.substring(0, 200),
          path: filePath
        });
      }
    });
  } catch {
    // Skip files that can't be read
  }
  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }
  
  const results: SearchResult[] = [];
  
  // Search memory files
  const memoryFiles = [
    path.join(WORKSPACE, 'MEMORY.md'),
    ...(() => {
      try {
        return fs.readdirSync(MEMORY_DIR)
          .filter(f => f.endsWith('.md'))
          .map(f => path.join(MEMORY_DIR, f));
      } catch {
        return [];
      }
    })()
  ];
  
  for (const file of memoryFiles) {
    results.push(...searchInFile(file, query));
  }
  
  // Search activities from SQLite DB
  try {
    const dbPath = path.join(process.cwd(), 'data', 'activities.db');
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath, { readonly: true });
      try {
        const rows = db.prepare(`
          SELECT type, description, timestamp FROM activities
          WHERE description LIKE ? OR type LIKE ?
          ORDER BY timestamp DESC LIMIT 10
        `).all(`%${query}%`, `%${query}%`) as Array<{ type: string; description: string; timestamp: string }>;
        
        for (const row of rows) {
          results.push({
            type: 'activity',
            title: row.type,
            snippet: row.description || '',
            timestamp: row.timestamp
          });
        }
      } finally {
        db.close();
      }
    }
  } catch {
    // Skip if can't read
  }
  
  // Search tasks from data/tasks.json (local file)
  try {
    const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    if (fs.existsSync(tasksPath)) {
      const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
      const lowerQuery = query.toLowerCase();
      
      for (const task of (Array.isArray(tasks) ? tasks : [])) {
        if (task.name?.toLowerCase().includes(lowerQuery) ||
            task.description?.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'task',
            title: task.name,
            snippet: task.description || '',
            timestamp: task.nextRun
          });
        }
      }
    }
  } catch {
    // Skip if can't read
  }
  
  return NextResponse.json(results.slice(0, 20));
}
