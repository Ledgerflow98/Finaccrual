import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "../components/ErrorBoundary";

const mount = () =>
  createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

if (window.Office?.onReady) {
  window.Office.onReady(mount);
} else {
  mount();
}
