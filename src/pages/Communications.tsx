// import React, { useState, useEffect, useContext } from "react";
// // import { Interaction } from "@/entities/Interaction";
// // import { Customer } from "@/entities/Customer";

// // import Customer from "@/entities/Customer";
// // import Interaction from "@/entities/Interaction";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Phone,
//   PhoneIncoming,
//   PhoneOutgoing,
//   MessageSquare,
//   Mail,
//   Plus,
//   Search,
//   Inbox,
//   Activity,
//   User,
// } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
// import { motion, AnimatePresence } from "framer-motion";

// import InteractionForm from "../components/communications/InteractionForm";
// import CallDetailViewer from "../components/communications/CallDetailViewer";
// import EmailDetailViewer from "../components/communications/EmailDetailViewer";
// import ChatDetailViewer from "../components/communications/ChatDetailViewer";
// import { CallContext } from "../components/calls/CallProvider";
// import { AuthContext } from "@/store/AuthContext";
// import axios from "axios";
// import { backendConfig, dbConfig } from "@/config/config";

// export default function CommunicationsPage() {
//   const [interactions, setInteractions] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [filteredInteractions, setFilteredInteractions] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeTab, setActiveTab] = useState("all");
//   const [showForm, setShowForm] = useState(false);
//   const [selectedInteraction, setSelectedInteraction] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const { activeCallDetails } = useContext(CallContext);
//   const { auth } = useContext(AuthContext);
//   // useEffect(() => {
//   //   console.log("activeCallDetails", activeCallDetails);
//   // }, [activeCallDetails]);

//   // useEffect(() => {
//   //   console.log("selectedInteraction", selectedInteraction);
//   // }, [selectedInteraction]);

//   useEffect(() => {
//     loadData();
//   }, []);

//   useEffect(() => {
//     filterInteractions();
//   }, [interactions, searchTerm, activeTab]);

//   useEffect(() => {
//     if (filteredInteractions.length > 0 && !selectedInteraction) {
//       // console.log("filteredInteractions", filteredInteractions);
//       setSelectedInteraction(filteredInteractions);
//     } else if (filteredInteractions.length === 0) {
//       setSelectedInteraction(null);
//     }
//   }, [filteredInteractions]);

//   const loadData = async () => {
//     setIsLoading(true);
//     // try {
//     //   const [interactionsData, customersData] = await Promise.all([
//     //     Interaction.list("-created_date", 100),
//     //     Customer.list(),
//     //   ]);
//     //   console.log("interactionsData", interactionsData);
//     //   console.log("customersData", customersData);
//     //   setInteractions(interactionsData);
//     //   setCustomers(customersData);
//     // } catch (error) {
//     //   console.error("Error loading data:", error);
//     // }

//     try {
//       const [interactionsRes, customersRes] = await Promise.all([
//         // axios.get(`${dbConfig.baseURL}/${dbConfig.interactions}`
//         axios.get(
//           // `${backendConfig.callInteractions}`,
//           `${backendConfig.baseURL}${backendConfig.callInteractions}`,

//           {
//             // params: { sort: "-created_date", limit: 100 },
//           }
//         ),
//         // axios.get(`${dbConfig.baseURL}/${dbConfig.customers}`),
//         // axios.get(`${backendConfig.customers}`),
//         axios.get(`${backendConfig.baseURL}${backendConfig.customers}`),
//       ]);

//       // console.log("interactionsData", interactionsRes.data);
//       // console.log("customersData", customersRes.data);

//       setInteractions(interactionsRes.data);
//       setCustomers(customersRes.data);
//     } catch (error) {
//       console.error("Error loading data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//     setIsLoading(false);
//   };

//   const filterInteractions = () => {
//     let filtered = interactions;

//     if (activeTab !== "all") {
//       filtered = filtered.filter((interaction) => {
//         if (activeTab === "Call") {
//           return !!interaction.call_id;
//         } else {
//           return interaction.type === activeTab;
//         }
//       });
//     }

