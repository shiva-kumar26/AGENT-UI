// import React, { useEffect, useState, useContext } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Phone, CheckCircle, Clock, XCircle } from "lucide-react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
// } from "recharts";
// import axios from "axios";
// import { backendConfig } from "@/config/config";
// import { AuthContext } from "@/store/AuthContext";

// interface Interaction {
//   call_id: string;
//   caller: string;
//   callee: string;
//   disposition?: string;
//   duration?: number;
//   created_date: string;
//   accept?: boolean;
// }

// export default function AnalyticsPage() {
//   const { auth } = useContext(AuthContext);
//   const [range, setRange] = useState("today");
//   const [interactionPercent, setInteractionPercent] = useState(0);
//   const [activeCalls, setActiveCalls] = useState(0);
//   const [avgDuration, setAvgDuration] = useState("0m 0s");
//   const [rejectedCalls, setRejectedCalls] = useState(0);
//   const [maxNoAnswer, setMaxNoAnswer] = useState(0);
//   const [interactionGraph, setInteractionGraph] = useState<any[]>([]);
//   const [interactionPercentGraph, setInteractionPercentGraph] = useState<any[]>([]);
//   const [performanceData, setPerformanceData] = useState<any[]>([]);
//   const [sentimentData, setSentimentData] = useState<any[]>([]);
//   const [filteredAgentCount, setFilteredAgentCount] = useState(0);
//   const [filteredAllCount, setFilteredAllCount] = useState(0);
//   const [chartKey, setChartKey] = useState(0);
//   const [combinedOverviewData, setCombinedOverviewData] = useState<any[]>([]);

//   // useEffect(() => {
//   //   const timeout = setTimeout(() => {
//   //     fetchAnalyticsData();
//   //   }, 300);
//   //   return () => clearTimeout(timeout);
//   // }, [range]);

//   // const fetchAnalyticsData = async () => {
//   //   try {
//   //     const [interactionsRes, dirRes] = await Promise.all([
//   //       axios.get(`${backendConfig.baseURL}${backendConfig.callInteractions}`),
//   //       axios.get(`${backendConfig.baseURL}/api/directory_search`),
//   //     ]);

//   //     const interactions: Interaction[] = interactionsRes.data || [];
//   //     const directoryData = dirRes.data || [];

//   //     const agentInteractions = interactions.filter(
//   //       (i) => i.caller === auth?.userId || i.callee === auth?.userId
//   //     );

//   //     const now = new Date();
//   //     const nowUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
//   //     let filteredAgent: Interaction[] = [];
//   //     let filteredAll: Interaction[] = [];

//   //     if (range === "today") {
//   //       const todayStr = now.toISOString().split("T")[0];
//   //       filteredAgent = agentInteractions.filter(
//   //         (i) => new Date(i.created_date).toISOString().split("T")[0] === todayStr
//   //       );
//   //       filteredAll = interactions.filter(
//   //         (i) => new Date(i.created_date).toISOString().split("T")[0] === todayStr
//   //       );
//   //     } else {
//   //       const days = parseInt(range);
//   //       const daysAgoUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - days));
//   //       filteredAgent = agentInteractions.filter((i) => {
//   //         const d = new Date(i.created_date);
//   //         return d >= daysAgoUTC && d <= nowUTC;
//   //       });
//   //       filteredAll = interactions.filter((i) => {
//   //         const d = new Date(i.created_date);
//   //         return d >= daysAgoUTC && d <= nowUTC;
//   //       });
//   //     }

//   //     setFilteredAgentCount(filteredAgent.length);
//   //     setFilteredAllCount(filteredAll.length);

//   //     const totalPercent =
//   //       filteredAll.length > 0 ? (filteredAgent.length / filteredAll.length) * 100 : 0;
//   //     setInteractionPercent(Number(totalPercent.toFixed(1)));

//   //     const completedCalls = filteredAgent.filter(
//   //       (i) => i.disposition?.toLowerCase() === "completed"
//   //     ).length;

//   //     const rejected = filteredAgent.filter(
//   //       (i) =>
//   //         i.disposition?.toLowerCase() === "rejected" ||
//   //         i.disposition?.toLowerCase() === "missed" ||
//   //         i.accept === false
//   //     ).length;

//   //     const active = filteredAgent.length - (completedCalls + rejected);
//   //     const total = completedCalls + active + rejected;

//   //     let completedPercent = 0,
//   //       rejectedPercent = 0;

//   //     if (total > 0) {
//   //       completedPercent = Number(((completedCalls / total) * 100).toFixed(1));
//   //       rejectedPercent = Number(((rejected / total) * 100).toFixed(1));
//   //     }

