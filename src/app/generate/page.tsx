"use client";
import { useState } from "react";
import Link from "next/link";            
import Diagram from "../components/Diagram";

type SampleFile = { path: string; url: string };
type Data = { mermaid?: string; files?: number; edges?: number; error?: string; sampleFiles?: SampleFile[] };

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<Data>({});
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState<string>("");
    const [stack, setStack] = useState<string[]>([]);
    const [making, setMaking] = useState(false);

  async function generate() {
    setLoading(true);
    setData({});
    const r = await fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl: url }),
    });
    const j = await r.json();
    setData(j);
    setLoading(false);
  }

  async function makeReadme() {
    setMaking(true);
    setReadme("");
    try {
      const r = await fetch("/api/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });
      const j = await r.json();
      setReadme(j.readme || j.error || "No README generated.");
      setStack(j.techStack || []);
    } finally {
      setMaking(false);
    }
    }
    function copyReadme() {
        if (readme) navigator.clipboard.writeText(readme);
    }
    function downloadReadme() {
        const blob = new Blob([readme || ""], { type: "text/markdown;charset=utf-8" });
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href; a.download = "README.md"; a.click();
        URL.revokeObjectURL(href);
    }

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm underline opacity-80 hover:opacity-100">← Back</Link>

        <div className="mt-6 flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-pink-400"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-indigo-400 text-black font-semibold px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Working..." : "Generate"}
          </button>
        </div>

        {data.error && <div className="mt-4 text-red-400">{data.error}</div>}
        {data.mermaid && !data.error && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generate README</h3>
        <button onClick={makeReadme}
          disabled={making || !url}
          className="rounded-md bg-lime-400 px-3 py-2 text-black font-semibold disabled:opacity-60" >
          {making ? "Generating..." : "Generate README"}
        </button>
         </div>

      <textarea
        readOnly
        value={readme}
        placeholder="README preview will appear here..."
        className="mt-3 h-80 w-full resize-vertical rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm"/>

      <div className="mt-3 flex gap-2">
        <button onClick={copyReadme} disabled={!readme}
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm hover:border-lime-400 disabled:opacity-60">Copy</button>
        <button onClick={downloadReadme} disabled={!readme}
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm hover:border-lime-400 disabled:opacity-60">Download README.md</button>
      </div>
      </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="text-lg font-semibold">Tech Stack (inferred)</h3>
        {stack?.length ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-zinc-300">
            {stack.map((s) => <li key={s}>{s}</li>)}
            </ul>
            ) : ( <p className="mt-2 text-sm text-zinc-400">Will appear after README is generated.</p>)}
            <p className="mt-3 text-xs text-zinc-500"> Detected from <code>package.json</code>. You can edit the README before committing. </p>
        </div>
    </div>
    )}
    </div>
    </main>
  );
}