//     setFilteredInteractions(filtered);
//   };

//   const getCustomer = (customerId) => {
//     return (
//       customers.find((c) => c.id === customerId) || {
//         first_name: "Unknown",
//         last_name: "Customer",
//       }
//     );
//   };

//   const getInteractionIcon = (type, direction) => {
//     if (type === "Call") {
//       return direction === "Inbound" ? PhoneIncoming : PhoneOutgoing;
//     }
//     switch (type) {
//       case "Chat":
//         return MessageSquare;
//       case "SMS":
//         return MessageSquare;
//       case "Email":
//         return Mail;
//       default:
//         return Phone;
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "active":
//         return "bg-blue-100 text-blue-800 border-blue-200";
//       case "completed":
//         return "bg-green-100 text-green-800 border-green-200";
//       case "missed":
//         return "bg-red-100 text-red-800 border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200";
//     }
//   };

//   const handleSaveInteraction = async (interactionData) => {
//     // console.log("interactionData in handleSaveInteraction ", interactionData);
//     try {
//       // const dataToSave = { ...interactionData, direction: "Outbound" };
//       // await Interaction.create(dataToSave);
//       setShowForm(false);
//       loadData();
//     } catch (error) {
//       console.error("Error saving interaction:", error);
//     }

//     // try {
//     //   const dataToSave = { ...interactionData, direction: "Outbound" };
//     //   await axios.post(
//     //     `${dbConfig.baseURL}/${dbConfig.interactions}`,
//     //     dataToSave
//     //   );
//     //   setShowForm(false);
//     //   loadData();
//     // } catch (error) {
//     //   console.error("Error saving interaction:", error);
//     // }
//   };

//   const renderInteractionDetail = () => {
//     if (isLoading) {
//       return (
//         <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50 rounded-lg">
//           <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
//         </div>
//       );
//     }

//     if (!selectedInteraction) {
//       return (
//         <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50 rounded-lg">
//           <Inbox className="w-24 h-24 text-slate-300 mb-4" />
//           <h3 className="text-xl font-semibold text-slate-700">
//             Select an Interaction
//           </h3>
//           <p className="text-slate-500 mt-2">
//             Choose an item from the list to see its details, transcript, and
//             analytics.
//           </p>
//         </div>
//       );
//     }

//     // const customer = getCustomer(selectedInteraction.customer_id);

//     // switch (selectedInteraction) {
//     //   case "Call":
//     //     return (
//     //       <CallDetailViewer
//     //         interaction={selectedInteraction}
//     //         // customer={customer}
//     //       />
//     //     );
//     //   // case "Email":
//     //   //   return (
//     //   //     <EmailDetailViewer
//     //   //       interaction={selectedInteraction}
//     //   //       customer={customer}
//     //   //     />
//     //   //   );
//     //   // case "Chat":
//     //   // case "SMS":
//     //   //   return (
//     //   //     <ChatDetailViewer
//     //   //       interaction={selectedInteraction}
//     //   //       customer={customer}
//     //   //     />
//     //   //   );
//     //   // default:
//     //   //   return <div>Unsupported interaction type.</div>;
//     // }

//     return <CallDetailViewer interaction={selectedInteraction} />;
//   };

//   const activeInteractionsCount = interactions.length;

