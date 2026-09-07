"use client";

import { useCallback, useState } from "react";
import DemoSection from "./DemoSection";
import ArchitectureSection from "./ArchitectureSection";

const DEFAULT_TASK = "Responder preguntas por WhatsApp";

export default function DemoBlock() {
  const [task, setTask] = useState(DEFAULT_TASK);
  const [showArchitecture, setShowArchitecture] = useState(false);

  const handleGenerate = useCallback((value: string) => {
    const next = value.trim() || DEFAULT_TASK;
    setTask(next);
    setShowArchitecture(true);
    requestAnimationFrame(() => {
      document.getElementById("arquitectura")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <>
      <DemoSection onGenerate={handleGenerate} />
      {showArchitecture ? <ArchitectureSection task={task} onRetry={() => setShowArchitecture(false)} /> : null}
    </>
  );
}
