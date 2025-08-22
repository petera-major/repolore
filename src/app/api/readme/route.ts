import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type GitTreeItem = { path: string; type: "blob" | "tree" | string };
type GitTreeResponse = { tree?: GitTreeItem[] };
type RepoMeta = {
  name: string; full_name: string; description?: string | null;
  html_url: string; license?: { spdx_id?: string | null } | null;
};

function parseRepoUrl(url: string) {
  const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/|$)/i);
  if (!m) throw new Error("Invalid GitHub URL");
  return { owner: m[1], repo: m[2] };
}

async function gh<T>(path: string, token?: string): Promise<T> {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 60 },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

const IMPORT_RE =
  /import\s+(?:[^'"`]+?from\s+)?['"]([^'"`]+)['"];?|require\(['"]([^'"`]+)['"]\)/g;
  function id(p: string) { return p.replace(/[^a-zA-Z0-9_]/g, "_"); }
  function normalizePath(p: string) { return p.replace(/\\/g, "/"); }
  function resolveRelative(from: string, dep: string) {
  const base = from.split("/").slice(0, -1).join("/");
  const parts = (base + "/" + dep).split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") stack.pop();
    else if (part === "." || part === "") continue;
    else stack.push(part);
  }
  return stack.join("/");
}

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = (await req.json()) as { repoUrl: string };
    const { owner, repo } = parseRepoUrl(repoUrl);
    const token = process.env.GITHUB_TOKEN;

    // repo data
    const meta = await gh<RepoMeta>(`/repos/${owner}/${repo}`, token);

    // files list
    const tree = await gh<GitTreeResponse>(
      `/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, token
    );
    const items = tree.tree ?? [];

    // package.json for tech stack 
    const pkgItem = items.find((n) => n.type === "blob" && n.path === "package.json");
    let deps: Record<string, string> = {};
    if (pkgItem) {
      const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`);
      if (raw.ok) {
        const pkg = JSON.parse(await raw.text());
        deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      }
    }

    const techFlags = {
      next: !!deps["next"],
      react: !!deps["react"],
      typescript: !!deps["typescript"],
      tailwind: !!deps["tailwindcss"] || !!deps["@tailwindcss/postcss"],
      mermaid: !!deps["mermaid"],
      openai: !!deps["openai"],
      eslint: !!deps["eslint"],
    };

    const techStack = Object.entries(techFlags).filter(([, v]) => v).map(([k]) => k);

    // build dependency graph
    const files = items
      .filter((n) => n.type === "blob" && /\.(ts|tsx|js|jsx)$/i.test(n.path))
      .map((n) => ({
        path: n.path,
        url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${n.path}`,
      }));
    const subset = files.slice(0, Math.min(files.length, 60));

    const fileSummaries: string[] = [];

    await Promise.all(
    subset.map(async (f) => {
        const r = await fetch(f.url);
        if (!r.ok) return;
        const code = await r.text();
        
        // parse dependencies for mermaid
        let m: RegExpExecArray | null;
        while ((m = IMPORT_RE.exec(code))) {
        const dep = (m[1] || m[2])?.trim();
        if (dep && dep.startsWith(".")) {
            const to = normalizePath(resolveRelative(f.path, dep));
            edges.push({ from: normalizePath(f.path), to });
        }
        }

        fileSummaries.push(`### ${f.path}\n\`\`\`\n${code.slice(0, 600)}\n\`\`\`\n`);
    })
    );

    const edges: Array<{ from: string; to: string }> = [];
    await Promise.all(
      subset.map(async (f) => {
        const r = await fetch(f.url);
        if (!r.ok) return;
        const code = await r.text();
        let m: RegExpExecArray | null;
        while ((m = IMPORT_RE.exec(code))) {
          const dep = (m[1] || m[2])?.trim();
          if (dep && dep.startsWith(".")) {
            const to = normalizePath(resolveRelative(f.path, dep));
            edges.push({ from: normalizePath(f.path), to });
          }
        }
      })
    );
    const nodes = new Set<string>();
    for (const e of edges) { nodes.add(e.from); nodes.add(e.to); }
    const keep = new Set([...nodes].slice(0, 80));
    const mermaid = ["graph LR"]
      .concat(
        edges
          .filter((e) => keep.has(e.from) && keep.has(e.to))
          .map((e) => `  ${id(e.from)}-->${id(e.to)}`)
      )
      .join("\n");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `
    Create a high-quality README.md for this GitHub repo by analyzing the code samples below.

    DO NOT copy or rely on an existing README. Instead, infer the purpose, features, usage, and structure from the actual code.

    Repo:
    - name: ${meta.name}
    - full_name: ${meta.full_name}
    - url: ${meta.html_url}
    - license: ${meta.license?.spdx_id ?? "UNLICENSED"}
    - Tech stack: ${techStack.join(", ") || "unknown"}

    Below are code snippets from the repo files. Use them to infer features and behavior:
    ${fileSummaries.join("\n\n")}

    Here is the repo’s architecture in Mermaid:
    \`\`\`mermaid
    ${mermaid}
    \`\`\`

    Structure the README like:
    1. Title + one-line pitch
    2. Features (bullet list)
    3. Architecture
    4. Tech Stack
    5. Getting Started
    6. Usage
    7. API Endpoints
    8. Roadmap
    9. License
    `;


    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: "You are a technical writer who crafts clear, helpful READMEs." },
        { role: "user", content: prompt },
      ],
    });

    const readme = resp.choices[0]?.message?.content ?? "";
    return NextResponse.json({ readme, techStack, deps });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
