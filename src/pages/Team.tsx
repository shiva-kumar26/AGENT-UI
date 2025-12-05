import React, { useEffect, useState, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { backendConfig } from "@/config/config";
import axios from "axios";
import { CallContext } from "@/components/calls/CallProvider";
import { AuthContext } from "@/store/AuthContext";
import { WebSocketEventContext } from "@/store/WebSocketEventContext";


const getStatusBadge = (status) => {
  const s = status?.toLowerCase() || "";
  if (s === "available") return "bg-green-100 text-green-800";
  if (s === "busy" || s.includes("queue call")) return "bg-blue-100 text-blue-800";
  if (s === "on break" || s.includes("break")) return "bg-yellow-100 text-yellow-800";
  if (s === "logged out" || s === "unavailable") return "bg-red-300 text-red-600";
  return "bg-gray-100 text-gray-800";
};


const getCardBorderClass = (status) => {
  const s = status?.toLowerCase() || "";
  if (s === "available") return "border-l-4 border-b-4 border-l-green-500 border-b-green-500 border-t-0 border-r-0";
  if (s === "busy" || s.includes("queue call")) return "border-l-4 border-b-4 border-l-blue-500 border-b-blue-500 border-t-0 border-r-0";
  if (s === "on break" || s.includes("break")) return "border-l-4 border-b-4 border-l-yellow-500 border-b-yellow-500 border-t-0 border-r-0";
  if (s === "logged out" || s === "unavailable") return "border-l-4 border-b-4 border-l-red-500 border-b-red-500 border-t-0 border-r-0";
  return "border-l-4 border-b-4 border-l-gray-300 border-b-gray-300 border-t-0 border-r-0";
};


export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [realtimeAgents, setRealtimeAgents] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    activeCallDetails,
    transferCall,
    conferenceCall,
    setTransferCall,
    setConferenceCall,
    setTransferContextNumber,
    setConferenceContextNumber,
  } = useContext(CallContext);
  
  const { auth } = useContext(AuthContext);
  const context = useContext(WebSocketEventContext);
  const latestEvent = context?.latestEvent;


  // ⚡ INSTANT AUTO-REFRESH: Load real-time agent status every 2 seconds
  useEffect(() => {
    const loadRealtimeStatus = async () => {
      try {
        const response = await axios.get("http://10.16.7.91:5001/realtime_agents");
        setRealtimeAgents(response.data || []);
        console.log("✅ Real-time agents updated:", response.data?.length, "agents");
      } catch (error) {
        console.error("❌ ERROR: Failed to load real-time agent status:", error);
      }
    };

    // Load immediately on mount
    loadRealtimeStatus();
    
    // Then load every 2 seconds ⚡ (FASTER for instant updates!)
    const interval = setInterval(loadRealtimeStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);


  // Update team member status based on WebSocket events
  useEffect(() => {
    if (!latestEvent) return;

    const {
      Event,
      EventType,
      Agent,
      Status,
      Username,
      Caller,
      Event: CallEvent,
    } = latestEvent;

    setTeamMembers((prevMembers) =>
      prevMembers.map((member) => {
        const extension = member.extension;

        if (Event === "Register" && Username === extension) {
          return { ...member, status: "Available" };
        }
        if (Event === "UnRegister" && Username === extension) {
          return { ...member, status: "Logged Out" };
        }
        if (Event === "Agent-Status" && Agent?.startsWith(extension)) {
          return { ...member, status: Status };
        }

        if (EventType === "CALL_EVENT" && Caller === extension) {
          if (CallEvent === "CHANNEL_ANSWER") {
            return { ...member, status: "On Call" };
          }
          if (CallEvent === "CHANNEL_HANGUP") {
            return { ...member, status: "Available" };
          }
        }

        return member;
      })
    );
  }, [latestEvent]);


  // Load team members filtered by supervisor from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔍 DEBUG: AUTH OBJECT:", auth);
        console.log("🔍 DEBUG: auth.userName:", auth?.userName);
        
        const response = await axios.get(
          `${backendConfig.baseURL}${backendConfig.agents}`,
          {
            headers: {
              'X-User-ID': auth?.userName
            }
          }
        );
        
        console.log("✅ SUCCESS: Team members from backend:", response.data);
        console.log("✅ SUCCESS: Number of members:", response.data.length);
        setTeamMembers(response.data);
      } catch (error) {
        console.error("❌ ERROR: Failed to load team members:", error);
        console.error("❌ ERROR: Response:", error.response?.data);
      }
    };

    if (auth?.userName) {
      console.log("✅ Loading data with userName:", auth.userName);
      loadData();
    } else {
      console.log("⚠️ WARNING: No userName found in auth");
    }
  }, [auth?.userName]);


  // 🎯 Merge team members with real-time status
  const getMergedTeamMembers = () => {
    return teamMembers.map((member) => {
      // Find matching real-time agent by extension
      const realtimeAgent = realtimeAgents.find(
        (rt) => rt.Extension === member.extension
      );

      return {
        ...member,
        // Use real-time status if available, otherwise keep current status
        status: realtimeAgent?.status || member.status || "Unknown",
        calls_handled: realtimeAgent?.calls_handled || 0,
        answer_rate: realtimeAgent?.answer_rate || 0,
        avg_handled_time: realtimeAgent?.avg_handled_time || "00:00:00",
        login_time: realtimeAgent?.login_time || "00:00:00",
      };
    });
  };

  const mergedTeamMembers = getMergedTeamMembers();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Dashboards</h1>
          <p className="text-sm text-gray-600 mt-1">
            Showing <strong>{mergedTeamMembers.length}</strong> agents in your team
            <span className="ml-2 inline-block">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mergedTeamMembers.map((member) => {
            const fullName = `${member.agent_name || member.firstname + ' ' + member.lastname}`;
            const initials = `${member.firstname?.[0] ?? ""}${member.lastname?.[0] ?? ""}`;
            const isSupervisor = member.team_name === "Supervisor" || member.role === "Supervisor";
            
            return (
              <Card
                key={member.agent_id}
                onClick={() => {
                  setSelectedMember(member);
                  setIsModalOpen(true);
                }}
                className={`w-45 h-auto cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 ${getCardBorderClass(member.status)}`}
              >
                <CardContent className="pt-4 px-4 pb-3">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="font-semibold text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Live status indicator dot with animation */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-all duration-300 ${
                          member.status?.toLowerCase() === "available"
                            ? "bg-green-500 animate-pulse"
                            : member.status?.toLowerCase() === "busy" || member.status?.toLowerCase().includes("queue call")
                            ? "bg-blue-500"
                            : member.status?.toLowerCase().includes("break")
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}
                      ></div>
                    </div>
                    <div>
                      <h1 className="font-semibold text-sm">
                        {fullName}
                        {isSupervisor && (
                          <span className="ml-1 text-xs text-gray-500">(Supervisor)</span>
                        )}
                      </h1>
                      <Badge className={`${getStatusBadge(member.status)} transition-all duration-300`}>
                        {member.status || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Extension:</strong> {member.extension || ""}
                    </p>
                    <p>
                      <strong>Team:</strong> {member.team_name || ""}
                    </p>
                    {member.calls_handled > 0 && (
                      <>
                        <p>
                          <strong>Calls:</strong> {member.calls_handled}
                        </p>
                        <p>
                          <strong>Answer Rate:</strong> {member.answer_rate}%
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {mergedTeamMembers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg font-medium">No team members found</p>
            <p className="text-gray-500 text-sm mt-2">Team members will appear here when assigned</p>
          </div>
        )}
      </div>

      {/* Transfer/Conference Modal */}
      {activeCallDetails &&
        (transferCall || conferenceCall) &&
        isModalOpen &&
        selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-80 relative shadow-lg">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl font-bold"
                onClick={() => {
                  setIsModalOpen(false);
                  setTransferCall(false);
                  setConferenceCall(false);
                }}
              >
                ×
              </button>

              <h2 className="text-lg font-semibold mb-4">Agent Info</h2>

              <p className="mb-4">
                {transferCall ? (
                  <>
                    Transfer call to:{" "}
                    <strong>{selectedMember.extension}</strong>
                  </>
                ) : conferenceCall ? (
                  <>
                    Add to conference with:{" "}
                    <strong>{selectedMember.extension}</strong>
                  </>
                ) : (
                  <> </>
                )}
              </p>

              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                onClick={() => {
                  setIsModalOpen(false);
                  if (transferCall) {
                    setTransferContextNumber(selectedMember.extension);
                  } else {
                    setConferenceContextNumber(selectedMember.extension);
                  }
                }}
              >
                {transferCall ? "Transfer" : "Add"}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}