//   //     // ✅ Calculate average duration for all handled calls (not just ongoing)
//   //     let avgCallDurationStr = "0m 0s";
//   //     let avgCallDurationValue = 0;

//   //     if (filteredAgent.length > 0) {
//   //       const validCalls = filteredAgent.filter((i) => i.duration && i.duration > 0);
//   //       if (validCalls.length > 0) {
//   //         const totalSeconds = validCalls.reduce((sum, i) => sum + (i.duration || 0), 0);
//   //         const avgSeconds = totalSeconds / validCalls.length;
//   //         avgCallDurationValue = Number((avgSeconds / 60).toFixed(1)); // minutes
//   //         const mins = Math.floor(avgSeconds / 60);
//   //         const secs = Math.round(avgSeconds % 60);
//   //         avgCallDurationStr = `${mins}m ${secs}s`;
//   //       }
//   //     }

//   //     // ✅ Build sentiment data using completed/missed and avg duration
//   //     const safeAvgValue = avgCallDurationValue > 0 ? avgCallDurationValue : 1; // make sure slice shows

//   //     setSentimentData([
//   //       { name: "Completed", value: completedPercent, color: "#16a34a" },
//   //       { name: "Avg Duration", value: safeAvgValue, color: "#f59e0b", avg: avgCallDurationStr },
//   //       { name: "Rejected/Missed", value: rejectedPercent, color: "#dc2626" },
//   //     ]);
//   //     setChartKey((prev) => prev + 1);

//   //     const activeCompletedPercent =
//   //       filteredAgent.length > 0
//   //         ? ((completedCalls / filteredAgent.length) * 100).toFixed(1)
//   //         : "0.0";
//   //     setActiveCalls(Number(activeCompletedPercent));

//   //     // ✅ Login/logout logic for duration between login & logout
//   //     if (auth?.userName) {
//   //       let totalSeconds = 0;
//   //       let validCount = 0;
//   //       const dailyDurations: Record<string, number[]> = {};
//   //       const baseURL = `${backendConfig.baseURL}/login/login-logout`;

//   //       let cachedMaxId = localStorage.getItem("latestLoginLogoutId");
//   //       let latestValidId = cachedMaxId ? parseInt(cachedMaxId, 10) : 1000;

//   //       try {
//   //         const testRes = await axios.get(`${baseURL}/${latestValidId}`);
//   //         if (!testRes?.data?.id) throw new Error();
//   //       } catch {
//   //         for (let id = latestValidId; id >= 1; id--) {
//   //           try {
//   //             const res = await axios.get(`${baseURL}/${id}`);
//   //             if (res?.data?.id) {
//   //               latestValidId = id;
//   //               localStorage.setItem("latestLoginLogoutId", id.toString());
//   //               break;
//   //             }
//   //           } catch {}
//   //         }
//   //       }

//   //       const rangeStart = new Date();
//   //       if (range === "today") rangeStart.setHours(0, 0, 0, 0);
//   //       else rangeStart.setDate(rangeStart.getDate() - parseInt(range));

//   //       const nowDate = new Date();
//   //       const maxLookback = 30;
//   //       const fetches = [];
//   //       for (let id = latestValidId; id > latestValidId - maxLookback; id--) {
//   //         fetches.push(axios.get(`${baseURL}/${id}`).catch(() => null));
//   //       }
//   //       const results = await Promise.all(fetches);
//   //       const validResults = results.filter((r) => r?.data);

//   //       validResults.forEach((res: any) => {
//   //         const data = res.data;
//   //         if (
//   //           data?.agent_name?.toLowerCase() === auth.userName.toLowerCase() &&
//   //           data?.login_timestamp
//   //         ) {
//   //           const logoutTime = data.logout_timestamp
//   //             ? new Date(data.logout_timestamp)
//   //             : new Date(data.login_timestamp);
//   //           if (logoutTime >= rangeStart && logoutTime <= nowDate && data?.duration) {
//   //             const [h, m, s] = data.duration.split(":").map(parseFloat);
//   //             const seconds = h * 3600 + m * 60 + s;
//   //             totalSeconds += seconds;
//   //             validCount++;
//   //             const dateKey = logoutTime.toISOString().split("T")[0];
//   //             if (!dailyDurations[dateKey]) dailyDurations[dateKey] = [];
//   //             dailyDurations[dateKey].push(seconds);
//   //           }
//   //         }
//   //       });

