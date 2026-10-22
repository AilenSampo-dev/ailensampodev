"use client";

import { useCallback, useRef, useState } from "react";
import DemoSection from "./DemoSection";
import ArchitectureSection from "./ArchitectureSection";
import { resolveDemoTaskLabel, type GeneratedArchitecture } from "./demoTasks";
import { demoStore } from "./demoStore";
import { generateArchitecture } from "./generateArchitecture";

export default function DemoBlock() {
  const [task, setTask] = useState(() => resolveDemoTaskLabel(""));
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [architecture, setArchitecture] = useState<GeneratedArchitecture | null>(null);
  const requestId = useRef(0);

  const handleGenerate = useCallback((value: string) => {
    const label = resolveDemoTaskLabel(value);
    const id = ++requestId.current;
    setTask(label);
    setArchitecture(null); // muestra el estado "armando…"
    demoStore.set({ task: label, architecture: null });
    setShowArchitecture(true);
    requestAnimationFrame(() => {
      document.getElementById("arquitectura")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    generateArchitecture(label).then((result) => {
      if (id !== requestId.current) return; // ignora respuestas de pedidos viejos
      setArchitecture(result);
      demoStore.set({ architecture: result });
    });
  }, []);

  // Al ocultar Arquitectura la página se acorta: volver a la demo evita quedar en el medio de otra sección.
  const handleRetry = useCallback(() => {
    requestId.current++;
    setShowArchitecture(false);
    demoStore.set({ task: null, architecture: null });
    requestAnimationFrame(() => {
      document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <>
      <DemoSection onGenerate={handleGenerate} />
      {showArchitecture ? (
        <ArchitectureSection task={task} architecture={architecture} onRetry={handleRetry} />
      ) : null}
    </>
  );
}
