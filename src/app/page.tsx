"use client";
import { useState } from "react";
import Diagram from "./components/Diagram";

export default function Home(){
  const [url, setUrl] = useState("");
  const [data, setData] = useState<{mermaid?:string; files?:number; edges?:number; error?:string}>({});
  const [loading, setLoading] = useState(false);

  async function generate(){
    setLoading(true);
    setData({});
    const r = await fetch("/api/graph", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ repoUrl: url })
    });
    const j = await r.json();
    setData(j);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>RepoLore (MVP with Diagrams)</h1>
      <p style={{ opacity: 0.7, marginBottom: 12 }}>Paste a GitHub URL → dependency graph (Mermaid).</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://github.com/vercel/next.js" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}/>
        <button onClick={generate} disabled={loading} style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8 }}>
          {loading?"Working...":"Generate"}
        </button>
      </div>
      {data.error && <div style={{ color: "#b91c1c", marginBottom: 8 }}>{data.error}</div>}
      {data.mermaid && !data.error && (
        <>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Files: {data.files} • Edges: {data.edges}</div>
          <Diagram code={data.mermaid!} />
        </>
      )}
    </main>
  );
}
