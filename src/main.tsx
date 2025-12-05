import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { EmailProvider } from "./store/EmailContext.tsx";
import { ChatProvider } from "./store/ChatContext.tsx";
import { AuthProvider } from "./store/AuthContext.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,      // ✅ Add this
      v7_relativeSplatPath: true     // ✅ Add this
    }}
  >
    <QueryClientProvider client={queryClient}>  
      <AuthProvider>
        <EmailProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </EmailProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
