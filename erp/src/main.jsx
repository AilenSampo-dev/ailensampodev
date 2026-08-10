import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import FirmarContratoPage from "./components/FirmarContratoPage.jsx";

const firmaMatch = window.location.pathname.match(/^\/firmar\/([^/]+)\/?$/);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {firmaMatch ? <FirmarContratoPage token={firmaMatch[1]} /> : <App />}
  </StrictMode>
);
