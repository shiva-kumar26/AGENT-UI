import React, { useState, useEffect, useContext, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { createPageUrl } from "@/utils/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Users2,
  BookOpen,
  BarChart3,
  Phone,
  Mail,
  MessageCircle,
  UserCircle,
  Headset,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ActiveCallBar from "@/components/calls/ActiveCallBar";
import { CallProvider, CallContext } from "@/components/calls/CallProvider";
import { AuthContext } from "@/store/AuthContext";
import { WebSocketEventContext } from "@/store/WebSocketEventContext";
import userConfig, { agentStatus, backendConfig } from "@/config/config";
import zeniusLogo from "@/images/zenius.png";
import axios from "axios";
import NewCallDialog from "@/pages/NewcallDialog";
import Chatbot from "@/components/KnowledgeBase/Chatbot";

type LayoutContentProps = {
  children: ReactNode;
};

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  { title: "Customers", url: createPageUrl("Customers"), icon: UserCircle },
  { title: "Communications", url: createPageUrl("Communications"), icon: MessageSquare },
  { title: "Team", url: createPageUrl("Team"), icon: Users2 },
  { title: "Knowledge Base", url: createPageUrl("KnowledgeBase"), icon: BookOpen },
  { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3 },
  { title: "Agent Assist", url: createPageUrl("AgentAssists"), icon: Headset },
];

const agentStatuses = agentStatus;

