import { useContext } from "react";
import AppRoutes from "./routes/AppRoutes";
import LayoutWrapper from "./layout/layout";
import { WebSocketEventProvider } from "./store/WebSocketEventContext";
import { AuthContext } from "../src/store/AuthContext";

import { InteractionProvider } from "./store/InteractionContext";

const App = () => {
  const { auth } = useContext(AuthContext);

  if (!auth?.isAuthenticated) {
    return (
      <LayoutWrapper>
        <AppRoutes />
      </LayoutWrapper>
    );
  }

  return (
    <WebSocketEventProvider>
      <InteractionProvider>
        <LayoutWrapper>
          <AppRoutes />
        </LayoutWrapper>
      </InteractionProvider>
    </WebSocketEventProvider>
  );
};

export default App;