//   return (
//     <div className="h-screen flex flex-col p-6 bg-slate-50">
//       <div className="flex-shrink-0">
//         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">
//               Communications
//             </h1>
//             {/* <p className="text-slate-600 mt-1">
//               Unified inbox for all customer interactions.
//             </p> */}
//             {activeInteractionsCount > 0 && (
//               <div className="flex items-center gap-2 mt-2">
//                 <Activity className="w-4 h-4 text-blue-600" />
//                 <span className="text-sm text-blue-600 font-medium">
//                   {activeInteractionsCount} interaction
//                   {activeInteractionsCount !== 1 ? "s" : ""}
//                 </span>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-0">
//         <div className="lg:col-span-4 min-h-0">
//           <Card className="bg-white border-slate-200 shadow-sm h-full flex flex-col">
//             <CardHeader className="border-b border-slate-100 flex-shrink-0">
//               {/* <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
//                 <Input
//                   placeholder="Search interactions..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div> */}
//               <Tabs
//                 value={activeTab}
//                 onValueChange={setActiveTab}
//                 className="mt-4"
//               >
//                 <TabsList className="grid w-full grid-cols-4">
//                   <TabsTrigger value="all">All</TabsTrigger>
//                   <TabsTrigger value="Call">Calls</TabsTrigger>
//                   <TabsTrigger value="Email">Email</TabsTrigger>
//                   <TabsTrigger value="Chat">Chat</TabsTrigger>
//                 </TabsList>
//               </Tabs>
//             </CardHeader>
//             <CardContent className="p-0 flex-1 overflow-y-auto">
//               {isLoading ? (
//                 <div className="p-8 text-center flex items-center justify-center h-full">
//                   <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
//                 </div>
//               ) : (
//                 <div className="divide-y divide-slate-100">
//                   <AnimatePresence>
//                     {filteredInteractions
//                       .slice()
//                       .sort(
//                         (a, b) =>
//                           new Date(b.created_date).getTime() -
//                           new Date(a.created_date).getTime()
//                       )
//                       .map((interaction, index) => {
//                         let Icon;
//                         // const interaction_data = interaction.created_date;
//                         // const interaction_date = interaction_data.slice(0, 10);
//                         // const interaction_time = interaction_data.slice(11, 16);

//                         const utcString =
//                           interaction.created_date.replace(" ", "T") + "Z"; // Treat as UTC
//                         const dateObj = new Date(utcString);

//                         const interaction_date =
//                           dateObj.toLocaleDateString("en-CA");
//                         const interaction_time = dateObj.toLocaleTimeString(
//                           "en-US",
//                           {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                             hour12: true,
//                           }
//                         );

//                         if (interaction.caller === auth?.userId) {
//                           Icon = getInteractionIcon("Call", "Outbound");
//                         } else {
//                           Icon = getInteractionIcon("Call", "Inbound");
//                         }

//                         // // const customer = getCustomer(interaction.customer_id);
//                         const interactionTitle =
//                           interaction.caller === auth?.userId
//                             ? "Outbound call"
//                             : "Inbound Call";
//                         return (
//                           <motion.div
//                             key={interaction.call_id}
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -20 }}
//                             transition={{ delay: index * 0.05 }}
//                             className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
//                               selectedInteraction?.call_id ===
//                               interaction.call_id
//                                 ? "bg-blue-50 border-l-4 border-blue-600"
//                                 : "border-l-4 border-transparent"
//                             }`}
//                             onClick={() => setSelectedInteraction(interaction)}
//                           >
//                             <div className="flex items-start gap-4">
//                               <div
//                                 className={`p-2 rounded-lg mt-1 ${
//                                   selectedInteraction?.call_id ===
//                                   interaction.call_id
//                                     ? "bg-blue-100"
//                                     : "bg-slate-100"
//                                 }`}
//                               >
//                                 <Icon
//                                   className={`w-4 h-4 ${
//                                     selectedInteraction?.call_id ===
//                                     interaction.call_id
//                                       ? "text-blue-600"
//                                       : "text-slate-600"
//                                   }`}
//                                 />
//                               </div>
//                               <div className="flex-1 overflow-hidden">
//                                 <div className="flex items-center justify-between">
//                                   <h3 className="font-semibold text-slate-900 truncate pr-2">
//                                     {interactionTitle}
//                                   </h3>
//                                   <span className="text-xs text-slate-400 flex-shrink-0">
//                                     {/* {formatDistanceToNow(
//                                     new Date(interaction.created_date),
//                                     { addSuffix: true }
//                                   )} */}
//                                     {interaction_date} {interaction_time}
//                                   </span>
//                                 </div>
//                                 <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
//                                   <User className="w-3 h-3" />
//                                   <span>
//                                     {/* {customer.first_name} {customer.last_name} */}