//   //       if (validCount > 0) {
//   //         const avgSeconds = totalSeconds / validCount;
//   //         const hrs = Math.floor(avgSeconds / 3600);
//   //         const mins = Math.floor((avgSeconds % 3600) / 60);
//   //         const secs = Math.round(avgSeconds % 60);
//   //         const formatted = `${hrs ? hrs + "h " : ""}${mins ? mins + "m " : ""}${secs ? secs + "s" : ""}`;
//   //         setAvgDuration(formatted.trim() || "0m 0s");
//   //       } else setAvgDuration("0m 0s");

//   //       const perfChart = Object.entries(dailyDurations).map(([date, durations]) => {
//   //         const avgMins =
//   //           durations.length > 0
//   //             ? Number((durations.reduce((a, b) => a + b, 0) / durations.length / 60).toFixed(2))
//   //             : 0;
//   //         return { name: date, avgDuration: avgMins };
//   //       });
//   //       setPerformanceData(perfChart.reverse());
//   //     }

//   //     const agents = directoryData || [];
//   //     const currentAgent = agents.find(
//   //       (a: any) =>
//   //         a.user_id?.toLowerCase() === auth?.userId?.toLowerCase() ||
//   //         a.name?.includes(auth?.userId)
//   //     );
//   //     if (currentAgent) {
//   //       setMaxNoAnswer(currentAgent.max_no_answer || 0);
//   //       setRejectedCalls(currentAgent.no_answer_count || rejected);
//   //     }

//   //     const grouped: Record<string, number> = {};
//   //     filteredAgent.forEach((interaction) => {
//   //       const date = new Date(interaction.created_date).toISOString().split("T")[0];
//   //       grouped[date] = (grouped[date] || 0) + 1;
//   //     });
//   //     setInteractionGraph(Object.entries(grouped).map(([name, volume]) => ({ name, volume })).reverse());

//   //     const dailyTotal: Record<string, number> = {};
//   //     const dailyAgent: Record<string, number> = {};
//   //     filteredAll.forEach((i) => {
//   //       const date = new Date(i.created_date).toISOString().split("T")[0];
//   //       dailyTotal[date] = (dailyTotal[date] || 0) + 1;
//   //     });
//   //     filteredAgent.forEach((i) => {
//   //       const date = new Date(i.created_date).toISOString().split("T")[0];
//   //       dailyAgent[date] = (dailyAgent[date] || 0) + 1;
//   //     });
//   //     const percentGraphData = Object.keys(dailyTotal).map((date) => ({
//   //       name: date,
//   //       percentage: dailyAgent[date]
//   //         ? Number(((dailyAgent[date] / dailyTotal[date]) * 100).toFixed(1))
//   //         : 0,
//   //     }));
//   //     setInteractionPercentGraph(percentGraphData.reverse());

//   //     const combinedData: any[] = [];
//   //     const allDates = new Set([...Object.keys(grouped), ...performanceData.map((d) => d.name)]);
//   //     for (const date of Array.from(allDates).sort()) {
//   //       const total = dailyTotal[date] || 0;
//   //       const completed = filteredAgent.filter(
//   //         (i) =>
//   //           new Date(i.created_date).toISOString().split("T")[0] === date &&
//   //           i.disposition?.toLowerCase() === "completed"
//   //       ).length;
//   //       const missed = filteredAgent.filter(
//   //         (i) =>
//   //           new Date(i.created_date).toISOString().split("T")[0] === date &&
//   //           (i.disposition?.toLowerCase() === "missed" ||
//   //             i.disposition?.toLowerCase() === "rejected" ||
//   //             i.accept === false)
//   //       ).length;
//   //       const avgDuration = performanceData.find((d) => d.name === date)?.avgDuration || 0;
//   //       combinedData.push({ name: date, total, completed, missed, avgDuration });
//   //     }
//   //     setCombinedOverviewData(combinedData.reverse());
//   //   } catch (err) {
//   //     console.error("Error fetching analytics:", err);
//   //   }
//   // };


// useEffect(() => {
//   fetchAnalyticsData();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [range]);

// const fetchAnalyticsData = async () => {
//   try {
//     const [interactionsRes, dirRes] = await Promise.all([
//       axios.get(`${backendConfig.baseURL}${backendConfig.callInteractions}`),
//       axios.get(`${backendConfig.baseURL}/api/directory_search`),
//     ]);

//     const interactions: Interaction[] = interactionsRes.data || [];
//     const directoryData = dirRes.data || [];

//     const agentInteractions = interactions.filter(
//       (i) => i.caller === auth?.userId || i.callee === auth?.userId
//     );

//     // ✅ Compute date range properly
//     const now = new Date();
//     const nowUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

//     let filteredAgent: Interaction[] = [];
//     let filteredAll: Interaction[] = [];

