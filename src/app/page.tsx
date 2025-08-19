"use client";
import { useState } from "react";
import Link from "next/link";
import SidePanel from "./components/SidePanel";

export default function Page() {
  const [dark, setDark] = useState(true);

  return (
    <main className={`${dark ? "bg-black text-zinc-100" : "bg-zinc-50 text-zinc-900"} min-h-screen relative`}>
      <SidePanel dark={dark} setDark={setDark} />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="font-extrabold tracking-widest text-xl">
          REPO<span className="text-purple-400">ARCHIVE</span>
        </div>
        <nav className="hidden gap-6 text-sm sm:flex">
          <Link href="/generate" className="rounded-full border border-zinc-700 px-4 py-2 hover:border-pink-400 hover:text-teal-400">
            Try it
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">

        <h1 className="mt-6 text-5xl font-black leading-[0.95] sm:text-7xl">
          THE EASIEST WAY TO UNDERSTAND ANY GITHUB REPO
        </h1>

        <p className="mt-6 max-w-2xl text-zinc-300">
          Paste a GitHub URL and get architecture/dependency diagrams for any public repo.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/generate"
            className="rounded-lg bg-purple-400 px-5 py-3 font-semibold text-black hover:brightness-95"
          >
            Generate Docs
          </Link>
          <a href="#features"
            className="rounded-lg border border-zinc-700 px-5 py-3 hover:border-zinc-500"
          > Learn more</a>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-3">
        <Feature title="Paste URL" desc="Drop a GitHub link. No setup." />
        <Feature title="What occurs" desc="Automatically webscrapes public repositories to generate clean README files and Mermaid architecture diagrams." />
        <Feature title="Summaries" desc="Turns complex files and modules into simple, readable explanations." />
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-4 text-2xl font-semibold">How it works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-zinc-300">
          <li>Paste a public GitHub repo URL.</li>
          <li>Input a GitHub repo URL, and the tool automatically fetches files, parses imports, and creates architecture diagrams.</li>
        </ol>
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-300">{desc}</p>
    </div>
  );
}
