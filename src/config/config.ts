// config.ts - FINAL PRODUCTION VERSION (Nov 2025)
// → Old Agent App SAFE
// → Knowledge Base FULLY WORKING & ISOLATED
// → No duplicate interceptors, no header overwrites, no broken agent list

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

//
// ORIGINAL USER CONFIG (unchanged)
//
const userConfig = {
  sip: "sip:",
  webSocketServerURL: "wss://10.16.7.91:7443/ws",
};

export const agentStatus = [
  "Available",
  "On Break",
  "Available (On Demand)",
  "Logged Out",
];

export const dbConfig = {
  baseURL: "https://10.16.7.202:3000",
  emailTemplates: "email-templates",
  knowledgeArticles: "knowledge-articles",
  customers: "customers",
  interactions: "interactions",
};

//
// BACKEND CONFIG — CRITICAL FIX APPLIED HERE
//
export const backendConfig = {
  baseURL: "https://10.16.7.96",
  loginEndPoint: "/login/authenticate_Login_and_users",
  logoutEndPoint: "/login/logout",
  updateAgent: "/api/directory_search",
  setAgentStatus: "/Set-Agent-Status",
  getAgentStatus: "/Get-Agent-Status",

  // CRITICAL: OLD APP USES THIS
  agents: "/api/agents",                        // OLD AGENT UI (MUST stay)
  directorySearch: "/api/directory_search",     // NEW KB + Admin uses this

  queueName: "/api/api/queue_tests/1",
  customers: "/api/customers/",
  callInteractions: "/api/interactions/",
  port: ":5050",
};

export default userConfig;

//
// MAIN API — Used by Agent Portal, Calls, Customers, etc.
// → Only main auth (attachAuth) is applied elsewhere in your code
//
export const mainApi = axios.create({
  baseURL: dbConfig.baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
// attachAuth(mainApi); ← This is done correctly in your auth module, leave it there

//
// KNOWLEDGE BASE API — Completely isolated
//
export const kbApi = axios.create({
  // Production KB backend
  baseURL: "https://10.16.7.96:8083",
  // For local development uncomment below:
  // baseURL: "http://localhost:8083",

  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 90000, // large file uploads need this
});

// ================= MEMORY-ONLY KB AUTH SESSION =================
export const KBAuthSession = {
  token: null as string | null,
  role: null as "admin" | "agent" | null,
  userId: null as string | null,
  extension: null as string | null,

  set(data: { token: string; role: "admin" | "agent"; userId: string; extension?: string }) {
    this.token = data.token;
    this.role = data.role;
    this.userId = data.userId;
    this.extension = data.extension || null;
  },

  clear() {
    this.token = null;
    this.role = null;
    this.userId = null;
    this.extension = null;
  },

  isValid() {
    return !!this.userId && !!this.role;
  },
};

// ================= ONLY KB AUTH INTERCEPTOR (NO DUPLICATES) =================
const attachKBOnlyAuth = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (KBAuthSession.isValid()) {
      // ✅ FIXED: Use .set() to preserve AxiosHeaders instance (avoids TS error on plain object assignment)
      // Safe for Axios 1.0+ (2025 standard); no spread needed
      config.headers.set("X-User-Id", KBAuthSession.userId!);
      config.headers.set("X-User-Role", KBAuthSession.role!);
      config.headers.set(
        "X-Extension",
        KBAuthSession.extension ?? KBAuthSession.userId!
      );
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Optional: redirect to login only from KB pages
        console.error("KB 401 → session expired");
      }
      return Promise.reject(error);
    }
  );
};

// APPLY ONLY KB AUTH — NEVER attachAuth() here!
attachKBOnlyAuth(kbApi);

// Optional helper for KB re-login
export const triggerKBReauthentication = () => {
  KBAuthSession.clear();
  if (typeof window !== "undefined") {
    window.location.href = "/login?reason=kb_session_expired";
  }
};