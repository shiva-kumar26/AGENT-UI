import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { backendConfig, chatConfig } from "@/config/config";
import { AuthContext } from "@/store/AuthContext";

export const WebSocketEventContext = createContext(null);

export const WebSocketEventProvider = ({ children }) => {
  const [latestEvent, setLatestEvent] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const wsRef = useRef(null);
  const { auth } = useContext(AuthContext);

  useEffect(() => {
    wsRef.current = new WebSocket("wss://10.16.7.96:5050");

    wsRef.current.onopen = () => {
      console.log("[📡] WebSocket connected");
    };

    wsRef.current.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log("[📥] Event received:", data);
        setLatestEvent(data);
      } catch (err) {
        console.error("Invalid WebSocket data", err);
      }
    };

    wsRef.current.onclose = () => {
      console.log("[🔌] WebSocket disconnected");
    };

    return () => {
      console.log("[🧹] Cleaning up WebSocket connection");
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!latestEvent) return;

    const {
      Event,
      EventType,
      Agent,
      Status,
      Username,
      From,
      Event: CallEvent,
    } = latestEvent;

    console.log("🔔 New WebSocket message:", latestEvent);
    setTeamMembers((prevMembers) =>
      prevMembers.map((member) => {
        const extension = member.extension;

        if (Event === "Register" && Username === extension) {
          updateStatus(member, "Available");
          return { ...member, status: "Available" };
        }
        if (Event === "UnRegister" && Username === extension) {
          updateStatus(member, "Logged Out");
          return { ...member, status: "Logged Out" };
        }
        if (
          Event === "Agent-Status" &&
          extension &&
          Agent?.startsWith(extension)
        ) {
          updateStatus(member, Status);
          return { ...member, status: Status };
        }

        if (EventType === "CALL_EVENT" && From === extension) {
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

  const updateStatus = async (member: any, newStatus: string) => {
    const updatedMember = {
      ...member,
      status: newStatus,
    };

    const url = `${backendConfig.baseURL}${backendConfig.updateAgent}/${member.directory_id}`;

    // const url = `https://10.16.7.96/api/directory_search/${member.directory_id}`;

    console.log("Request Body", updatedMember);

    try {
      const response = await axios.put(url, JSON.stringify(updatedMember), {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Agent status updated:", response.data);
    } catch (error) {
      console.error("❌ Error updating agent status:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get(
          `${chatConfig.baseURL}${chatConfig.agents}`
        );
        const filteredMembers = response.data.filter(
          (member) => member.user_id !== auth?.userName
        );
        setTeamMembers(filteredMembers);
      } catch (error) {
        console.error("Error loading team members:", error);
      }
    };

    loadData();
  }, []);

  return (
    <WebSocketEventContext.Provider value={{ latestEvent }}>
      {children}
    </WebSocketEventContext.Provider>
  );
};
