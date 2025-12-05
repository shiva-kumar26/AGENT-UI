// import React, { useContext, useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import {
//   Phone,
//   User,
//   Clock,
//   Mic2,
//   FileText,
//   Smile,
//   BarChart3,
//   Bot,
//   Sparkles,
//   AlertTriangle,
//   BookOpen,
// } from "lucide-react";
// import { AnimatePresence, motion } from "framer-motion";
// import { CallContext } from "../calls/CallProvider";
// import { Textarea } from "../ui/textarea";
// import { Pencil } from "lucide-react";
// import { backendConfig } from "@/config/config";
// import axios from "axios";
// import { AuthContext } from "@/store/AuthContext";

// const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
//   <Card className="bg-white/50">
//     <CardContent className="p-4 flex items-center gap-4">
//       <div
//         className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.bg}`}
//       >
//         <Icon className={`w-5 h-5 ${color.text}`} />
//       </div>
//       <div>
//         <p className="text-sm text-slate-500">{title}</p>
//         <p className="text-lg font-bold text-slate-900">{value}</p>
//         <p className="text-xs text-slate-400">{subtext}</p>
//       </div>
//     </CardContent>
//   </Card>
// );

// const SentimentBar = ({ label, value, color }) => (
//   <div>
//     <div className="flex justify-between items-center mb-1">
//       <span className="text-sm text-slate-600">{label}</span>
//       <span className="text-sm font-medium text-slate-800">{value}%</span>
//     </div>
//     <Progress value={value} className={`[&>*]:bg-gradient-to-r ${color}`} />
//   </div>
// );

// export default function CallDetailViewer({ interaction }) {
//   const [activeWidgets, setActiveWidgets] = useState({
//     summary: false,
//     transcript: false,
//     sentiment: false,
//     analytics: false,
//   });
//   const [editedSummary, setEditedSummary] = useState(interaction.summary || "");
//   const [isEditing, setIsEditing] = useState(false);
//   const [transcriptLines, setTranscriptLines] = useState([]);
//   const [prevCallId, setPrevCallId] = useState(null);
//   const [prevTranscript, setPrevTranscript] = useState(null);
//   const { activeCallDetails } = useContext(CallContext);
//   const [isEditingDisposition, setIsEditingDisposition] = useState(false);
//   const [editedDisposition, setEditedDisposition] = useState(
//     interaction.disposition || ""
//   );
//   const [liveTranscript, setLiveTranscript] = useState([]);
//   const [storedTranscript, setStoredTranscript] = useState([]);

//   const toggleWidget = (widget) => {
//     setActiveWidgets((prev) => ({ ...prev, [widget]: !prev[widget] }));
//   };

//   const { auth } = useContext(AuthContext);
//   useEffect(() => {
//     setEditedSummary(interaction.summary || "");
//     setIsEditing(false);
//   }, [interaction.id]);

//   // useEffect(() => {
//   //   if (interaction?.transcript && Array.isArray(interaction.transcript)) {
//   //     setTranscriptLines(interaction.transcript);
//   //   } else {
//   //     setTranscriptLines([]);
//   //   }
//   // }, [interaction]);

//   useEffect(() => {
//     if (
//       !activeCallDetails &&
//       interaction?.transcript &&
//       Array.isArray(interaction.transcript)
//     ) {
//       setStoredTranscript(interaction.transcript);
//     } else {
//       setStoredTranscript([]);
//     }
//   }, [interaction, activeCallDetails]);

//   useEffect(() => {
//     if (activeCallDetails) {
//       // const interval = setInterval(() => {
//       //   // simulate receiving new line from live transcription API
//       //   fetch(`/api/live-transcription/${activeCallDetails.id}`)
//       //     .then((res) => res.json())
//       //     .then((newLine) => {
//       //       setLiveTranscript((prev) => [...prev, newLine]);
//       //     });
//       // }, 1000);
//       // return () => clearInterval(interval);
//     } else {
//       setLiveTranscript([]);
//     }
//   }, [activeCallDetails]);

//   const transcriptToShow =
//     activeCallDetails && liveTranscript.length > 0
//       ? liveTranscript
//       : storedTranscript;

//   // Simulated transcription appending (replace with real-time data source)

//   useEffect(() => {
//     let interval;
//     if (activeCallDetails) {
//       interval = setInterval(() => {
//         setTranscriptLines((prev) => [
//           ...prev,
//           {
//             speaker: Math.random() > 0.5 ? "Agent" : "Customer",
//             text:
//               Math.random() > 0.5
//                 ? "Sample sentence from Agent."
//                 : "Sample sentence from Customer.",
//           },
//         ]);
//       }, 3000);
//     }
//     return () => clearInterval(interval);
//   }, [activeCallDetails]);

//   // Detect when call ends, and store transcript
//   useEffect(() => {
//     if (!activeCallDetails && prevCallId) {
//       if (transcriptLines.length > 0) {
//       }
//       setTranscriptLines([]);
//       setPrevCallId(null);
//     }

//     if (activeCallDetails && activeCallDetails.id !== prevCallId) {
//       setTranscriptLines([]);
//       setPrevCallId(activeCallDetails.id);
//     }
//   }, [activeCallDetails]);

//   const sentimentData = {
//     happiness: 90,
//     satisfaction: 85,
//     frustration: 15,
//     urgency: 60,
//   };

