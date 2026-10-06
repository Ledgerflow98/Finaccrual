import AppRoutes from "./routes/AppRoutes";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "sonner";

function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" richColors />
      <AppRoutes />
    </AppProvider>
  );
}

export default App;