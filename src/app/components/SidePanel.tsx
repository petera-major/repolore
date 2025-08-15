"use client";
import Link from "next/link";

export default function SidePanel({
  dark,
  setDark,
}: { dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <aside
      className={[
        "fixed right-6 top-10 w-56 rounded-lg border p-4 backdrop-blur",
        dark ? "border-zinc-800 bg-zinc-900/40 text-zinc-100"
             : "border-zinc-300 bg-white/70 text-zinc-900",
      ].join(" ")}
    >
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
        <span>Dashboard</span>
        <span>·</span>
      </div>

      <nav className="mt-3 space-y-2 text-sm">
        <Link href="/" className="flex items-center justify-between hover:text-lime-400">
          <span>Home</span><span className="text-purple-400">●</span>
        </Link>
        <a href="#features" className="block hover:text-indigo-300">Features</a>
        <Link href="/generate" className="block hover:text-indigo-300">Generate</Link>
        <a
          href="https://github.com/petera-major/repolore"
          target="_blank"
          className="block hover:text-indigo-300"
        >
          GitHub
        </a>
      </nav>

      <div className="mt-4 border-t pt-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Light</span>
          <input type="radio" name="theme" checked={!dark} onChange={() => setDark(false)} />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Dark</span>
          <input type="radio" name="theme" checked={dark} onChange={() => setDark(true)} />
        </div>
      </div>
    </aside>
  );
}
