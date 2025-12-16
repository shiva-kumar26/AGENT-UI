import React, { useState, useEffect, useRef, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/utils";
import { AuthContext } from "@/store/AuthContext";

const WS_URL = "ws://10.16.7.91:8000/ws/agent";

interface ChatMessage {
  from: "agent" | "customer";
  text: string;
}

export default function StartChatPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const socketRef = useRef<WebSocket | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // ✅ Connect WebSocket using auth data
  useEffect(() => {
    if (!auth?.isAuthenticated || !auth?.userId) {
      console.log("❌ Not authenticated");
      navigate(createPageUrl("Login"));
      return;
    }

    console.log("🔌 Connecting with agent:", auth.userId, auth.userName);

    socketRef.current = new WebSocket(WS_URL);

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);

      // ✅ Register with auth data
      const register = {
        type: "agent_register",
        agent_id: auth.userId,
        name: auth.userName,
      };

      socketRef.current?.send(JSON.stringify(register));
      console.log("✅ Agent registered:", auth.userId);
    };

    // ✅ FIXED MESSAGE HANDLER
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Received from backend:", data);

        // ✅ Handle customer messages (from user endpoint)
        // Backend sends: { metadata: { session_id: "..." }, userInput: "hello", ... }
        if (data.userInput || data.metadata) {
          const customerMessage = data.userInput || data.message || "";

          if (customerMessage.trim()) {
            console.log("💬 Customer says:", customerMessage);

            setChatMessages((prev) => [
              ...prev,
              {
                from: "customer",
                text: customerMessage,
              },
            ]);

            // Store session_id if provided
            if (data.metadata?.session_id) {
              setActiveSessionId(data.metadata.session_id);
              console.log("📌 Session ID set:", data.metadata.session_id);
            }
          }
          return;
        }

        // ✅ Handle typing events
        if (data.event === "typing") {
          console.log("🔤 Customer is typing...");
          return;
        }

        // ✅ Handle stop typing events
        if (data.event === "stop_typing") {
          console.log("🔤 Customer stopped typing");
          return;
        }

        // ✅ Handle agent registration response
        if (data.type === "agent_registered") {
          console.log("✅ Agent registered successfully:", data);
          return;
        }

        console.log("📬 Other message:", data);
      } catch (err) {
        console.error("❌ Error parsing message:", err);
      }
    };

    socketRef.current.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setIsConnected(false);
    };

    socketRef.current.onclose = () => {
      console.log("🔌 Disconnected");
      setIsConnected(false);
    };

    return () => {
      socketRef.current?.close();
    };
  }, [auth, navigate]);

  // ✅ Send message
  const handleSend = () => {
    if (!newMessage.trim() || !socketRef.current || !activeSessionId) return;

    const payload = {
      type: "agent_reply",
      session_id: activeSessionId,
      message: newMessage,
    };

    socketRef.current.send(JSON.stringify(payload));
    console.log("✅ Sent to customer:", newMessage);

    setChatMessages((prev) => [
      ...prev,
      {
        from: "agent",
        text: newMessage,
      },
    ]);

    setNewMessage("");
  };

  if (!auth?.isAuthenticated) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-red-600 font-bold">❌ Not Logged In</p>
            <Button
              onClick={() => navigate(createPageUrl("Login"))}
              className="w-full bg-blue-600"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-2xl h-[600px] flex flex-col">
        {/* HEADER */}
        <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-blue-50 to-blue-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`https://i.pravatar.cc/150?u=${auth.userId}`} />
              <AvatarFallback>{auth.userName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{auth.userName}</CardTitle>
              <p className={`text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}>
                {isConnected ? "🟢 Online" : "🔴 Offline"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        {/* CHAT */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-3">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Send className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Waiting for customer messages...</p>
              <p className="text-xs text-gray-400 mt-2">Agent: {auth.userId}</p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.from === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-xs ${
                    msg.from === "agent"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>

        {/* INPUT */}
        <div className="p-4 border-t flex gap-2 flex-shrink-0">
          <Input
            placeholder={isConnected ? "Type..." : "Connecting..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!isConnected || !activeSessionId}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!isConnected || !newMessage.trim() || !activeSessionId}
            className="bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}