//   const handleSaveSummary = async () => {
//     try {
//       await updateInteraction(interaction.call_id, {
//         summary: editedSummary,
//       });
//       interaction.summary = editedSummary;
//       setIsEditing(false);
//     } catch (err) {
//       console.error("Failed to update summary", err);
//     }
//   };

//   const handleSaveDisposition = async () => {
//     try {
//       await updateInteraction(interaction.call_id, {
//         disposition: editedDisposition,
//       });
//       interaction.disposition = editedDisposition;
//       setIsEditingDisposition(false);
//     } catch (err) {
//       console.error("Failed to update disposition", err);
//     }
//   };

//   const updateInteraction = async (id, updates) => {
//     try {
//       const res = await axios.put(
//         // `${backendConfig.callInteractions}${id}`,
//         `${backendConfig.baseURL}${backendConfig.callInteractions}${id}`,
//         updates
//       );
//       console.log("Updated interaction:", res.data);
//       return res.data;
//     } catch (err) {
//       console.error(
//         "Failed to update interaction:",
//         err.response?.data || err.message
//       );
//     }
//   };

//   return (
//     <Card className="bg-white h-full flex flex-col shadow-lg border-slate-200">
//       <CardHeader className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
//         <div className="flex justify-between items-center">
//           <div>
//             <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
//               <Phone className="text-blue-600" />
//               {/* {interaction.direction === "Inbound"
//                 ? "Inbound Call"
//                 : "Outbound Call"} */}

//               {interaction.caller === auth?.userId
//                 ? "Outbound call"
//                 : "Inbound Call"}
//             </CardTitle>
//             <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
//               {/* <span className="flex items-center gap-2">
//                 <User className="w-4 h-4" />
//                 {customer.first_name} {customer.last_name}
//               </span> */}
//               {/* <span className="flex items-center gap-2">
//                 <Clock className="w-4 h-4" />
//                 Duration: {(interaction.duration / 60).toFixed(0)}m{" "}
//                 {interaction.duration % 60}s
//               </span> */}
//             </div>
//           </div>
//           {/* <Badge
//             variant={
//               interaction.status === "completed" ? "default" : "destructive"
//             }
//             className="capitalize"
//           >
//             {interaction.status}
//           </Badge> */}
//         </div>
//       </CardHeader>

//       <CardContent className="p-0 flex-1 flex flex-col min-h-0">
//         <div className="p-4 border-b border-slate-100 flex-shrink-0">
//           <div className="flex items-center justify-end">
//             <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
//               <Button
//                 size="sm"
//                 variant={activeWidgets.summary ? "default" : "ghost"}
//                 onClick={() => toggleWidget("summary")}
//                 className={`gap-1.5 ${
//                   activeWidgets.summary
//                     ? "bg-black text-white hover:bg-black/80"
//                     : ""
//                 }`}
//               >
//                 <BookOpen className="w-4 h-4" />
//                 Call Summary
//               </Button>
//               <Button
//                 size="sm"
//                 variant={activeWidgets.transcript ? "default" : "ghost"}
//                 onClick={() => toggleWidget("transcript")}
//                 className={`gap-1.5 ${
//                   activeWidgets.transcript
//                     ? "bg-black text-white hover:bg-black/80"
//                     : ""
//                 }`}
//               >
//                 <FileText className="w-4 h-4" />
//                 Transcript
//               </Button>
//               <Button
//                 size="sm"
//                 variant={activeWidgets.sentiment ? "default" : "ghost"}
//                 onClick={() => toggleWidget("sentiment")}
//                 className={`gap-1.5 ${
//                   activeWidgets.sentiment
//                     ? "bg-black text-white hover:bg-black/80"
//                     : ""
//                 }`}
//               >
//                 <Smile className="w-4 h-4" />
//                 Sentiment
//               </Button>
//               {/* <Button
//                 size="sm"
//                 variant={activeWidgets.analytics ? "default" : "ghost"}
//                 onClick={() => toggleWidget("analytics")}
//                 className={`gap-1.5 ${
//                   activeWidgets.analytics
//                     ? "bg-black text-white hover:bg-black/80"
//                     : ""
//                 }`}
//               >
//                 <BarChart3 className="w-4 h-4" />
//                 Analytics
//               </Button> */}
//             </div>
//           </div>
//         </div>

//         <div className="flex-1 p-6 space-y-6 min-h-0 overflow-y-auto">
//           <AnimatePresence>
//             {activeWidgets.summary && (
//               <motion.div
//                 key="summary"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 className="space-y-6"
//               >
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <BookOpen className="text-blue-600" />
//                       Call Summary
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div>
//                       <div className="flex items-center justify-between">
//                         <h4 className="font-semibold text-sm text-slate-700">
//                           Summary
//                         </h4>
//                         {!isEditing && (
//                           <button
//                             onClick={() => setIsEditing(true)}
//                             title="Edit"
//                           >
//                             <Pencil className="w-4 h-4 text-blue-500 hover:text-blue-700" />
//                           </button>
//                         )}
//                       </div>
//                       {isEditing ? (
//                         <>
//                           <Textarea
//                             className="w-full text-sm mt-1"
//                             value={editedSummary}
//                             onChange={(e) => setEditedSummary(e.target.value)}
//                             placeholder="Type call summary here..."
//                           />
//                           <div className="flex justify-end pt-2 gap-2">
//                             <Button
//                               variant="ghost"
//                               onClick={() => setIsEditing(false)}
//                             >
//                               Cancel
//                             </Button>
//                             <Button
//                               onClick={handleSaveSummary}
//                               className="bg-blue-600 hover:bg-blue-700 text-white"
//                             >
//                               Save
//                             </Button>
//                           </div>
//                         </>
//                       ) : (
//                         <p className="text-sm text-slate-500 mt-1">
//                           {interaction.summary ||
//                             "No summary available for this call."}
//                         </p>
//                       )}
//                     </div>

