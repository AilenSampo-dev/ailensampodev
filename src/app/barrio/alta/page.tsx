import type { Metadata } from "next";
import { NOMBRE_BARRIO } from "../constants";
import Alta from "./Alta";

export const metadata: Metadata = { title: `Sumá tu emprendimiento — ${NOMBRE_BARRIO}` };

export default function AltaPage() {
  return <Alta />;
}
