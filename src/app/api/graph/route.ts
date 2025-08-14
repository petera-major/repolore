import { NextRequest, NextResponse } from "next/server";

function parseRepoUrl(url: string){
  const m = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/|$)/i);
  if(!m) throw new Error("Invalid GitHub URL");
  return { owner: m[1], repo: m[2] };
}

async function gh(path: string, token?: string){
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    next: { revalidate: 60 }
  });
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

const IMPORT_RE = /import\s+(?:[^'"`]+?from\s+)?['"]([^'"`]+)['"];?|require\(['"]([^'"`]+)['"]\)/g;

export async function POST(req: NextRequest){
  try{
    const { repoUrl } = await req.json();
    const { owner, repo } = parseRepoUrl(repoUrl);
    const token = process.env.GITHUB_TOKEN;

    // 1) list files at HEAD
    const tree = await gh(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, token);
    const files: {path:string; url:string}[] = (tree.tree || [])
      .filter((n:any) => n.type === "blob" && /\.(ts|tsx|js|jsx)$/i.test(n.path))
      .map((n:any) => ({ path: n.path, url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${n.path}` }));

    // 2) cap for speed
    const subset = files.slice(0, Math.min(files.length, 60));

    // 3) scan imports → edges
    const edges: Array<{from:string; to:string}> = [];
    await Promise.all(subset.map(async f => {
      const r = await fetch(f.url);
      if(!r.ok) return;
      const code = await r.text();
      let m: RegExpExecArray | null;
      while((m = IMPORT_RE.exec(code))){
        const dep = (m[1] || m[2])?.trim();
        if(dep && dep.startsWith(".")){
          const to = normalizePath(resolveRelative(f.path, dep));
          edges.push({ from: normalizePath(f.path), to });
        }
      }
    }));

    // 4) Mermaid graph
    const nodes = new Set<string>();
    for (const e of edges) { nodes.add(e.from); nodes.add(e.to); }
    const keep = new Set([...nodes].slice(0, 80));
    const mermaid = ["graph LR"]
      .concat(
        edges
          .filter(e => keep.has(e.from) && keep.has(e.to))
          .map(e => `  ${id(e.from)}-->${id(e.to)}`)
      )
      .join("\n");

    return NextResponse.json({
      edges: edges.length,
      files: subset.length,
      mermaid,
      sampleFiles: subset.map(f => ({ path: f.path, url: f.url }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

function id(p: string){ return p.replace(/[^a-zA-Z0-9_]/g, "_"); }
function normalizePath(p:string){ return p.replace(/\\/g, "/"); }
function resolveRelative(from:string, dep:string){
  const base = from.split("/").slice(0,-1).join("/");
  const parts = (base + "/" + dep).split("/");
  const stack: string[] = [];
  for(const part of parts){
    if(part === "..") stack.pop();
    else if(part === "." || part === "") continue;
    else stack.push(part);
  }
  return stack.join("/");
}