//                     <div>
//                       <div className="flex items-center justify-between">
//                         <h4 className="font-semibold text-sm text-slate-700">
//                           Disposition
//                         </h4>
//                         {!isEditingDisposition && (
//                           <button
//                             onClick={() => setIsEditingDisposition(true)}
//                             title="Edit"
//                           >
//                             <Pencil className="w-4 h-4 text-blue-500 hover:text-blue-700" />
//                           </button>
//                         )}
//                       </div>
//                       {isEditingDisposition ? (
//                         <>
//                           <Textarea
//                             className="w-full text-sm mt-1"
//                             value={editedDisposition}
//                             onChange={(e) =>
//                               setEditedDisposition(e.target.value)
//                             }
//                             placeholder="Type disposition or remarks here..."
//                           />
//                           <div className="flex justify-end pt-2 gap-2">
//                             <Button
//                               variant="ghost"
//                               onClick={() => setIsEditingDisposition(false)}
//                             >
//                               Cancel
//                             </Button>
//                             <Button
//                               onClick={handleSaveDisposition}
//                               className="bg-blue-600 hover:bg-blue-700 text-white"
//                             >
//                               Save
//                             </Button>
//                           </div>
//                         </>
//                       ) : (
//                         <p className="text-sm text-slate-500 mt-1">
//                           {interaction.disposition ||
//                             "No disposition recorded for this call."}
//                         </p>
//                       )}
//                     </div>
//                     {/* <div>
//                       <h4 className="font-semibold text-sm text-slate-700">
//                         Notes
//                       </h4>
//                       <p className="text-sm text-slate-500 mt-1">
//                         {interaction.notes || "No additional notes recorded."}
//                       </p>
//                     </div> */}
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             )}
//             {activeWidgets.transcript && (
//               <motion.div
//                 key="transcript"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 className="space-y-6"
//               >
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <Mic2 className="text-blue-600" />
//                       Transcription
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="min-h-[200px] flex items-center justify-center">
//                     {/* {transcriptLines.length > 0 ? (
//                       <div className="space-y-2 text-sm">
//                         {transcriptLines.map((line, idx) => (
//                           <div key={idx}>
//                             <span className="font-semibold text-slate-700">
//                               {line.speaker}:
//                             </span>{" "}
//                             <span className="text-slate-600">{line.text}</span>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center text-slate-500">
//                         <Mic2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
//                         <p className="font-medium">Ready to transcribe</p>
//                         <p className="text-sm">
//                           Call transcription will appear here during active
//                           calls
//                         </p>
//                       </div>
//                     )} */}

//                     {transcriptToShow.length > 0 ? (
//                       <div className="space-y-2 text-sm">
//                         {transcriptToShow.map((line, idx) => (
//                           <div key={idx}>
//                             <span className="font-semibold text-slate-700">
//                               {line.speaker}:
//                             </span>{" "}
//                             <span className="text-slate-600">{line.text}</span>
//                           </div>
//                         ))}
//                       </div>
//                     ) : activeCallDetails ? (
//                       <p className="text-center text-slate-500">
//                         Listening for transcription...
//                       </p>
//                     ) : (
//                       <div className="text-center text-slate-500">
//                         <Mic2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
//                         <p className="font-medium">Ready to transcribe</p>
//                         <p className="text-sm">
//                           Call transcription will appear here during active
//                           calls
//                         </p>
//                       </div>
//                     )}
//                     {/* ) : ( */}
//                     {/* <div className="text-center text-slate-500">
//                       <Mic2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
//                       <p className="font-medium">Ready to transcribe</p>
//                       <p className="text-sm">
//                         Call transcription will appear here during active calls
//                       </p>
//                     </div> */}
//                     {/* )} */}
//                   </CardContent>
//                 </Card>
//                 {/* <Card>
//                   <CardHeader>
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <Bot className="text-blue-600" />
//                       Live Coaching
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">
//                       <div className="flex items-center gap-2 mb-2">
//                         <AlertTriangle className="w-4 h-4" />
//                         <span className="font-medium text-sm">
//                           AI Suggestion
//                         </span>
//                       </div>
//                       <p className="text-sm">
//                         Monitor conversation flow and provide real-time coaching
//                         tips.
//                       </p>
//                     </div>
//                   </CardContent>
//                 </Card> */}
//               </motion.div>
//             )}
//             {activeWidgets.sentiment && (
//               <motion.div
//                 key="sentiment"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 className="space-y-6"
//               >
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <Smile className="text-blue-600" />
//                       Sentiment Analysis
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-6">
//                     {/* <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
//                       <Smile className="w-6 h-6" />
//                       <span className="font-semibold text-lg">Positive</span>
//                       <span className="text-sm">(Live Analysis)</span>
//                     </div> */}
//                     <div className="space-y-4">
//                       <SentimentBar
//                         label="Happiness"
//                         value={sentimentData.happiness}
//                         color="from-green-400 to-green-500"
//                       />
//                       <SentimentBar
//                         label="Satisfaction"
//                         value={sentimentData.satisfaction}
//                         color="from-blue-400 to-blue-500"
//                       />
//                       <SentimentBar
//                         label="Frustration"
//                         value={sentimentData.frustration}
//                         color="from-red-400 to-red-500"
//                       />
//                       <SentimentBar
//                         label="Urgency"
//                         value={sentimentData.urgency}
//                         color="from-orange-400 to-orange-500"
//                       />
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             )}
//             {activeWidgets.analytics && (
//               <motion.div
//                 key="analytics"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 className="space-y-6"
//               >
//                 {/* <Card>
//                   <CardHeader>
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <BarChart3 className="text-blue-600" />
//                       Voice Analytics
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="grid grid-cols-2 gap-4">
//                     <StatCard
//                       title="Words/Min"
//                       value="145"
//                       subtext="Optimal: 140-160"
//                       icon={FileText}
//                       color={{ bg: "bg-blue-100", text: "text-blue-600" }}
//                     />
//                     <StatCard
//                       title="Clarity"
//                       value="92%"
//                       subtext="Audio Quality"
//                       icon={Sparkles}
//                       color={{ bg: "bg-green-100", text: "text-green-600" }}
//                     />
//                     <StatCard
//                       title="Volume"
//                       value="78%"
//                       subtext="Sound Level"
//                       icon={BarChart3}
//                       color={{ bg: "bg-orange-100", text: "text-orange-600" }}
//                     />
//                     <StatCard
//                       title="Talk Time"
//                       value="65%"
//                       subtext="Agent vs Customer"
//                       icon={User}
//                       color={{ bg: "bg-purple-100", text: "text-purple-600" }}
//                     />
//                   </CardContent>
//                 </Card> */}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {!Object.values(activeWidgets).some(Boolean) && (
//             <div className="flex items-center justify-center h-full">
//               <div className="text-center text-slate-500">
//                 <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
//                 {/* <h3 className="text-lg font-semibold text-slate-700">
//                   Select Analytics View
//                 </h3> */}
//                 <p className="text-slate-500 mt-2">
//                   Choose from Call Summary, Transcript, Sentiment above to view
//                   details.
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
// // import React, { useContext, useEffect, useState } from "react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { AnimatePresence, motion } from "framer-motion";
// // import { CallContext } from "../calls/CallProvider";
// // import { AuthContext } from "@/store/AuthContext";

