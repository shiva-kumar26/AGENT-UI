import React, { createContext, ReactNode } from "react";
import useLocalStorageState from "use-local-storage-state";

export interface ChatMessage {
  from: "agent" | "customer";
  text: string;
}

interface ChatContextType {
  chatMessages: ChatMessage[];
  activeSessionId: string | null;
  customerName: string;
  addMessage: (message: ChatMessage) => void;
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

  const addMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  };

  const setSession = (sessionId: string, name?: string) => {
    setActiveSessionId(sessionId);
    if (name) {
      setCustomerNameState(name);
    }
  };

  const setCustomerName = (name: string) => {
    setCustomerNameState(name);
  };

  const clearChat = () => {
    setChatMessages([]);
    setActiveSessionId(null);
    setCustomerNameState("Customer");
  };

  const value = {
    chatMessages,
    activeSessionId,
    customerName,
    addMessage,
    setSession,
    clearChat,
    setCustomerName
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