//                                     {interaction.caller === auth?.userId
//                                       ? interaction.callee
//                                       : interaction.caller}
//                                   </span>
//                                 </div>
//                                 {/* <Badge
//                                 className={`mt-2 ${getStatusColor(
//                                   interaction.status
//                                 )}`}
//                               >
//                                 {interaction.status}
//                               </Badge> */}
//                               </div>
//                             </div>
//                           </motion.div>
//                         );
//                       })}
//                   </AnimatePresence>
//                   {filteredInteractions.length === 0 && !isLoading && (
//                     <div className="p-8 text-center h-full flex flex-col justify-center">
//                       <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//                       <p className="text-slate-500">
//                         No recent interactions found.
//                       </p>
//                       <p className="text-xs text-slate-400 mt-2">
//                         Showing active, missed, and last 24 hours
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         <div className="lg:col-span-8 min-h-0">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={selectedInteraction ? selectedInteraction.call_id : "empty"}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.2 }}
//               className="h-full"
//             >
//               {renderInteractionDetail()}
//             </motion.div>
//           </AnimatePresence>
//         </div>
//       </div>

//       {showForm && (
//         <InteractionForm
//           customers={customers}
//           onSave={handleSaveInteraction}
//           onCancel={() => setShowForm(false)}
//           interaction={null}
//         />
//       )}
//     </div>
//   );
// }




//update
import React, { useState, useEffect, useContext } from "react";
// import { Interaction } from "@/entities/Interaction";
// import { Customer } from "@/entities/Customer";
 
// import Customer from "@/entities/Customer";
// import Interaction from "@/entities/Interaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare,
  Mail,
  Plus,
  Search,
  Inbox,
  Activity,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
 
import InteractionForm from "../components/communications/InteractionForm";
import CallDetailViewer from "../components/communications/CallDetailViewer";
import EmailDetailViewer from "../components/communications/EmailDetailViewer";
import ChatDetailViewer from "../components/communications/ChatDetailViewer";
import { CallContext } from "../components/calls/CallProvider";
import { AuthContext } from "@/store/AuthContext";
import axios from "axios";
import { backendConfig, dbConfig } from "@/config/config";
 