// // export default function CallDetailViewer({ interaction }) {
// //   const [activeWidgets, setActiveWidgets] = useState({
// //     summary: false,
// //     transcript: false,
// //     sentiment: false,
// //     analytics: false,
// //     embeddedApp: false, // new widget
// //   });

// //   const toggleWidget = (widget) => {
// //     setActiveWidgets((prev) => ({ ...prev, [widget]: !prev[widget] }));
// //   };

// //   const { auth } = useContext(AuthContext);
// //   const { activeCallDetails } = useContext(CallContext);

// //   return (
// //     <Card className="bg-white h-full flex flex-col shadow-lg border-slate-200">
// //       <CardHeader className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
// //         <div className="flex justify-between items-center">
// //           <div>
// //             <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
// //               Call Detail
// //             </CardTitle>
// //           </div>
// //         </div>
// //       </CardHeader>

// //       <CardContent className="p-0 flex-1 flex flex-col min-h-0">
// //         {/* Widget Buttons */}
// //         <div className="p-4 border-b border-slate-100 flex-shrink-0">
// //           <div className="flex items-center justify-end gap-1 bg-slate-100 p-1 rounded-lg">
// //             <Button
// //               size="sm"
// //               variant={activeWidgets.embeddedApp ? "default" : "ghost"}
// //               onClick={() => toggleWidget("embeddedApp")}
// //             >
// //               Embedded App
// //             </Button>
// //           </div>
// //         </div>

// //         {/* Widget Content */}
// //         <div className="flex-1 p-6 min-h-0 overflow-y-auto">
// //           <AnimatePresence>
// //             {activeWidgets.embeddedApp && (
// //               <motion.div
// //                 key="embeddedApp"
// //                 initial={{ opacity: 0, y: 20 }}
// //                 animate={{ opacity: 1, y: 0 }}
// //                 exit={{ opacity: 0, y: -20 }}
// //                 className="h-full"
// //               >
// //                 <Card className="h-full">
// //                   <CardHeader>
// //                     <CardTitle>Embedded React App</CardTitle>
// //                   </CardHeader>
// //                   <CardContent className="h-[600px] p-0">
// //                     <iframe
// //                       src="http://localhost:5173/"
// //                       title="Embedded App"
// //                       className="w-full h-full border-0"
// //                     />
// //                   </CardContent>
// //                 </Card>
// //               </motion.div>
// //             )}
// //           </AnimatePresence>
// //         </div>
// //       </CardContent>
// //     </Card>
// //   );
// // }







// update
import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  User,
  Clock,
  Mic2,
  FileText,
  Smile,
  BarChart3,
  Bot,
  Sparkles,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CallContext } from "../calls/CallProvider";
import { Textarea } from "../ui/textarea";
import { Pencil } from "lucide-react";
import { backendConfig } from "@/config/config";
import axios from "axios";
import { AuthContext } from "@/store/AuthContext";
 
const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <Card className="bg-white/50">
    <CardContent className="p-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.bg}`}
      >
        <Icon className={`w-5 h-5 ${color.text}`} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-400">{subtext}</p>
      </div>
    </CardContent>
  </Card>
);
 
const SentimentBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}%</span>
    </div>
    <Progress value={value} className={`[&>*]:bg-gradient-to-r ${color}`} />
  </div>
);
 
export default function CallDetailViewer({ interaction }) {
  const [activeWidgets, setActiveWidgets] = useState({
    summary: false,
    transcript: false,
    sentiment: false,
    analytics: false,
  });
  const [editedSummary, setEditedSummary] = useState(interaction.summary || "");
  const [isEditing, setIsEditing] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [prevCallId, setPrevCallId] = useState(null);
  const [prevTranscript, setPrevTranscript] = useState(null);
  const { activeCallDetails } = useContext(CallContext);
  const [isEditingDisposition, setIsEditingDisposition] = useState(false);
  const [editedDisposition, setEditedDisposition] = useState(
    interaction.disposition || ""
  );
  const [liveTranscript, setLiveTranscript] = useState([]);
  const [storedTranscript, setStoredTranscript] = useState([]);
 
  const toggleWidget = (widget) => {
    setActiveWidgets((prev) => ({ ...prev, [widget]: !prev[widget] }));
  };
 
  const { auth } = useContext(AuthContext);
  useEffect(() => {
    setEditedSummary(interaction.summary || "");
    setIsEditing(false);
  }, [interaction.id]);
 
  // useEffect(() => {
  //   if (interaction?.transcript && Array.isArray(interaction.transcript)) {
  //     setTranscriptLines(interaction.transcript);
  //   } else {
  //     setTranscriptLines([]);
  //   }
  // }, [interaction]);
 
  useEffect(() => {
    if (
      !activeCallDetails &&
      interaction?.transcript &&
      Array.isArray(interaction.transcript)
    ) {
      setStoredTranscript(interaction.transcript);
    } else {
      setStoredTranscript([]);
    }
  }, [interaction, activeCallDetails]);
 
  useEffect(() => {
    if (activeCallDetails) {
      // const interval = setInterval(() => {
      //   // simulate receiving new line from live transcription API
      //   fetch(`/api/live-transcription/${activeCallDetails.id}`)
      //     .then((res) => res.json())
      //     .then((newLine) => {
      //       setLiveTranscript((prev) => [...prev, newLine]);
      //     });
      // }, 1000);
      // return () => clearInterval(interval);
    } else {
      setLiveTranscript([]);
    }
  }, [activeCallDetails]);
 
  const transcriptToShow =
    activeCallDetails && liveTranscript.length > 0
      ? liveTranscript
      : storedTranscript;
 
  // Simulated transcription appending (replace with real-time data source)
 
  useEffect(() => {
    let interval;
    if (activeCallDetails) {
      interval = setInterval(() => {
        setTranscriptLines((prev) => [
          ...prev,
          {
            speaker: Math.random() > 0.5 ? "Agent" : "Customer",
            text:
              Math.random() > 0.5
                ? "Sample sentence from Agent."
                : "Sample sentence from Customer.",
          },
        ]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeCallDetails]);
 
  // Detect when call ends, and store transcript
  useEffect(() => {
    if (!activeCallDetails && prevCallId) {
      if (transcriptLines.length > 0) {
      }
      setTranscriptLines([]);
      setPrevCallId(null);
    }
 
    if (activeCallDetails && activeCallDetails.id !== prevCallId) {
      setTranscriptLines([]);
      setPrevCallId(activeCallDetails.id);
    }
  }, [activeCallDetails]);
 
  const sentimentData = {
    happiness: 90,
    satisfaction: 85,
    frustration: 15,
    urgency: 60,
  };
 
  const handleSaveSummary = async () => {
    try {
      await updateInteraction(interaction.call_id, {
        summary: editedSummary,
      });
      interaction.summary = editedSummary;
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update summary", err);
    }
  };
 
  const handleSaveDisposition = async () => {
    try {
      await updateInteraction(interaction.call_id, {
        disposition: editedDisposition,
      });
      interaction.disposition = editedDisposition;
      setIsEditingDisposition(false);
    } catch (err) {
      console.error("Failed to update disposition", err);
    }
  };
 
  const updateInteraction = async (id, updates) => {
    try {
      const res = await axios.put(
        // `${backendConfig.callInteractions}${id}`,
        `${backendConfig.baseURL}${backendConfig.callInteractions}${id}`,
        updates
      );
      console.log("Updated interaction:", res.data);
      return res.data;
    } catch (err) {
      console.error(
        "Failed to update interaction:",
        err.response?.data || err.message
      );
    }
  };
 
  return (
    ""
    // <Card className="bg-white h-full flex flex-col shadow-lg border-slate-200">
    //   <CardHeader className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
    //     <div className="flex justify-between items-center">
    //       <div>
    //         <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
    //           <Phone className="text-blue-600" />
    //           {/* {interaction.direction === "Inbound"
    //             ? "Inbound Call"
    //             : "Outbound Call"} */}
 
    //           {interaction.caller === auth?.userId
    //             ? "Outbound call"
    //             : "Inbound Call"}
    //         </CardTitle>
    //         <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
    //           {/* <span className="flex items-center gap-2">
    //             <User className="w-4 h-4" />
    //             {customer.first_name} {customer.last_name}
    //           </span> */}
    //           {/* <span className="flex items-center gap-2">
    //             <Clock className="w-4 h-4" />
    //             Duration: {(interaction.duration / 60).toFixed(0)}m{" "}
    //             {interaction.duration % 60}s
    //           </span> */}
    //         </div>
    //       </div>
    //       {/* <Badge
    //         variant={
    //           interaction.status === "completed" ? "default" : "destructive"
    //         }
    //         className="capitalize"
    //       >
    //         {interaction.status}
    //       </Badge> */}
    //     </div>
    //   </CardHeader>
 
    //   <CardContent className="p-0 flex-1 flex flex-col min-h-0">
    //     <div className="p-4 border-b border-slate-100 flex-shrink-0">
    //       <div className="flex items-center justify-end">
    //         <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
    //           <Button
    //             size="sm"
    //             variant={activeWidgets.summary ? "default" : "ghost"}
    //             onClick={() => toggleWidget("summary")}
    //             className={`gap-1.5 ${
    //               activeWidgets.summary
    //                 ? "bg-black text-white hover:bg-black/80"
    //                 : ""
    //             }`}
    //           >
    //             <BookOpen className="w-4 h-4" />
    //             Call Summary
    //           </Button>
    //           <Button
    //             size="sm"
    //             variant={activeWidgets.transcript ? "default" : "ghost"}
    //             onClick={() => toggleWidget("transcript")}
    //             className={`gap-1.5 ${
    //               activeWidgets.transcript
    //                 ? "bg-black text-white hover:bg-black/80"
    //                 : ""
    //             }`}
    //           >
    //             <FileText className="w-4 h-4" />
    //             Transcript
    //           </Button>
    //           <Button
    //             size="sm"
    //             variant={activeWidgets.sentiment ? "default" : "ghost"}
    //             onClick={() => toggleWidget("sentiment")}
    //             className={`gap-1.5 ${
    //               activeWidgets.sentiment
    //                 ? "bg-black text-white hover:bg-black/80"
    //                 : ""
    //             }`}
    //           >
    //             <Smile className="w-4 h-4" />
    //             Sentiment
    //           </Button>
    //           {/* <Button
    //             size="sm"
    //             variant={activeWidgets.analytics ? "default" : "ghost"}
    //             onClick={() => toggleWidget("analytics")}
    //             className={`gap-1.5 ${
    //               activeWidgets.analytics
    //                 ? "bg-black text-white hover:bg-black/80"
    //                 : ""
    //             }`}
    //           >
    //             <BarChart3 className="w-4 h-4" />
    //             Analytics
    //           </Button> */}
    //         </div>
    //       </div>
    //     </div>
 
    //     <div className="flex-1 p-6 space-y-6 min-h-0 overflow-y-auto">
    //       <AnimatePresence>
    //         {activeWidgets.summary && (
    //           <motion.div
    //             key="summary"
    //             initial={{ opacity: 0, y: 20 }}
    //             animate={{ opacity: 1, y: 0 }}
    //             exit={{ opacity: 0, y: -20 }}
    //             className="space-y-6"
    //           >
    //             <Card>
    //               <CardHeader>
    //                 <CardTitle className="text-base flex items-center gap-2">
    //                   <BookOpen className="text-blue-600" />
    //                   Call Summary
    //                 </CardTitle>
    //               </CardHeader>
    //               <CardContent className="space-y-4">
    //                 <div>
    //                   <div className="flex items-center justify-between">
    //                     <h4 className="font-semibold text-sm text-slate-700">
    //                       Summary
    //                     </h4>
    //                     {!isEditing && (
    //                       <button
    //                         onClick={() => setIsEditing(true)}
    //                         title="Edit"
    //                       >
    //                         <Pencil className="w-4 h-4 text-blue-500 hover:text-blue-700" />
    //                       </button>
    //                     )}
    //                   </div>
    //                   {isEditing ? (
    //                     <>
    //                       <Textarea
    //                         className="w-full text-sm mt-1"
    //                         value={editedSummary}
    //                         onChange={(e) => setEditedSummary(e.target.value)}
    //                         placeholder="Type call summary here..."
    //                       />
    //                       <div className="flex justify-end pt-2 gap-2">
    //                         <Button
    //                           variant="ghost"
    //                           onClick={() => setIsEditing(false)}
    //                         >
    //                           Cancel
    //                         </Button>
    //                         <Button
    //                           onClick={handleSaveSummary}
    //                           className="bg-blue-600 hover:bg-blue-700 text-white"
    //                         >
    //                           Save
    //                         </Button>
    //                       </div>
    //                     </>
    //                   ) : (
    //                     <p className="text-sm text-slate-500 mt-1">
    //                       {interaction.summary ||
    //                         "No summary available for this call."}
    //                     </p>
    //                   )}
    //                 </div>
 
    //                 <div>
    //                   <div className="flex items-center justify-between">
    //                     <h4 className="font-semibold text-sm text-slate-700">
    //                       Disposition
    //                     </h4>
    //                     {!isEditingDisposition && (
    //                       <button
    //                         onClick={() => setIsEditingDisposition(true)}
    //                         title="Edit"
    //                       >
    //                         <Pencil className="w-4 h-4 text-blue-500 hover:text-blue-700" />
    //                       </button>
    //                     )}
    //                   </div>
    //                   {isEditingDisposition ? (
    //                     <>
    //                       <Textarea
    //                         className="w-full text-sm mt-1"
    //                         value={editedDisposition}
    //                         onChange={(e) =>
    //                           setEditedDisposition(e.target.value)
    //                         }
    //                         placeholder="Type disposition or remarks here..."
    //                       />
    //                       <div className="flex justify-end pt-2 gap-2">
    //                         <Button
    //                           variant="ghost"
    //                           onClick={() => setIsEditingDisposition(false)}
    //                         >
    //                           Cancel
    //                         </Button>
    //                         <Button
    //                           onClick={handleSaveDisposition}
    //                           className="bg-blue-600 hover:bg-blue-700 text-white"
    //                         >
    //                           Save
    //                         </Button>
    //                       </div>
    //                     </>
    //                   ) : (
    //                     <p className="text-sm text-slate-500 mt-1">
    //                       {interaction.disposition ||
    //                         "No disposition recorded for this call."}
    //                     </p>
    //                   )}
    //                 </div>
    //                 {/* <div>
    //                   <h4 className="font-semibold text-sm text-slate-700">
    //                     Notes
    //                   </h4>
    //                   <p className="text-sm text-slate-500 mt-1">
    //                     {interaction.notes || "No additional notes recorded."}
    //                   </p>
    //                 </div> */}
    //               </CardContent>
    //             </Card>
    //           </motion.div>
    //         )}
    //         {activeWidgets.transcript && (
    //           <motion.div
    //             key="transcript"
    //             initial={{ opacity: 0, y: 20 }}
    //             animate={{ opacity: 1, y: 0 }}
    //             exit={{ opacity: 0, y: -20 }}
    //             className="space-y-6"
    //           >
    //             <Card>
    //               <CardHeader>
    //                 <CardTitle className="text-base flex items-center gap-2">
    //                   <Mic2 className="text-blue-600" />
    //                   Transcription
    //                 </CardTitle>
    //               </CardHeader>
    //               <CardContent className="min-h-[200px] flex items-center justify-center">
    //                 {/* {transcriptLines.length > 0 ? (
    //                   <div className="space-y-2 text-sm">
    //                     {transcriptLines.map((line, idx) => (
    //                       <div key={idx}>
    //                         <span className="font-semibold text-slate-700">
    //                           {line.speaker}:
    //                         </span>{" "}
    //                         <span className="text-slate-600">{line.text}</span>
    //                       </div>
    //                     ))}
    //                   </div>
    //                 ) : (
    //                   <div className="text-center text-slate-500">
    //                     <Mic2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
    //                     <p className="font-medium">Ready to transcribe</p>
    //                     <p className="text-sm">
    //                       Call transcription will appear here during active
    //                       calls
    //                     </p>
    //                   </div>
    //                 )} */}
 
    //                 {transcriptToShow.length > 0 ? (
    //                   <div className="space-y-2 text-sm">
    //                     {transcriptToShow.map((line, idx) => (
    //                       <div key={idx}>
    //                         <span className="font-semibold text-slate-700">
    //                           {line.speaker}:
    //                         </span>{" "}
    //                         <span className="text-slate-600">{line.text}</span>
    //                       </div>
    //                     ))}
    //                   </div>
    //                 ) : activeCallDetails ? (
    //                   <p className="text-center text-slate-500">
    //                     Listening for transcription...
    //                   </p>
    //                 ) : (
    //                   <div className="text-center text-slate-500">
    //                     <Mic2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
    //                     <p className="font-medium">Ready to transcribe</p>
    //                     <p className="text-sm">
    //                       Call transcription will appear here during active
    //                       calls
    //                     </p>
    //                   </div>
    //                 )}
    //                 {/* ) : ( */}
    //                 {/* <div className="text-center text-slate-500">
    //                   <Mic2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
    //                   <p className="font-medium">Ready to transcribe</p>
    //                   <p className="text-sm">
    //                     Call transcription will appear here during active calls
    //                   </p>
    //                 </div> */}
    //                 {/* )} */}
    //               </CardContent>
    //             </Card>
    //             {/* <Card>
    //               <CardHeader>
    //                 <CardTitle className="text-base flex items-center gap-2">
    //                   <Bot className="text-blue-600" />
    //                   Live Coaching
    //                 </CardTitle>
    //               </CardHeader>
    //               <CardContent>
    //                 <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">
    //                   <div className="flex items-center gap-2 mb-2">
    //                     <AlertTriangle className="w-4 h-4" />
    //                     <span className="font-medium text-sm">
    //                       AI Suggestion
    //                     </span>
    //                   </div>
    //                   <p className="text-sm">
    //                     Monitor conversation flow and provide real-time coaching
    //                     tips.
    //                   </p>
    //                 </div>
    //               </CardContent>
    //             </Card> */}
    //           </motion.div>
    //         )}
    //         {activeWidgets.sentiment && (
    //           <motion.div
    //             key="sentiment"
    //             initial={{ opacity: 0, y: 20 }}
    //             animate={{ opacity: 1, y: 0 }}
    //             exit={{ opacity: 0, y: -20 }}
    //             className="space-y-6"
    //           >
    //             <Card>
    //               <CardHeader>
    //                 <CardTitle className="text-base flex items-center gap-2">
    //                   <Smile className="text-blue-600" />
    //                   Sentiment Analysis
    //                 </CardTitle>
    //               </CardHeader>
    //               <CardContent className="space-y-6">
    //                 {/* <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
    //                   <Smile className="w-6 h-6" />
    //                   <span className="font-semibold text-lg">Positive</span>
    //                   <span className="text-sm">(Live Analysis)</span>
    //                 </div> */}
    //                 <div className="space-y-4">
    //                   <SentimentBar
    //                     label="Happiness"
    //                     value={sentimentData.happiness}
    //                     color="from-green-400 to-green-500"
    //                   />
    //                   <SentimentBar
    //                     label="Satisfaction"
    //                     value={sentimentData.satisfaction}
    //                     color="from-blue-400 to-blue-500"
    //                   />
    //                   <SentimentBar
    //                     label="Frustration"
    //                     value={sentimentData.frustration}
    //                     color="from-red-400 to-red-500"
    //                   />
    //                   <SentimentBar
    //                     label="Urgency"
    //                     value={sentimentData.urgency}
    //                     color="from-orange-400 to-orange-500"
    //                   />
    //                 </div>
    //               </CardContent>
    //             </Card>
    //           </motion.div>
    //         )}
    //         {activeWidgets.analytics && (
    //           <motion.div
    //             key="analytics"
    //             initial={{ opacity: 0, y: 20 }}
    //             animate={{ opacity: 1, y: 0 }}
    //             exit={{ opacity: 0, y: -20 }}
    //             className="space-y-6"
    //           >
    //             {/* <Card>
    //               <CardHeader>
    //                 <CardTitle className="text-base flex items-center gap-2">
    //                   <BarChart3 className="text-blue-600" />
    //                   Voice Analytics
    //                 </CardTitle>
    //               </CardHeader>
    //               <CardContent className="grid grid-cols-2 gap-4">
    //                 <StatCard
    //                   title="Words/Min"
    //                   value="145"
    //                   subtext="Optimal: 140-160"
    //                   icon={FileText}
    //                   color={{ bg: "bg-blue-100", text: "text-blue-600" }}
    //                 />
    //                 <StatCard
    //                   title="Clarity"
    //                   value="92%"
    //                   subtext="Audio Quality"
    //                   icon={Sparkles}
    //                   color={{ bg: "bg-green-100", text: "text-green-600" }}
    //                 />
    //                 <StatCard
    //                   title="Volume"
    //                   value="78%"
    //                   subtext="Sound Level"
    //                   icon={BarChart3}
    //                   color={{ bg: "bg-orange-100", text: "text-orange-600" }}
    //                 />
    //                 <StatCard
    //                   title="Talk Time"
    //                   value="65%"
    //                   subtext="Agent vs Customer"
    //                   icon={User}
    //                   color={{ bg: "bg-purple-100", text: "text-purple-600" }}
    //                 />
    //               </CardContent>
    //             </Card> */}
    //           </motion.div>
    //         )}
    //       </AnimatePresence>
 
    //       {!Object.values(activeWidgets).some(Boolean) && (
    //         <div className="flex items-center justify-center h-full">
    //           <div className="text-center text-slate-500">
    //             <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
    //             {/* <h3 className="text-lg font-semibold text-slate-700">
    //               Select Analytics View
    //             </h3> */}
    //             <p className="text-slate-500 mt-2">
    //               Choose from Call Summary, Transcript, Sentiment above to view
    //               details.
    //             </p>
    //           </div>
    //         </div>
    //       )}
    //     </div>
    //   </CardContent>
    // </Card>
  );
}
// import React, { useContext, useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { AnimatePresence, motion } from "framer-motion";
// import { CallContext } from "../calls/CallProvider";
// import { AuthContext } from "@/store/AuthContext";
 
// export default function CallDetailViewer({ interaction }) {
//   const [activeWidgets, setActiveWidgets] = useState({
//     summary: false,
//     transcript: false,
//     sentiment: false,
//     analytics: false,
//     embeddedApp: false, // new widget
//   });
 
//   const toggleWidget = (widget) => {
//     setActiveWidgets((prev) => ({ ...prev, [widget]: !prev[widget] }));
//   };
 
//   const { auth } = useContext(AuthContext);
//   const { activeCallDetails } = useContext(CallContext);
 
//   return (
//     <Card className="bg-white h-full flex flex-col shadow-lg border-slate-200">
//       <CardHeader className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
//         <div className="flex justify-between items-center">
//           <div>
//             <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
//               Call Detail
//             </CardTitle>
//           </div>
//         </div>
//       </CardHeader>
 
//       <CardContent className="p-0 flex-1 flex flex-col min-h-0">
//         {/* Widget Buttons */}
//         <div className="p-4 border-b border-slate-100 flex-shrink-0">
//           <div className="flex items-center justify-end gap-1 bg-slate-100 p-1 rounded-lg">
//             <Button
//               size="sm"
//               variant={activeWidgets.embeddedApp ? "default" : "ghost"}
//               onClick={() => toggleWidget("embeddedApp")}
//             >
//               Embedded App
//             </Button>
//           </div>
//         </div>
 
//         {/* Widget Content */}
//         <div className="flex-1 p-6 min-h-0 overflow-y-auto">
//           <AnimatePresence>
//             {activeWidgets.embeddedApp && (
//               <motion.div
//                 key="embeddedApp"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 className="h-full"
//               >
//                 <Card className="h-full">
//                   <CardHeader>
//                     <CardTitle>Embedded React App</CardTitle>
//                   </CardHeader>
//                   <CardContent className="h-[600px] p-0">
//                     <iframe
//                       src="http://localhost:5173/"
//                       title="Embedded App"
//                       className="w-full h-full border-0"
//                     />
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
 
 
 