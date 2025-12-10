import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  MessageSquare,
  Phone,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RotateCw,
} from "lucide-react";
import { createPageUrl } from "@/utils/utils";
import { CallContext } from "../components/calls/CallProvider";
import { backendConfig } from "@/config/config";
import axios from "axios";
import { AuthContext } from "@/store/AuthContext";
import { WebSocketEventContext } from "@/store/WebSocketEventContext";
import AlertSystem from '../components/ui/AlertSystem';



// ✅ Type Definitions
interface Interaction {
  call_id: string;
  caller: string;
  callee: string;
  disposition?: string;
  created_date: string;
}


interface DashboardStats {
  totalCustomers: number;
  activeInteractions: number;
  totalCalls: number;
  avgResponseTime: string;
  today: number;
}


// ✅ PARSE DIFFERENT DATE FORMATS FROM BACKEND
const parseBackendDate = (dateString: string): Date => {
  try {
    // Format 1: ISO 8601 with Z (UTC) - "2025-11-28T03:59:05Z"
    if (dateString.includes("T") && dateString.includes("Z")) {
      return new Date(dateString);
    }

    // Format 2: ISO 8601 with timezone - "2025-11-28T03:59:05+00:00"
    if (dateString.includes("T") && (dateString.includes("+") || dateString.includes("-"))) {
      return new Date(dateString);
    }

    // Format 3: Standard ISO - "2025-11-28T03:59:05"
    if (dateString.includes("T")) {
      return new Date(dateString);
    }

    // Format 4: Database format - "2025-11-28 03:59:05"
    if (dateString.includes(" ") && !dateString.includes("T")) {
      const utcString = dateString.replace(" ", "T") + "Z";
      return new Date(utcString);
    }

    // Format 5: US Date - "11/28/2025, 03:59:05 AM"
    if (dateString.includes("/") && dateString.includes(",")) {
      return new Date(dateString);
    }

    // Format 6: Timestamp (milliseconds)
    if (/^\d+$/.test(dateString)) {
      return new Date(parseInt(dateString));
    }

    // Fallback
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("[ERROR] Cannot parse date:", dateString);
      return new Date();
    }
    return date;
  } catch (error) {
    console.error("[ERROR] Date parsing failed:", dateString, error);
    return new Date();
  }
};


// ✅ GET USER'S LOCAL TIMEZONE
const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};


// ✅ GET TODAY'S DATE IN LOCAL TIMEZONE
const getTodayLocalDate = (): string => {
  const userTimezone = getUserTimezone();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimezone,
  }).format(new Date());
};


// ✅ CONVERT DATE TO LOCAL TIMEZONE FOR COMPARISON
const convertToLocalDate = (dateString: string): Date => {
  try {
    const date = parseBackendDate(dateString);
    const userTimezone = getUserTimezone();

    const localDateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: userTimezone,
    }).format(date);

    const [year, month, day] = localDateString.split("-");
    return new Date(`${year}-${month}-${day}T00:00:00`);
  } catch (error) {
    console.error("[ERROR] Local date conversion failed:", error);
    return new Date();
  }
};


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeInteractions: 0,
    totalCalls: 0,
    avgResponseTime: "2.3 min",
    today: 0,
  });

  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>("Loading...");
  
  // ✅ Live time display (updates every second) - NO SECONDS
  const [liveTime, setLiveTime] = useState<string>("");
  
  const { startCall } = useContext(CallContext);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const context = useContext(WebSocketEventContext);
  const latestEvent = context?.latestEvent;
  const extension = auth?.userId;
  



   // ✅ AUTO LOGOUT WHEN TAB / BROWSER IS CLOSED