function LayoutContent({ children }: LayoutContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [agentStatus, setAgentStatus] = useState("Available");
  const [displayStatus, setDisplayStatus] = useState("Available");
  const [previousStatus, setPreviousStatus] = useState("Available");
  const [currentAgent, setCurrentAgent] = useState<string>("");
  const [currentAgentName, setCurrentAgentName] = useState<string>("Agent"); // ✅ NEW
  const [newCallDialogOpen, setNewCallDialogOpen] = useState(false);
  const [chatViewState, setChatViewState] = useState<'closed' | 'hidden' | 'visible'>('closed');
  const { callState, activeCallDetails } = useContext(CallContext);
  const { auth, setAuthField } = useContext(AuthContext);

  // ✅ NEW: WebSocket context for real-time updates
  const context = useContext(WebSocketEventContext);
  const latestEvent = context?.latestEvent;

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      navigate(createPageUrl("Welcome"));
    }
  }, []);

  useEffect(() => {
    if (auth) {
      setCurrentAgent(auth.userId);
      setAgentStatus(auth.status);
      setDisplayStatus(auth.status);

      // ✅ NEW: Get agent name from auth context
      // Try different possible fields where name might be stored
      let name = "Agent";

      if (auth?.user?.first_name && auth?.user?.last_name) {
        name = `${auth.user.first_name} ${auth.user.last_name}`;
      } else if (auth?.fullName) {
        name = auth.fullName;
      } else if (auth?.userName) {
        name = auth.userName;
      } else if (auth?.first_name && auth?.last_name) {
        name = `${auth.first_name} ${auth.last_name}`;
      }

      setCurrentAgentName(name);
      console.log("[Layout] Agent name set to:", name);
    }
  }, [auth]);

  // Automatically switch to "On Call" during active calls
  useEffect(() => {
    if (callState === "active" || callState === "connecting" || callState === "ringing") {
      if (displayStatus !== "On Call") {
        setPreviousStatus(agentStatus);
      }
      setDisplayStatus("On Call");
    } else if (callState === "idle") {
      setDisplayStatus(previousStatus || "Available");
    }
  }, [callState]);

  // ✅ NEW: Listen for WebSocket status changes (INSTANT UPDATES)
  useEffect(() => {
    if (!latestEvent) return;

    const {
      Event,
      EventType,
      Status,
      Agent,
      Username,
      CallEvent,
    } = latestEvent;

    // Check if this WebSocket event is for the CURRENT agent
    const isCurrentAgent =
      Agent?.includes(auth?.userId) ||
      Username === auth?.userId;

    if (!isCurrentAgent) return;

    console.log(`[Layout] WebSocket Event: ${Event}`, latestEvent);

    // Update status based on event type
    if (Event === "Register") {
      console.log(`[Layout] ✅ Agent registered: Available`);
      setAgentStatus("Available");
      setDisplayStatus("Available");
      setAuthField("status", "Available");
    }
    else if (Event === "UnRegister") {
      console.log(`[Layout] ❌ Agent unregistered: Logged Out`);
      setAgentStatus("Logged Out");
      setDisplayStatus("Logged Out");
      setAuthField("status", "Logged Out");
    }
    else if (Event === "Agent-Status") {
      console.log(`[Layout] 📍 Agent status changed: ${Status}`);
      // Only update if not currently on a call
      if (callState === "idle") {
        setAgentStatus(Status);
        setDisplayStatus(Status);
        setAuthField("status", Status);
      }
    }
    else if (EventType === "CALL_EVENT") {
      if (CallEvent === "CHANNEL_ANSWER") {
        console.log(`[Layout] 📞 Call answered: On Call`);
        setPreviousStatus(agentStatus);
        setDisplayStatus("On Call");
      }
      else if (CallEvent === "CHANNEL_HANGUP") {
        console.log(`[Layout] 📴 Call ended, restoring status`);
        setDisplayStatus(previousStatus || "Available");
      }
    }
  }, [latestEvent, auth?.userId, callState, agentStatus]);

  // ✅ NEW: Poll real-time API every 2 seconds (FALLBACK + CONFIRMATION)
  useEffect(() => {
    const refreshAgentStatus = async () => {
      try {
        const response = await axios.get(
          "http://10.16.7.91:5001/realtime_agents"
        );

        // Find the current agent in the list
        const currentAgent = response.data?.find(
          (agent: any) => agent.Extension === auth?.userId
        );

        if (currentAgent?.status && callState === "idle") {
          console.log(
            `[Layout] 🔄 Real-time API status: ${currentAgent.status}`
          );

          // Only update if status actually changed
          if (currentAgent.status !== agentStatus) {
            // ✅ FIX: Ignore "Logged Out" from polling to prevent stale data from forcing logout
            // The polling API might lag behind the actual login session

          // For double login prevention
          //if (currentAgent.status === "Logged Out" && agentStatus !== "Logged Out") {
           //  console.warn("[Layout] Ignoring 'Logged Out' from polling (potential stale state)");
            //return;
          //}
          // Prevent stale logout overwriting an active session
         // Only update if status actually changed



            setAgentStatus(currentAgent.status);
            setDisplayStatus(currentAgent.status);
            setAuthField("status", currentAgent.status);
          }
        }
      } catch (error) {
        console.error("[Layout] ❌ Failed to fetch real-time status:", error);
      }
    };

    // Call immediately on mount
    refreshAgentStatus();

    // Then call every 2 seconds
    const interval = setInterval(refreshAgentStatus, 2000);

    return () => clearInterval(interval);
  }, [auth?.userId, callState, agentStatus]);

  const handleStatusChange = async (status: string) => {
    if (callState !== "idle") {
      console.log("Status change ignored: agent currently On Call");
      return;
    }

    const requestBody = { agent: auth.userId, status };

    try {
      const response = await axios.post(
        `${backendConfig.baseURL}${backendConfig.port}${backendConfig.setAgentStatus}`,
        requestBody,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        setAgentStatus(status);
        setDisplayStatus(status);
        setAuthField("status", status);
      }
    } catch (error: any) {
      console.log("Set Agent Status API --> Error:", error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Available":
        return "bg-green-500";
      case "On Break":
        return "bg-yellow-500";
      case "Available (On Demand)":
        return "bg-blue-500";
      case "Logged Out":
        return "bg-gray-500";
      case "On Call":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (location.pathname === createPageUrl("Welcome")) return <>{children}</>;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-slate-50">
          {/* Sidebar */}
          <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader className="p-2">
              <div className="flex items-center justify-center">
                <img src={zeniusLogo} alt="Zenius" className="w-18 h-12 mx-auto" />
              </div>
            </SidebarHeader>

            <SidebarContent className="p-1">
              {/* Menu items */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg ${location.pathname === item.url ? "bg-blue-50 text-blue-700" : ""
                            }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                            <item.icon className="w-5 h-5" />
                            <p>{item.title}</p>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Quick actions */}
              <SidebarGroup className="mt-1">
                <SidebarGroupContent>
                  <div className="space-y-2">
                    <Button
                      className={`w-full justify-start text-gray ${activeCallDetails
                        ? "bg-white-600 opacity-50 cursor-not-allowed hover:bg-white-600 hover:text-gray"
                        : "bg-white-600 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      onClick={() => setNewCallDialogOpen(true)}
                      disabled={activeCallDetails}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      <p>New Call</p>
                    </Button>

                    <Link to={createPageUrl("ComposeEmail")}>
                      <Button className="w-full justify-start bg-white-600 hover:bg-blue-50 hover:text-blue-700 text-gray">
                        <Mail className="w-4 h-4 mr-2" />
                        <p>Compose Email</p>
                      </Button>
                    </Link>

                    <Link to={createPageUrl("StartChat")}>
                      <Button className="w-full justify-start bg-white-600 hover:bg-blue-50 hover:text-blue-700 text-gray">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        <p>Start Chat</p>
                      </Button>
                    </Link>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            {/* Footer - Agent Status Section */}
            <SidebarFooter className="border-t border-gray-100 p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold text-sm">
                        {currentAgentName?.charAt(0).toUpperCase() || "A"}
                      </span>
                    </div>
                    {/* ✅ Status indicator dot - UPDATES IN REAL-TIME */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                        displayStatus
                      )} rounded-full border-2 border-white transition-all duration-300`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* ✅ NEW: Show agent name first, then extension */}
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {currentAgentName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentAgent}
                    </p>
                  </div>
                </div>

                {/* ✅ Status Dropdown - NOW UPDATES IN REAL-TIME */}
                <div className="space-y-2">
                  <Select
                    value={displayStatus}
                    onValueChange={handleStatusChange}
                    disabled={callState !== "idle"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {displayStatus === "On Call" ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-red-500 font-medium">On Call</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 ${getStatusColor(displayStatus)} rounded-full`}
                            />
                            <span>{displayStatus}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {agentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${getStatusColor(status)} rounded-full`} />
                            {status}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* Main content */}
          <main className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg" />
                <h1 className="text-xl font-semibold">CallCenter Pro</h1>
              </div>
            </header>

            <div className="relative flex-1">
              <div className="pt-[70px]">
                <ActiveCallBar />
              </div>
              <div>{children}</div>
            </div>

            {/* Global Chatbot Button */}
            <Button
              onClick={() => {
                if (chatViewState === 'visible') setChatViewState('hidden');
                else setChatViewState('visible');
              }}
              className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>

            {/* Global Chatbot Component */}
            {chatViewState !== 'closed' && (
              <div style={{ display: chatViewState === 'hidden' ? 'none' : 'block' }}>
                <Chatbot
                  onClose={() => setChatViewState('closed')}
                  onMinimize={() => setChatViewState('hidden')}
                />
              </div>
            )}
          </main>
        </div>

        <NewCallDialog open={newCallDialogOpen} onOpenChange={setNewCallDialogOpen} />
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default function LayoutWrapper({ children }: LayoutContentProps) {
  return (
    <CallProvider>
      <LayoutContent>{children}</LayoutContent>
    </CallProvider>
  );
}
