import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { OrganizationProvider } from "./contexts/OrganizationContext";

createRoot(document.getElementById("root")!).render(
  <OrganizationProvider>
    <App />
  </OrganizationProvider>
);