//     if (range === "today") {
//       const todayStr = nowUTC.toISOString().split("T")[0];
//       filteredAgent = agentInteractions.filter(
//         (i) => new Date(i.created_date).toISOString().split("T")[0] === todayStr
//       );
//       filteredAll = interactions.filter(
//         (i) => new Date(i.created_date).toISOString().split("T")[0] === todayStr
//       );
//     } else {
//       const days = parseInt(range, 10);
//       const daysAgoUTC = new Date(nowUTC);
//       daysAgoUTC.setUTCDate(nowUTC.getUTCDate() - (days - 1)); // include today
//       filteredAgent = agentInteractions.filter((i) => {
//         const d = new Date(i.created_date);
//         return d >= daysAgoUTC && d <= nowUTC;
//       });
//       filteredAll = interactions.filter((i) => {
//         const d = new Date(i.created_date);
//         return d >= daysAgoUTC && d <= nowUTC;
//       });
//     }

//     console.log("Filtered Range:", range, "Start:", filteredAll[0]?.created_date, "End:", filteredAll.at(-1)?.created_date);

//     // (rest of your logic below — unchanged)
//     setFilteredAgentCount(filteredAgent.length);
//     setFilteredAllCount(filteredAll.length);

//     const totalPercent =
//       filteredAll.length > 0 ? (filteredAgent.length / filteredAll.length) * 100 : 0;
//     setInteractionPercent(Number(totalPercent.toFixed(1)));

//     // ... keep your analytics calculations and charts logic same ...
//   } catch (err) {
//     console.error("Error fetching analytics:", err);
//   }
// };


//   // Guard for empty pie
//   const pieData = (() => {
//     const sum = sentimentData.reduce((s, d) => s + (Number(d.value) || 0), 0);
//     if (!sentimentData || sentimentData.length === 0 || sum === 0) {
//       return [{ name: "No data", value: 1, color: "#e5e7eb" }];
//     }
//     return sentimentData;
//   })();

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
//           <Select value={range} onValueChange={(val) => setRange(val)}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Select Range" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="today">Today</SelectItem>
//               <SelectItem value="7">Last 7 days</SelectItem>
//               <SelectItem value="30">Last 30 days</SelectItem>
//               <SelectItem value="90">Last 90 days</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <Card>
//             <CardHeader className="flex-row justify-between items-center pb-2">
//               <CardTitle className="text-sm font-semibold">Total Interactions</CardTitle>
//               <Phone className="h-4 w-4 text-gray-500" />
//             </CardHeader>
//             <CardContent>
//               <p className="text-xs text-gray-400 mb-1">
//                 You handled{" "}
//                 <span className="font-semibold text-gray-700">{filteredAgentCount}</span> of{" "}
//                 <span className="font-semibold text-gray-700">{filteredAllCount}</span> calls
//               </p>
//               <div className="text-3xl font-bold text-gray-900">{interactionPercent}%</div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex-row justify-between items-center pb-2">
//               <CardTitle className="text-sm font-medium">Completed Call Rate</CardTitle>
//               <CheckCircle className="h-4 w-4 text-gray-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold text-green-600">{activeCalls}%</div>
//               <p className="text-xs text-gray-500 mt-1">of your handled calls were completed</p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex-row justify-between items-center pb-2">
//               <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
//               <Clock className="h-4 w-4 text-gray-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{avgDuration}</div>
//               <p className="text-xs text-blue-500 mt-1">Between Login & Logout</p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader className="flex-row justify-between items-center pb-2">
//               <CardTitle className="text-sm font-medium">Missed / No Answer Calls</CardTitle>
//               <XCircle className="h-4 w-4 text-red-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-red-600">{rejectedCalls}</div>
//               <p className="text-xs text-red-400 mt-1">Max No Answer Limit: {maxNoAnswer}</p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Tabs */}
//         <Tabs defaultValue="overview">
//           <TabsList className="mb-6">
//             <TabsTrigger value="overview">Overview</TabsTrigger>
//             <TabsTrigger value="interactions">Interactions</TabsTrigger>
//             <TabsTrigger value="performance">Performance</TabsTrigger>
//             <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
//           </TabsList>

