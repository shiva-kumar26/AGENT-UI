import React, { useState, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/utils";
import { ChatContext } from "@/store/ChatContext";

export default function StartChatPage() {
  const navigate = useNavigate();

  // const messages = [
  //   { from: "customer", text: "Hi, I need some help with my account." },
  //   {
  //     from: "agent",
  //     text: "Of course! I'd be happy to help. What seems to be the issue?",
  //   },
  //   {
  //     from: "customer",
  //     text: "I was charged twice for my last purchase, and I’m not sure why.",
  //   },
  //   {
  //     from: "agent",
  //     text: "I’m sorry to hear that. Could you please provide the order number?",
  //   },
  //   { from: "customer", text: "Yes, it’s #789456." },
  //   {
  //     from: "agent",
  //     text: "Thanks. Let me take a look at that order for you. Please give me a moment.",
  //   },
  //   {
  //     from: "agent",
  //     text: "I can confirm there are two identical charges for the same item. It appears to be a duplicate transaction.",
  //   },
  //   {
  //     from: "customer",
  //     text: "That’s what I thought. Can I get a refund for the extra charge?",
  //   },
  //   {
  //     from: "agent",
  //     text: "Absolutely. I’ll go ahead and process a refund for the duplicate charge. It should reflect in your account within 3–5 business days.",
  //   },
  //   {
  //     from: "customer",
  //     text: "Perfect, thank you so much for your help!",
  //   },
  //   {
  //     from: "agent",
  //     text: "You're welcome! Is there anything else I can assist you with today?",
  //   },
  //   { from: "customer", text: "Nope, that was all. Thanks again!" },
  //   {
  //     from: "agent",
  //     text: "Have a great day! Feel free to reach out if you need anything else.",
  //   },
  // ];

  const { chatMessages, addMessage, clearChat } = useContext(ChatContext);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim() === "") return;

    addMessage({ from: "agent", text: newMessage });
    setNewMessage("");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              {/* <ArrowLeft className="w-4 h-4" /> */}
            </Button>
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>John Doe</CardTitle>
              <p className="text-sm text-green-500">Online</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              clearChat();
              navigate(createPageUrl("Dashboard"));
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4 h-96 overflow-y-auto">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                msg.from === "agent" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.from === "customer" && (
                <Avatar className="h-8 w-8 font-bold">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-xs ${
                  msg.from === "agent"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p>{msg.text}</p>
              </div>
              {msg.from === "agent" && (
                <Avatar className="h-8 w-8 font-bold">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </CardContent>
        <div className="p-4 border-t flex items-center gap-2">
          {/* <Input placeholder="Type your message..." />
          <Button>
            <Send className="w-4 h-4" />
          </Button> */}

          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <Button onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