export default function CommunicationsPage() {
  const [interactions, setInteractions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredInteractions, setFilteredInteractions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
 
  const { activeCallDetails } = useContext(CallContext);
  const { auth } = useContext(AuthContext);
  // useEffect(() => {
  //   console.log("activeCallDetails", activeCallDetails);
  // }, [activeCallDetails]);
 
  // useEffect(() => {
  //   console.log("selectedInteraction", selectedInteraction);
  // }, [selectedInteraction]);
 
  useEffect(() => {
    loadData();
  }, []);
 
  useEffect(() => {
    filterInteractions();
  }, [interactions, searchTerm, activeTab]);
 
  useEffect(() => {
    if (filteredInteractions.length > 0 && !selectedInteraction) {
      // console.log("filteredInteractions", filteredInteractions);
      setSelectedInteraction(filteredInteractions);
    } else if (filteredInteractions.length === 0) {
      setSelectedInteraction(null);
    }
  }, [filteredInteractions]);
 
  const loadData = async () => {
    setIsLoading(true);
    // try {
    //   const [interactionsData, customersData] = await Promise.all([
    //     Interaction.list("-created_date", 100),
    //     Customer.list(),
    //   ]);
    //   console.log("interactionsData", interactionsData);
    //   console.log("customersData", customersData);
    //   setInteractions(interactionsData);
    //   setCustomers(customersData);
    // } catch (error) {
    //   console.error("Error loading data:", error);
    // }
 
    try {
      const [interactionsRes, customersRes] = await Promise.all([
        // axios.get(`${dbConfig.baseURL}/${dbConfig.interactions}`
        axios.get(
          // `${backendConfig.callInteractions}`,
          `${backendConfig.baseURL}${backendConfig.callInteractions}`,
 
          {
            // params: { sort: "-created_date", limit: 100 },
          }
        ),
        // axios.get(`${dbConfig.baseURL}/${dbConfig.customers}`),
        // axios.get(`${backendConfig.customers}`),
        axios.get(`${backendConfig.baseURL}${backendConfig.customers}`),
      ]);
 
      // console.log("interactionsData", interactionsRes.data);
      // console.log("customersData", customersRes.data);
 
      setInteractions(interactionsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
    setIsLoading(false);
  };
 
  const filterInteractions = () => {
    let filtered = interactions;
 
    if (activeTab !== "all") {
      filtered = filtered.filter((interaction) => {
        if (activeTab === "Call") {
          return !!interaction.call_id;
        } else {
          return interaction.type === activeTab;
        }
      });
    }
 
    setFilteredInteractions(filtered);
  };
 
  const getCustomer = (customerId) => {
    return (
      customers.find((c) => c.id === customerId) || {
        first_name: "Unknown",
        last_name: "Customer",
      }
    );
  };
 
  const getInteractionIcon = (type, direction) => {
    if (type === "Call") {
      return direction === "Inbound" ? PhoneIncoming : PhoneOutgoing;
    }
    switch (type) {
      case "Chat":
        return MessageSquare;
      case "SMS":
        return MessageSquare;
      case "Email":
        return Mail;
      default:
        return Phone;
    }
  };
 
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "missed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
 
  const handleSaveInteraction = async (interactionData) => {
    // console.log("interactionData in handleSaveInteraction ", interactionData);
    try {
      // const dataToSave = { ...interactionData, direction: "Outbound" };
      // await Interaction.create(dataToSave);
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error("Error saving interaction:", error);
    }
 
    // try {
    //   const dataToSave = { ...interactionData, direction: "Outbound" };
    //   await axios.post(
    //     `${dbConfig.baseURL}/${dbConfig.interactions}`,
    //     dataToSave
    //   );
    //   setShowForm(false);
    //   loadData();
    // } catch (error) {
    //   console.error("Error saving interaction:", error);
    // }
  };
 
  const renderInteractionDetail = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50 rounded-lg">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      );
    }
 
    if (!selectedInteraction) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50 rounded-lg">
          <Inbox className="w-24 h-24 text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700">
            Select an Interaction
          </h3>
          <p className="text-slate-500 mt-2">
            Choose an item from the list to see its details, transcript, and
            analytics.
          </p>
        </div>
      );
    }
 
    // const customer = getCustomer(selectedInteraction.customer_id);
 
    // switch (selectedInteraction) {
    //   case "Call":
    //     return (
    //       <CallDetailViewer
    //         interaction={selectedInteraction}
    //         // customer={customer}
    //       />
    //     );
    //   // case "Email":
    //   //   return (
    //   //     <EmailDetailViewer
    //   //       interaction={selectedInteraction}
    //   //       customer={customer}
    //   //     />
    //   //   );
    //   // case "Chat":
    //   // case "SMS":
    //   //   return (
    //   //     <ChatDetailViewer
    //   //       interaction={selectedInteraction}
    //   //       customer={customer}
    //   //     />
    //   //   );
    //   // default:
    //   //   return <div>Unsupported interaction type.</div>;
    // }
 
    return <CallDetailViewer interaction={selectedInteraction} />;
  };
 
  const activeInteractionsCount = interactions.length;
 
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Communications
            </h1>
            {/* <p className="text-slate-600 mt-1">
              Unified inbox for all customer interactions.
            </p> */}
            {activeInteractionsCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  {activeInteractionsCount} interaction
                  {activeInteractionsCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
 
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
            <div className="lg:col-span-12 min-h-0">
              <Card className="bg-white border-slate-200 shadow-sm h-full flex flex-col">
                <CardHeader className="border-b border-slate-100 flex-shrink-0">
                  {/* <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search interactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div> */}
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="mt-4"
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="Call">Calls</TabsTrigger>
                      <TabsTrigger value="Email">Email</TabsTrigger>
                      <TabsTrigger value="Chat">Chat</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center flex items-center justify-center h-full">
                      <div className="animate-spin w- h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      <AnimatePresence>
                        {filteredInteractions
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.created_date).getTime() -
                              new Date(a.created_date).getTime()
                          )
                          .map((interaction, index) => {
                            let Icon;
                            // const interaction_data = interaction.created_date;
                            // const interaction_date = interaction_data.slice(0, 10);
                            // const interaction_time = interaction_data.slice(11, 16);
 
                            const utcString =
                              interaction.created_date.replace(" ", "T") + "Z"; // Treat as UTC
                            const dateObj = new Date(utcString);
 
                            const interaction_date =
                              dateObj.toLocaleDateString("en-CA");
                            const interaction_time = dateObj.toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            );
 
                            if (interaction.caller === auth?.userId) {
                              Icon = getInteractionIcon("Call", "Outbound");
                            } else {
                              Icon = getInteractionIcon("Call", "Inbound");
                            }
 
                            // // const customer = getCustomer(interaction.customer_id);
                            const interactionTitle =
                              interaction.caller === auth?.userId
                                ? "Outbound call"
                                : "Inbound Call";
                            return (
                              <motion.div
                                key={interaction.call_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedInteraction?.call_id ===
                                    interaction.call_id
                                    ? "bg-blue-50 border-l-4 border-blue-600"
                                    : "border-l-4 border-transparent"
                                  }`}
                                onClick={() => setSelectedInteraction(interaction)}
                              >
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`p-2 rounded-lg mt-1 ${selectedInteraction?.call_id ===
                                        interaction.call_id
                                        ? "bg-blue-100"
                                        : "bg-slate-100"
                                      }`}
                                  >
                                    <Icon
                                      className={`w-4 h-4 ${selectedInteraction?.call_id ===
                                          interaction.call_id
                                          ? "text-blue-600"
                                          : "text-slate-600"
                                        }`}
                                    />
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                      <h3 className="font-semibold text-slate-900 truncate pr-2">
                                        {interactionTitle}
                                      </h3>
                                      <span className="text-xs text-slate-400 flex-shrink-0">
                                        {/* {formatDistanceToNow(
                                    new Date(interaction.created_date),
                                    { addSuffix: true }
                                  )} */}
                                        {interaction_date} {interaction_time}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                      <User className="w-3 h-3" />
                                      <span>
                                        {/* {customer.first_name} {customer.last_name} */}
 
                                        {interaction.caller === auth?.userId
                                          ? interaction.callee
                                          : interaction.caller}
                                      </span>
                                    </div>
                                    {/* <Badge
                                className={`mt-2 ${getStatusColor(
                                  interaction.status
                                )}`}
                              >
                                {interaction.status}
                              </Badge> */}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </AnimatePresence>
                      {filteredInteractions.length === 0 && !isLoading && (
                        <div className="p-8 text-center h-full flex flex-col justify-center">
                          <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">
                            No recent interactions found.
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            Showing active, missed, and last 24 hours
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
 
        <div className="lg:col-span-8 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedInteraction ? selectedInteraction.call_id : "empty"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderInteractionDetail()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
 
      {showForm && (
        <InteractionForm
          customers={customers}
          onSave={handleSaveInteraction}
          onCancel={() => setShowForm(false)}
          interaction={null}
        />
      )}
    </div>
  );
}
 
 