//           {/* Overview */}
//           <TabsContent value="overview">
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               <Card className="lg:col-span-2">
//                 <CardHeader>
//                   <CardTitle>Daily Analytics Overview</CardTitle>
//                 </CardHeader>
//                 <CardContent className="h-80">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={combinedOverviewData}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="name" />
//                       <YAxis yAxisId="left" />
//                       <YAxis yAxisId="right" orientation="right" />
//                       <Tooltip />
//                       <Legend />
//                       <Line
//                         yAxisId="left"
//                         type="monotone"
//                         dataKey="total"
//                         stroke="#1d4ed8"
//                         strokeWidth={2}
//                         name="Total Interactions"
//                       />
//                       <Line
//                         yAxisId="left"
//                         type="monotone"
//                         dataKey="completed"
//                         stroke="#16a34a"
//                         strokeWidth={2}
//                         name="Completed"
//                       />
//                       <Line
//                         yAxisId="left"
//                         type="monotone"
//                         dataKey="missed"
//                         stroke="#dc2626"
//                         strokeWidth={2}
//                         name="Missed"
//                       />
//                       <Line
//                         yAxisId="right"
//                         type="monotone"
//                         dataKey="avgDuration"
//                         stroke="#f59e0b"
//                         strokeWidth={2}
//                         name="Avg Duration (min)"
//                         dot={false}
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>

//               {/* Call Sentiment */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Call Sentiment</CardTitle>
//                 </CardHeader>
//                 <CardContent className="flex flex-col justify-between">
//                   <div style={{ width: "100%", height: 220 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart key={chartKey}>
//                         <Pie
//                           data={pieData}
//                           dataKey="value"
//                           nameKey="name"
//                           cx="50%"
//                           cy="50%"
//                           outerRadius={80}
//                           label
//                           isAnimationActive
//                           animationDuration={800}
//                         >
//                           {pieData.map((entry, i) => (
//                             <Cell key={i} fill={entry.color || "#cbd5e1"} stroke="#fff" strokeWidth={2} />
//                           ))}
//                         </Pie>
//                         <Legend />
//                         <Tooltip
//                           formatter={(v: number, name: string) => {
//                             if (name === "Avg Duration") {
//                               const avgObj = sentimentData.find((d) => d.name === "Avg Duration");
//                               return [avgObj?.avg ?? `${v} mins`, "Avg Duration"];
//                             }
//                             return [`${v}%`, name];
//                           }}
//                         />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>

//                   {/* Show avg duration value */}
//                   {/* <div className="text-center mt-2">
//                     <p className="text-sm text-gray-500">Average Call Duration</p>
//                     <p className="text-lg font-semibold text-yellow-600">
//                       {sentimentData.find((d) => d.name === "Avg Duration")?.avg ?? "0m 0s"}
//                     </p>
//                   </div> */}
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>

//           {/* Interactions */}
//           <TabsContent value="interactions">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Interaction Completion (%)</CardTitle>
//               </CardHeader>
//               <CardContent className="h-96">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={interactionPercentGraph}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Performance */}
//           <TabsContent value="performance">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Average Duration (Minutes)</CardTitle>
//               </CardHeader>
//               <CardContent className="h-96">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={performanceData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Line
//                       type="monotone"
//                       dataKey="avgDuration"
//                       stroke="#10b981"
//                       strokeWidth={2}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Sentiment */}
//           <TabsContent value="sentiment">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Sentiment Breakdown (%)</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex justify-around mb-4 text-center">
//                   {sentimentData.map((d) => (
//                     <div key={d.name}>
//                       <div className="text-sm text-gray-500">{d.name}</div>
//                       <div
//                         className={`text-lg font-semibold ${
//                           d.name === "Completed"
//                             ? "text-green-600"
//                             : d.name === "Avg Duration"
//                             ? "text-yellow-500"
//                             : "text-red-500"
//                         }`}
//                       >
//                         {d.name === "Avg Duration" ? (d.avg ?? `${d.value} mins`) : `${d.value}%`}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="h-96">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart key={`sent-${chartKey}`}>
//                       <Pie
//                         data={pieData}
//                         dataKey="value"
//                         nameKey="name"
//                         cx="50%"
//                         cy="50%"
//                         outerRadius={120}
//                         label
//                         isAnimationActive
//                         animationDuration={800}
//                       >
//                         {pieData.map((entry, i) => (
//                           <Cell key={i} fill={entry.color || "#cbd5e1"} stroke="#fff" strokeWidth={2} />
//                         ))}
//                       </Pie>
//                       <Legend />
//                       <Tooltip
//                         formatter={(v: number, name: string) => {
//                           if (name === "Avg Duration") {
//                             const avgObj = sentimentData.find((d) => d.name === "Avg Duration");
//                             return [avgObj?.avg ?? `${v} mins`, "Avg Duration"];
//                           }
//                           return [`${v}%`, name];
//                         }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Area,
} from "recharts";
import axios from "axios";
import { backendConfig } from "@/config/config";
import { AuthContext } from "@/store/AuthContext";
import { useInteractions, Interaction } from "@/store/InteractionContext";

// interface Interaction { ... } // utilizing imported type

