import React, { createContext } from "react";
import useLocalStorageState from "use-local-storage-state";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [chatMessages, setChatMessages] = useLocalStorageState(
    "chat-messages",
    {
      defaultValue: [],
    }
  );

  const addMessage = (message) => setChatMessages((prev) => [...prev, message]);

  const clearChat = () => setChatMessages([]);

  const value = { chatMessages, addMessage, clearChat };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
