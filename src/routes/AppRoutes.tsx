import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
// import NewCall from "@/pages/NewCall";
import ComposeEmail from "@/pages/ComposeEmail";
import Customers from "@/pages/Customers";
import Welcome from "@/pages/Welcome";
import Communications from "@/pages/Communications";
import StartChat from "@/pages/StartChat";
import Team from "@/pages/Team";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Analytics from "@/pages/Analytics";
import AgentAssists from "@/components/communications/AgentAssists";

const AppRoutes = () => (
  <Routes>
 <Route path="/" element={<Navigate to="/welcome" replace />} />
    <Route path="/welcome" element={<Welcome />} />
    <Route path="/dashboard" element={<Dashboard />} />
    {/* <Route path="/newcall" element={<NewCall />} /> */}
    <Route path="/composeemail" element={<ComposeEmail />} />
    <Route path="/customers" element={<Customers />} />
    <Route path="/communications" element={<Communications />} />
    <Route path="/startchat" element={<StartChat />} />
    <Route path="/team" element={<Team />} />
    <Route path="/knowledgebase" element={<KnowledgeBase />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/agentassists" element={<AgentAssists />} />
  </Routes>
);

export default AppRoutes;
