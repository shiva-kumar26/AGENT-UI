import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import axios from "axios";
import { backendConfig } from "@/config/config";
import { AuthContext } from "./AuthContext";


// In @Dashboard.tsx uding the agent interactions data, render the total calls and completed calls where completed 
// ✅ Type Definition (Updated to match CDR API)
export interface Interaction {
    uuid: string;
    caller_id: string; // was caller
    destination_number: string; // was callee
    direction: string;
    start_time: string; // was created_date
    end_time: string | null;
    answer_time: string | null;
    duration: number;
    billsec: number;
    name: string | null;
    queue: string | null;
    // Computed or legacy helpers
    disposition?: string;
}

interface InteractionContextType {
    interactions: Interaction[];
    agentInteractions: Interaction[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    lastUpdated: Date | null;
}

export const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const InteractionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { auth } = useContext(AuthContext);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchInteractions = async () => {
        try {
            setError(null);

            // Using the new CDR Reports API
            const response = await axios.get(backendConfig.cdrReports);
            if (response.data?.data) {
                console.log("[InteractionContext] Received data sample:", response.data.data.slice(0, 3));
            }

            let data = response.data;
            if (data && !Array.isArray(data) && Array.isArray(data.data)) {
                // Handle case where API returns { data: [...] }
                data = data.data;
            }

            if (!Array.isArray(data)) {
                console.warn("[InteractionContext] Received non-array data:", data);
                setInteractions([]);
            } else {
                setInteractions(data);
            }
            setLastUpdated(new Date());
        } catch (err: any) {
            console.error("Failed to fetch interactions:", err);
            setError(err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    // Initial load + interval
    useEffect(() => {
        fetchInteractions();
        const interval = setInterval(fetchInteractions, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Filter for the logged-in agent
    const agentInteractions = React.useMemo(() => {
        if (!auth?.userId) return [];
        if (!Array.isArray(interactions)) return [];

        const filtered = interactions.filter(
            (i) => i.caller_id === auth.userId || i.destination_number === auth.userId
        );

        console.log(`[InteractionContext] Agent (${auth.userId}) Interactions Count:`, filtered.length);
        if (filtered.length > 0) {
            console.log("[InteractionContext] Sample Interaction:", filtered[0]);
        }

        return filtered;
    }, [interactions, auth?.userId]);

    const value = {
        interactions,
        agentInteractions,
        loading,
        error,
        refresh: fetchInteractions,
        lastUpdated
    };

    return (
        <InteractionContext.Provider value={value}>
            {children}
        </InteractionContext.Provider>
    );
};

export const useInteractions = () => {
    const context = useContext(InteractionContext);
    if (context === undefined) {
        throw new Error("useInteractions must be used within an InteractionProvider");
    }
    return context;
};
