import React, { useState, useEffect, useRef, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, FileText, Edit, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/utils";
import { AuthContext } from "@/store/AuthContext";
import { backendConfig, chatConfig } from "@/config/config";
import { ChatContext, ChatMessage } from "@/store/ChatContext"; // ✅ Consumption
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";

const WS_URL = "ws://10.16.7.91:8082/ws/agent";

// Local interface removed, using imported ChatMessage

interface ChatTemplate {
  id: string;
  name: string;
  content: string;
  attachments: { name: string; url: string }[];
  images: { name: string; url: string }[];
}

export default function StartChatPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  // ✅ Consume ChatContext
  const chatContext = useContext(ChatContext);

  // Fallback if context is missing (should not happen if wrapped correctly)
  if (!chatContext) {
    throw new Error("ChatContext is missing. Ensure ChatProvider is wrapping the app.");
  }

  const {
    chatMessages,
    activeSessionId,
    customerName,
    addMessage,
    setSession,
    setCustomerName
  } = chatContext;

  const socketRef = useRef<WebSocket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<any[]>([]);

  // ✅ Fetch Templates
  useEffect(() => {
    axios
      .get("https://10.16.7.96/api/chat_templates/")
      .then((response) => {
        const mappedTemplates = response.data.map((item: any) => ({
          id: String(item.chat_template_id),
          name: item.chat_template_name,
          content: item.chat_template_body,
          attachments: (item.chat_attachments || []).map((att: any) => ({
            name: att.name,
            url: att.url,
          })),
          images: (item.chat_images || []).map((img: any) => ({
            name: img.name,
            url: img.url,
          })),
        }));
        setTemplates(mappedTemplates);
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
      });
  }, []);

  const activeSessionIdRef = useRef(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

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
        if (data.userInput || data.metadata || data.message || data.initial_message) {
          const customerMessage = data.userInput || data.message || data.initial_message || "";

          // Update customer name and session if available
          const incomingName = data.metadata?.name || data.name || data.metadata?.customer_name;
          const incomingSessionId = data.metadata?.session_id || data.session_id;

          if (incomingSessionId) {
            // Force session switch if new session detected
            if (activeSessionIdRef.current !== incomingSessionId) {
              console.log(`📌 Switching Session: [${activeSessionIdRef.current}] -> [${incomingSessionId}]`);
              setSession(incomingSessionId, incomingName);
              // Update ref immediately for this closure
              activeSessionIdRef.current = incomingSessionId;
            } else if (incomingName && incomingName !== customerName) {
              setCustomerName(incomingName);
            }
          }

          if (customerMessage.trim()) {
            console.log(`💬 [Session: ${incomingSessionId}] Customer says:`, customerMessage);
            addMessage({
              from: "customer",
              text: customerMessage,
            });
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

        if (data.type === "agent_registered") {
          console.log("✅ Agent registered successfully:", data);
          return;
        }

        // ✅ Handle New Chat Offers
        if (data.type === "NEW_OFFER") {
          console.log("🆕 New Offer:", data);
          setIncomingOffers(prev => {
            if (prev.find(o => o.session_id === data.session_id)) return prev;
            return [...prev, data];
          });
          return;
        }

        // ✅ Handle Offer Taken (Remove from list)
        if (data.type === "OFFER_TAKEN") {
          console.log("🚫 Offer Taken:", data.session_id);
          setIncomingOffers(prev => prev.filter(o => o.session_id !== data.session_id));
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
  }, [auth, navigate]); // Removed dependencies on context functions as they are stable (or should be)

  const getInitials = (name: string) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ✅ Send message
  const handleSend = (messageOverride?: string) => {
    const messageToSend = messageOverride || newMessage;

    if (!messageToSend.trim() || !socketRef.current || !activeSessionId) return;

    const payload = {
      type: "agent_reply",
      session_id: activeSessionId,
      message: messageToSend,
    };

    socketRef.current.send(JSON.stringify(payload));
    console.log(`✅ [Session: ${activeSessionId}] Sent to customer:`, messageToSend);

    // ✅ Use Context Action
    addMessage({
      from: "agent",
      text: messageToSend,
    });

    if (!messageOverride) {
      setNewMessage("");
    }
  };

  const cleanContent = (content: string) => {
    return content.replace(/"image"\s*:\s*"data:image[^"]*"/g, "")
      .replace(/"image"\s*:\s*\[image\]/g, "")
      .replace(/(\{\s*\})/g, "")
      .replace(/,\s*}/g, "}")
      .replace(/{\s*,/g, "{")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }

  const handleSendTemplate = (template: ChatTemplate) => {
    const content = cleanContent(template.content);
    // Parse if it's JSON string, although the type says string, sometimes it's stringified JSON based on ChatTemplates.tsx
    let messageText = content;
    try {
      const parsed = JSON.parse(content);
      if (parsed.message) {
        messageText = parsed.message;
      }
    } catch {
      // Not JSON, use as is
    }
    handleSend(messageText);
  };

  const handleEditTemplate = (template: ChatTemplate) => {
    const content = cleanContent(template.content);
    let messageText = content;
    try {
      const parsed = JSON.parse(content);
      if (parsed.message) {
        messageText = parsed.message;
      }
    } catch {
      // Not JSON
    }
    setNewMessage(messageText);
  };


  // ✅ Handle Accept Chat
  const handleAcceptChat = async (offer: any) => {
    try {
      // Optimistic UI update
      // setIncomingOffers(prev => prev.filter(o => o.session_id !== offer.session_id)); 

      await axios.post(`${chatConfig.baseURL}/accept-chat`, {
        session_id: offer.session_id,
        agent_id: auth.userId,
        agent_name: auth.userName
      });

      // Success? Switch session
      setSession(offer.session_id, offer.customer_name);

    } catch (error: any) {
      console.error("Failed to accept chat:", error);
      if (error.response && error.response.status === 409) {
        alert("This chat was just taken by another agent!");
      } else {
        alert("Error accepting chat. Please try again.");
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
      <div className="w-full max-w-7xl h-[85vh] flex gap-6">

        {/* LEFT SIDEBAR - TEMPLATES */}
        <Card className="w-1/3 h-full shadow-sm border border-gray-100 bg-white/80 backdrop-blur-sm flex flex-col">
          <div className="h-[72px] px-6 border-b bg-white/50 flex items-center flex-shrink-0">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-700">
              <FileText className="w-5 h-5 text-blue-600" />
              Chat Templates
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4 bg-transparent">
            <div className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No templates found</p>
              ) : (
                templates.map((template) => (
                  <Card key={template.id} className="shadow-sm border-gray-100/50 hover:shadow-md transition-all duration-200 group bg-white">
                    <CardContent className="p-4 space-y-3">
                      <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
                        {template.name}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-3 bg-gray-50 p-2 rounded-md border border-gray-100">
                        {(() => {
                          try {
                            const parsed = JSON.parse(cleanContent(template.content));
                            return parsed.message || cleanContent(template.content);
                          } catch {
                            return cleanContent(template.content);
                          }
                        })()}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700 shadow-sm"
                          onClick={() => handleSendTemplate(template)}
                          disabled={!isConnected || !activeSessionId}
                        >
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 hover:bg-gray-100"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* CENTER - QUEUE (Visible if requests exist) */}
        {incomingOffers.length > 0 && (
          <Card className="w-80 h-full shadow-sm border border-gray-100 bg-white/80 backdrop-blur-sm flex flex-col ml-4">
            <div className="h-[72px] px-6 border-b bg-white/50 flex items-center flex-shrink-0 justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5 text-green-600" />
                Queue
              </h3>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{incomingOffers.length}</span>
            </div>
            <ScrollArea className="flex-1 p-4 bg-transparent">
              <div className="space-y-3">
                {incomingOffers.map((offer) => (
                  <Card key={offer.session_id} className="shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-gray-800 text-sm">{offer.customer_name || "Unknown"}</div>
                        <span className="text-[10px] text-gray-400">{new Date(offer.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{offer.topic || "New connection request..."}</p>
                      <Button
                        className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptChat(offer)}
                      >
                        Accept Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* RIGHT SIDE - CHAT */}
        <Card className="flex-1 h-full shadow-2xl border-none flex flex-col overflow-hidden relative z-10">
          {/* HEADER */}
          <div className="h-[72px] px-6 border-b bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-gray-100">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${customerName}&background=0D8ABC&color=fff`} />
                <AvatarFallback className="bg-blue-600 text-white font-bold">{getInitials(customerName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-base font-bold text-gray-800">{customerName}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                  <p className="text-xs text-gray-500 font-medium">
                    {isConnected ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 thin-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-blue-500 ml-1" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Start a conversation</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Waiting for a customer to connect. Messages will appear here.
                </p>
                <p className="text-xs text-gray-400 mt-4 font-mono bg-gray-100 px-2 py-1 rounded">Agent ID: {auth.userId}</p>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.from === "agent" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.from === "customer" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${customerName}&background=0D8ABC&color=fff`} />
                        <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">{getInitials(customerName)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`flex flex-col ${msg.from === "agent" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-5 py-3 max-w-sm text-sm shadow-sm ${msg.from === "agent"
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-blue-50 border border-blue-100 text-gray-800 rounded-tl-sm"
                          }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* INPUT */}
          <div className="p-4 border-t flex gap-3 flex-shrink-0 bg-white">
            <Input
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={!isConnected || !activeSessionId}
              className="flex-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-600 focus-visible:ring-blue-600 focus-visible:ring-offset-0 focus:border-transparent transition-all outline-none"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!isConnected || !newMessage.trim() || !activeSessionId}
              className="bg-blue-600 hover:bg-blue-700 shadow-md px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}