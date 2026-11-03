import type { Metadata } from "next";
import { NOMBRE_BARRIO } from "../constants";
import Panel from "./Panel";

export const metadata: Metadata = { title: `Mi ficha — ${NOMBRE_BARRIO}` };

export default function PanelPage() {
  return <Panel />;
}
