import { useContext } from "react";
import AppRoutes from "./routes/AppRoutes";
import LayoutWrapper from "./layout/layout";
import { WebSocketEventProvider } from "./store/WebSocketEventContext";
import { AuthContext } from "../src/store/AuthContext";

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
      <LayoutWrapper>
        <AppRoutes />
      </LayoutWrapper>
    </WebSocketEventProvider>
  );
};

export default App;