useEffect(() => {
  const handleUnload = () => {
    if (!auth?.userId) return;

    const payload = JSON.stringify({
      user_id: auth.userId, // ✅ MUST match backend key
    });

    navigator.sendBeacon(
      `${backendConfig.baseURL}${backendConfig.logoutEndPoint}`,
      payload
    );

    console.log("✅ AUTO LOGOUT ON TAB CLOSE →", auth.userId);
  };

  window.addEventListener("beforeunload", handleUnload);

  return () => {
    window.removeEventListener("beforeunload", handleUnload);
  };
}, [auth?.userId]);

  
  // 🧠 Track live active calls by CallID
  const [activeCallIds, setActiveCallIds] = useState<Set<string>>(new Set());

  // ✅ Update live time every second - NO SECONDS
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setLiveTime(time);
    };

    updateTime(); // Set immediately
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🧠 Real-time active call tracking from WebSocket
  useEffect(() => {
    if (!latestEvent) return;

    const callEvent =
      latestEvent.Event ||
      latestEvent.EventName ||
      latestEvent["Event-Name"] ||
      "";
    const caller =
      latestEvent.Caller ||
      latestEvent["Caller-ID-Number"] ||
      latestEvent["Caller-Number"] ||
      "";
    const callee =
      latestEvent.Callee ||
      latestEvent["Caller-Destination-Number"] ||
      latestEvent["Destination-Number"] ||
      "";
    const callId =
      latestEvent.CallID ||
      latestEvent.UniqueID ||
      latestEvent["Unique-ID"] ||
      `${caller}-${callee}`;

    if (callEvent) {
      if (
        (caller && caller.includes(extension)) ||
        (callee && callee.includes(extension))
      ) {
        setActiveCallIds((prev) => {
          const newSet = new Set(prev);
          if (
            [
              "CHANNEL_BRIDGE",
              "CHANNEL_ANSWER",
              "CHANNEL_CREATE",
            ].includes(callEvent)
          ) {
            newSet.add(callId);
          }
          if (callEvent === "CHANNEL_HANGUP") {
            newSet.delete(callId);
          }
          return newSet;
        });
      }
    }
  }, [latestEvent, extension]);

  // 🧭 Redirect if not logged in
  useEffect(() => {
    if (!auth?.isAuthenticated) {
      navigate(createPageUrl("Welcome"));
    }
  }, [auth, navigate]);

  // 🕒 Load dashboard data EVERY 5 SECONDS
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [customersRes, interactionsRes] = await Promise.all([
        axios.get(`${backendConfig.baseURL}${backendConfig.customers}`),
        axios.get(`${backendConfig.baseURL}${backendConfig.callInteractions}`),
      ]);

      const customers: any[] = customersRes.data || [];
      const interactions: Interaction[] = interactionsRes.data || [];

      console.log(`[LOAD] Fetched ${interactions.length} interactions at ${new Date().toLocaleTimeString()}`);

      // ✅ Filter for this agent only
      const agentInteractions = interactions.filter(
        (i) => i.caller === auth?.userId || i.callee === auth?.userId
      );

      // ✅ Get unique customer phone numbers (exclude agent ID)
      const agentCustomerPhones = new Set<string>();
      agentInteractions.forEach((interaction) => {
        if (interaction.caller && interaction.caller !== auth?.userId) {
          agentCustomerPhones.add(interaction.caller);
        }
        if (interaction.callee && interaction.callee !== auth?.userId) {
          agentCustomerPhones.add(interaction.callee);
        }
      });

      const agentCustomers = customers.filter((customer) =>
        customer.phone && agentCustomerPhones.has(customer.phone)
      );

      // ✅ USE CONSISTENT TIMEZONE-AWARE DATE LOGIC (90 days)
      const now = new Date();
      let days = 90;
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      const filteredAgentInteractions = agentInteractions.filter((i) => {
        const d = convertToLocalDate(i.created_date);
        return d >= start && d <= now;
      });

      // ✅ TODAY'S CALLS (LOCAL TIMEZONE)
      const todayLocal = getTodayLocalDate();
      const todaysCalls = filteredAgentInteractions.filter((i) => {
        const userTimezone = getUserTimezone();
        const dLocal = new Intl.DateTimeFormat("en-CA", {
          timeZone: userTimezone,
        }).format(parseBackendDate(i.created_date));
        return dLocal === todayLocal;
      });

      // ✅ Count completed calls
      const completedCalls = filteredAgentInteractions.filter(
        (i) => i.disposition?.toLowerCase() === "completed"
      ).length;

      // ✅ Combine active + completed
      const totalActiveInteractions = activeCallIds.size + completedCalls;

      // ✅ Sort and take last 5
      const recent = [...filteredAgentInteractions]
        .sort(
          (a, b) =>
            parseBackendDate(b.created_date).getTime() -
            parseBackendDate(a.created_date).getTime()
        )
        .slice(0, 5);

      // ✅ Update stats
      setStats({
        totalCustomers: agentCustomers.length,
        activeInteractions: totalActiveInteractions,
        totalCalls: filteredAgentInteractions.length,
        avgResponseTime: "2.3 min",
        today: todaysCalls.length,
      });

      setRecentInteractions(recent);
      
      // ✅ Update last refresh time
      setLastRefreshTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 Badge color helper
  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "missed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* 🎯 HEADER SECTION */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            {/* ✅ REFRESH BUTTON */}
            <div className="flex items-center gap-3">
               <AlertSystem agentId={auth?.userId} />

            
          
            <Button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

        </div>

          {/* ✅ Agent Name and Live Status - NORMAL SIZE, NO SECONDS */}
          <div className="flex items-center gap-6">
            {/* Agent Name with Extension */}
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Agent:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {auth?.userId}
              </span>
            </div>

            {/* Live Status - NO SECONDS */}
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Live
              </span>
              <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                {liveTime}
              </span>
            </div>
          </div>
        </div>

        {/* 📊 Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Customers Card */}
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-white/80 text-sm font-medium">+12%</div>
              </div>
              <div className="space-y-1">
                <p className="text-white/90 text-sm font-medium uppercase tracking-wide">
                  Total Customers
                </p>
                <p className="text-5xl font-bold text-white">
                  {stats.totalCustomers}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Calls Card */}
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-500 to-green-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <div className="text-white/80 text-sm font-medium">+8%</div>
              </div>
              <div className="space-y-1">
                <p className="text-white/90 text-sm font-medium uppercase tracking-wide">
                  Completed
                </p>
                <p className="text-5xl font-bold text-white">
                  {stats.activeInteractions}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Calls Card */}
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500 to-purple-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="text-white/80 text-sm font-medium">+15%</div>
              </div>
              <div className="space-y-1">
                <p className="text-white/90 text-sm font-medium uppercase tracking-wide">
                  Total Calls
                </p>
                <p className="text-5xl font-bold text-white">
                  {stats.totalCalls}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Today Calls Card */}
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-500 to-orange-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="text-white/80 text-sm font-medium">Today</div>
              </div>
              <div className="space-y-1">
                <p className="text-white/90 text-sm font-medium uppercase tracking-wide">
                  Today Calls
                </p>
                <p className="text-5xl font-bold text-white">
                  {stats.today}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📋 Recent Interactions Section */}
        <Card className="shadow-xl border-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Recent Interactions
              </CardTitle>
              <Link to={createPageUrl("Communications")}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentInteractions.length > 0 ? (
                recentInteractions.map((interaction, index) => {
                  // ✅ FIX TIME HERE (IST with hour12)
                  const utcString = interaction.created_date.replace(" ", "T") + "Z";
                  const formattedTime = new Date(utcString).toLocaleString("en-IN", {
                    hour12: true,
                  });

                  return (
                    <div
                      key={interaction.call_id}
                      className="group p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full group-hover:scale-110 transition-transform">
                              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                Caller:{" "}
                                <span className="text-blue-600 dark:text-blue-400">
                                  {interaction.caller || "-"}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Callee:{" "}
                                <span className="font-medium">
                                  {interaction.callee || "-"}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* ✅ Time Display */}
                          <div className="ml-13 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formattedTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${getStatusColor(
                              interaction.disposition
                            )} px-4 py-1.5 text-xs font-semibold uppercase tracking-wide`}
                          >
                            {interaction.disposition || "unknown"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No recent interactions
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Your call history will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
