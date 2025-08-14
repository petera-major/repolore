"use client";
import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";
mermaid.initialize({ startOnLoad: false });

export default function Diagram({ code }: { code: string }){
  const [svg, setSvg] = useState("");
  const key = useId();
  useEffect(()=>{
    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(`m_${key}`, code);
        if(!cancelled) setSvg(svg);
      } catch (e) {
        setSvg(`<pre>${String(e)}</pre>`);
      }
    })();
    return ()=>{ cancelled = true; };
  }, [code, key]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