export default function AnalyticsPage() {
  const { auth } = useContext(AuthContext);

  const [range, setRange] = useState("today"); // "today", "7", "30", "90"
  const [filteredAgentCount, setFilteredAgentCount] = useState(0);
  const [filteredAllCount, setFilteredAllCount] = useState(0);
  const [interactionPercent, setInteractionPercent] = useState(0); // agent handled percent of all
  const [completedRate, setCompletedRate] = useState(0); // completed % of agent handled
  const [avgDurationLabel, setAvgDurationLabel] = useState("0m 0s"); // human friendly
  const [avgDurationValue, setAvgDurationValue] = useState(0); // minutes (decimal)
  const [rejectedCalls, setRejectedCalls] = useState(0);

  const [maxNoAnswer, setMaxNoAnswer] = useState(0);
  const [inboundCount, setInboundCount] = useState(0);
  const [outboundCount, setOutboundCount] = useState(0);
  const [totalTalkTimeLabel, setTotalTalkTimeLabel] = useState("0h 0m");
  const [avgResponseTimeLabel, setAvgResponseTimeLabel] = useState("0s");

  const [combinedOverviewData, setCombinedOverviewData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [interactionPercentGraph, setInteractionPercentGraph] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [chartKey, setChartKey] = useState(0);

  const { interactions, agentInteractions, loading: interactionsLoading } = useInteractions();
  const [directoryData, setDirectoryData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch directory data once
    axios.get(`${backendConfig.baseURL}/api/directory_search`)
      .then(res => setDirectoryData(res.data || []))
      .catch(err => console.error("Dir fetch error", err));
  }, []);

  useEffect(() => {
    processAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, auth?.userId, interactions, directoryData]);

  const formatLocalISO = (d: Date) => {
    // returns YYYY-MM-DD local
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatNice = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const secondsToLabel = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0m 0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (hrs) parts.push(`${hrs}h`);
    if (mins) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };


  const processAnalyticsData = () => {
    if (interactions.length === 0 && interactionsLoading) return;

    // Use context data
    // Compute date range (local)
    const now = new Date();
    // start: midnight local of (today - (days-1))
    let days = 1;
    if (range !== "today") days = parseInt(range, 10);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    // filtered arrays
    const filteredAgent = agentInteractions.filter((i) => {
      const d = new Date(i.start_time);
      return d >= start && d <= now;
    });

    const filteredAll = interactions.filter((i) => {
      const d = new Date(i.start_time);
      return d >= start && d <= now;
    });

    setFilteredAgentCount(filteredAgent.length);
    setFilteredAllCount(filteredAll.length);

    // overall percent agent handled
    const overallPercent = filteredAll.length > 0 ? (filteredAgent.length / filteredAll.length) * 100 : 0;
    setInteractionPercent(Number(overallPercent.toFixed(1)));

    // completed / rejected counts (agent)
    const completedCalls = filteredAgent.filter((i) => i.billsec > 0).length;
    // Rejected/missed implied if no billsec or answer_time is null?
    const rejected = filteredAgent.filter(
      (i) => i.billsec === 0 || !i.answer_time
    ).length;
    setRejectedCalls(rejected);

    const compPercent = filteredAgent.length > 0 ? (completedCalls / filteredAgent.length) * 100 : 0;

    setCompletedRate(Number(compPercent.toFixed(1)));

    // Inbound / Outbound
    setInboundCount(filteredAgent.filter(i => i.direction === "inbound").length);
    setOutboundCount(filteredAgent.filter(i => i.direction === "outbound").length);

    // Total Talk Time
    const totalSec = filteredAgent.reduce((acc, curr) => acc + (curr.billsec || 0), 0);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.round(totalSec % 60);
    setTotalTalkTimeLabel(`${h}h ${m}m ${s}s`);

    // --- Average Duration calculation from Context Data
    const dailyCallDurations: Record<string, number[]> = {};
    const callDurationsSec: number[] = [];

    // Extract billsec (call duration in seconds) from filtered records
    filteredAgent.forEach((record) => {
      const billsec = record.billsec;

      if (billsec && billsec > 0) {
        callDurationsSec.push(billsec);

        // Group by date for daily averages
        if (record.start_time) {
          const key = formatLocalISO(new Date(record.start_time));
          if (!dailyCallDurations[key]) dailyCallDurations[key] = [];
          dailyCallDurations[key].push(billsec);
        }
      }
    });

    const masterDurations = callDurationsSec;
    const masterDaily = dailyCallDurations;

    let avgSeconds = 0;
    if (masterDurations.length > 0) avgSeconds = masterDurations.reduce((a, b) => a + b, 0) / masterDurations.length;
    const avgLabel = avgSeconds > 0 ? secondsToLabel(avgSeconds) : "0m 0s";
    setAvgDurationLabel(avgLabel);
    setAvgDurationValue(Number((avgSeconds / 60).toFixed(2))); // minutes decimal

    // Build performance chart from per-day averages (from masterDaily)
    // Ensure we create a continuous date list from start -> now
    const dateList: string[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const upTo = new Date(now);
    upTo.setHours(0, 0, 0, 0);
    while (cursor <= upTo) {
      dateList.push(formatLocalISO(new Date(cursor)));
      cursor.setDate(cursor.getDate() + 1);
    }

    const perf: any[] = dateList.map((date) => {
      const arr = masterDaily[date] || [];
      const avgMin = arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length / 60).toFixed(2)) : 0;
      return { name: date, avgDuration: avgMin };
    });
    setPerformanceData(perf);

    // Build combined overview data (total/completed/missed/avgDuration/inbound/outbound/totalTalkTime per day)
    const groupedAgentPerDay: Record<string, {
      total: number;
      completed: number;
      missed: number;
      inbound: number;
      outbound: number;
      totalDuration: number; // seconds
      totalResponseTime: number; // seconds (for avg response time)
      responseTimeCount: number;
    }> = {};

    filteredAgent.forEach((i) => {
      const key = formatLocalISO(new Date(i.start_time));
      if (!groupedAgentPerDay[key]) {
        groupedAgentPerDay[key] = {
          total: 0,
          completed: 0,
          missed: 0,
          inbound: 0,
          outbound: 0,
          totalDuration: 0,
          totalResponseTime: 0,
          responseTimeCount: 0
        };
      }
      groupedAgentPerDay[key].total++;
      groupedAgentPerDay[key].totalDuration += (i.billsec || 0);

      if (i.billsec > 0) groupedAgentPerDay[key].completed++;
      else groupedAgentPerDay[key].missed++;

      if (i.direction === "inbound") groupedAgentPerDay[key].inbound++;
      else if (i.direction === "outbound") groupedAgentPerDay[key].outbound++;

      // Calc response time for this call if applicable
      if (i.direction === "inbound" && i.destination_number === auth?.userId && i.duration > 0 && i.billsec > 0) {
        const rt = i.duration - i.billsec;
        if (rt > 0) {
          groupedAgentPerDay[key].totalResponseTime += rt;
          groupedAgentPerDay[key].responseTimeCount++;
        }
      }
    });

    const combined = dateList.map((date) => {
      const g = groupedAgentPerDay[date] || {
        total: 0, completed: 0, missed: 0, inbound: 0, outbound: 0, totalDuration: 0, totalResponseTime: 0, responseTimeCount: 0
      };
      const perfEntry = perf.find((p) => p.name === date);
      const avgResp = g.responseTimeCount > 0 ? g.totalResponseTime / g.responseTimeCount : 0;

      return {
        name: date,
        total: g.total,
        completed: g.completed,
        missed: g.missed,
        inbound: g.inbound,
        outbound: g.outbound,
        totalTalkTime: Number((g.totalDuration / 60).toFixed(2)), // in mins (kept for overlap chart if needed)
        totalTalkTimeHours: Number((g.totalDuration / 3600).toFixed(2)), // in hours (for new chart)
        avgDuration: perfEntry ? perfEntry.avgDuration : 0, // in mins
        avgDurationSeconds: perfEntry ? Math.round(perfEntry.avgDuration * 60) : 0, // in seconds
        avgResponseTime: avgResp // in seconds
      };
    });

    setCombinedOverviewData(combined);
    // Reuse combined data for other graphs or just use it directly
    setInteractionPercentGraph(combined); // Now contains inbound/outbound

    // Sentiment removed
    setChartKey((k) => k + 1);

    // agent directory (max no answer)
    const currentAgent = (directoryData || []).find(
      (a: any) =>
        (a.user_id && auth?.userId && a.user_id.toLowerCase() === auth.userId.toLowerCase()) ||
        (a.name && auth?.userId && a.name.includes(auth.userId))
    );
    if (currentAgent) {
      setMaxNoAnswer(currentAgent.max_no_answer || 0);
      setRejectedCalls(currentAgent.no_answer_count ?? rejected);
    }

    // --- Scalar Avg Response Time (Total) ---
    // (Already calculated below, but we can reuse the daily logic if we wanted, sticking to separate total calc for safety)
    const responseTimeCalls = filteredAgent.filter(i =>
      i.direction === "inbound" &&
      i.destination_number === auth?.userId &&
      i.duration > 0 &&
      i.billsec > 0
    );

    let totalResponseTime = 0;
    responseTimeCalls.forEach(i => {
      // response time = duration - billsec
      const rt = i.duration - i.billsec;
      if (rt > 0) totalResponseTime += rt;
    });

    const avgRT = responseTimeCalls.length > 0 ? totalResponseTime / responseTimeCalls.length : 0;
    setAvgResponseTimeLabel(secondsToLabel(avgRT));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header / select */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <Select value={range} onValueChange={(val) => setRange(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>


        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Interactions */}
          <Card className="h-full shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">Total Interactions</CardTitle>
              <Phone className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{interactionPercent}%</div>
              <p className="text-xs text-slate-500 mt-1">
                {filteredAgentCount} / {filteredAllCount} calls
              </p>
              {/* Optional: Inbound/Outbound split */}
              <div className="mt-3 flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-100">
                  In: {inboundCount}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-100">
                  Out: {outboundCount}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Completed Call Rate */}
          <Card className="h-full shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">Completed Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{completedRate}%</div>
              <p className="text-xs text-slate-500 mt-1">Call Completion rate</p>
            </CardContent>
          </Card>

          {/* Average Call Duration */}
          <Card className="h-full shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{avgDurationLabel}</div>
              <p className="text-xs text-slate-500 mt-1">Average duration per call</p>
            </CardContent>
          </Card>


          {/* NEW: Total Talk Time */}
          <Card className="h-full shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">Total Talk Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {totalTalkTimeLabel}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total talk time</p>
            </CardContent>
          </Card>

          {/* NEW: Avg Response Time */}
          <Card className="h-full shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {avgResponseTimeLabel}
              </div>
              <p className="text-xs text-slate-500 mt-1">Average time to answer</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Daily Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedOverviewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickFormatter={(d) => formatNice(d)} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        if (name === "Avg Duration (min)" || name === "Total Talk Time (min)") {
                          // Convert decimal minutes to mm:ss format
                          const totalSeconds = Math.round(value * 60);
                          const h = Math.floor(totalSeconds / 3600);
                          const mins = Math.floor((totalSeconds % 3600) / 60);
                          const secs = totalSeconds % 60;
                          if (h > 0) return [`${h}h ${mins}m ${secs}s`, name];
                          return [`${mins}m ${secs}s`, name];
                        }
                        if (name === "Avg Response Time (s)") {
                          return [`${Math.floor(value)}s`, name];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${formatNice(label)}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#1d4ed8" name="Total" />
                    <Line type="monotone" dataKey="completed" stroke="#16a34a" name="Completed" />
                    {/* Inbound / Outbound Lines */}
                    <Line type="monotone" dataKey="inbound" stroke="#8b5cf6" name="Inbound" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="outbound" stroke="#ec4899" name="Outbound" strokeDasharray="5 5" />
                    {/* Avg Response Time */}
                    <Line type="monotone" dataKey="avgResponseTime" stroke="#f43f5e" name="Avg Response Time (s)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactions */}
          <TabsContent value="interactions">
            <Card>
              <CardHeader>
                <CardTitle>Interaction Volume & Type</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={interactionPercentGraph}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickFormatter={(d) => formatNice(d)} />
                    <YAxis />
                    <Tooltip labelFormatter={(l) => `Date: ${formatNice(l)}`} />
                    <Legend />
                    <Bar dataKey="inbound" name="Inbound" fill="#8b5cf6" />
                    <Bar dataKey="outbound" name="Outbound" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Duration Metrics (Minutes)</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedOverviewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickFormatter={(d) => formatNice(d)} />

                    {/* Left Axis: Seconds (For Avg Duration & Response Time) */}
                    <YAxis
                      yAxisId="left"
                      label={{ value: "Seconds", angle: -90, position: "insideLeft" }}
                    />

                    {/* Right Axis: Hours (For Total Talk Time) */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: "Hours", angle: 90, position: "insideRight" }}
                    />

                    <Tooltip
                      formatter={(v: any, name: string) => {
                        if (name === "Avg Response Time") return [secondsToLabel(v), name];
                        if (name === "Avg Duration") return [secondsToLabel(v), name];
                        if (name === "Total Talk Time") return [secondsToLabel(v * 3600), name];
                        return [v, name];
                      }}
                      labelFormatter={(l) => `Date: ${formatNice(l)}`}
                    />
                    <Legend />

                    {/* Background Area for Total Hours */}
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalTalkTimeHours"
                      name="Total Talk Time"
                      fill="#f59e0b"
                      stroke="#f59e0b"
                      fillOpacity={0.2}
                    />

                    {/* Lines for Averages (Seconds) */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgDurationSeconds"
                      name="Avg Duration"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgResponseTime"
                      name="Avg Response Time"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
