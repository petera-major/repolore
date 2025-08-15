"use client";
import { useState } from "react";
import Link from "next/link";             // ← add this
import Diagram from "../components/Diagram";

type SampleFile = { path: string; url: string };
type Data = { mermaid?: string; files?: number; edges?: number; error?: string; sampleFiles?: SampleFile[] };

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<Data>({});
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm underline opacity-80 hover:opacity-100">← Back</Link>

        <div className="mt-6 flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-lime-400"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-lime-400 text-black font-semibold px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Working..." : "Generate"}
          </button>
        </div>

        {data.error && <div className="mt-4 text-red-400">{data.error}</div>}
        {data.mermaid && !data.error && (
          <div className="mt-8 rounded-2xl border border-zinc-800 p-4 bg-zinc-900/40 overflow-auto">
            <Diagram code={data.mermaid!} />
          </div>
        )}
      </div>
    </main>
  );
}
