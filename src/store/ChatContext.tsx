import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import useLocalStorageState from "use-local-storage-state";

export interface ChatMessage {
  from: "agent" | "customer";
  text: string;
  timestamp: string;
}

interface ChatContextType {
  chatMessages: ChatMessage[];
  activeSessionId: string | null;
  customerName: string;
  addMessage: (message: Omit<ChatMessage, "timestamp">) => void;
  setSession: (sessionId: string, name?: string) => void;
  clearChat: () => void;
  setCustomerName: (name: string) => void;
}

export const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chatMessages, setChatMessages] = useLocalStorageState<ChatMessage[]>(
    "chat-messages",
    {
      defaultValue: [],
    }
  );

  const [activeSessionId, setActiveSessionId] = useLocalStorageState<string | null>(
    "chat-session-id",
    {
      defaultValue: null,
    }
  );

  const [customerName, setCustomerNameState] = useLocalStorageState<string>(
    "chat-customer-name",
    {
      defaultValue: "Customer",
    }
  );

  const addMessage = useCallback((message: Omit<ChatMessage, "timestamp">) => {
    const newMessage = {
      ...message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, newMessage]);
  }, [setChatMessages]);

  const setSession = useCallback((sessionId: string, name?: string) => {
    console.log("🧹 ChatContext: Clearing messages for new session:", sessionId);
    setChatMessages([]);
    setActiveSessionId(sessionId);
    if (name) {
      setCustomerNameState(name);
    }
  }, [setChatMessages, setActiveSessionId, setCustomerNameState]);

  const setCustomerName = useCallback((name: string) => {
    setCustomerNameState(name);
  }, [setCustomerNameState]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    setActiveSessionId(null);
    setCustomerNameState("Customer");
  }, [setChatMessages, setActiveSessionId, setCustomerNameState]);

  const value = useMemo(() => ({
    chatMessages,
    activeSessionId,
    customerName,
    addMessage,
    setSession,
    clearChat,
    setCustomerName
  }), [chatMessages, activeSessionId, customerName, addMessage, setSession, clearChat, setCustomerName]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
