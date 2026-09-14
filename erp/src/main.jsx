import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import FirmarContratoPage from "./components/FirmarContratoPage.jsx";
import FirmarAddendumPage from "./components/FirmarAddendumPage.jsx";

const firmaMatch = window.location.pathname.match(/^\/firmar\/([^/]+)\/?$/);
const addendumMatch = window.location.pathname.match(/^\/addendum\/([^/]+)\/?$/);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {firmaMatch ? (
      <FirmarContratoPage token={firmaMatch[1]} />
    ) : addendumMatch ? (
      <FirmarAddendumPage token={addendumMatch[1]} />
    ) : (
      <App />
    )}
  </StrictMode>
);
