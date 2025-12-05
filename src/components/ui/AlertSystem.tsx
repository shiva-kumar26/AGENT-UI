import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface AlertSystemProps {
  agentId?: string;
}

export default function AlertSystem({ agentId }: AlertSystemProps) {
  const [hasAlert, setHasAlert] = useState(false);
  const [alertData, setAlertData] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    const fetchAlert = async () => {
      try {
        const res = await axios.get(`/api/agent-alert/${agentId}`);
        const data = res.data;

        const currentHasAlert = data?.has_alert === true;
        const currentAlertId = data?.alert_id ?? null;

        setHasAlert(currentHasAlert);
        setAlertData(data);

        // ✅ ✅ READ LAST ALERT ID FROM LOCALSTORAGE
        const lastPlayedAlertId = localStorage.getItem(
          `last_alert_${agentId}`
        );

        // ✅ ✅ PLAY SOUND ONLY FOR BRAND NEW ALERT
        if (
          currentHasAlert &&
          currentAlertId &&
          String(currentAlertId) !== lastPlayedAlertId
        ) {
          const audio = new Audio("/bell.wav");
          audio.play().catch(() => {
            console.log("Browser blocked autoplay");
          });

          // ✅ SAVE THIS ALERT AS LAST PLAYED
          localStorage.setItem(
            `last_alert_${agentId}`,
            String(currentAlertId)
          );
        }
      } catch (err) {
        console.error("Alert fetch failed", err);
      }
    };

    fetchAlert(); // check once immediately
    const interval = setInterval(fetchAlert, 5000);

    return () => clearInterval(interval);
  }, [agentId]);

  return (
    <div className="relative">
      {/* 🔔 Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />

        {/* 🔴 Red Dot */}
        {hasAlert && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* ✅ Alert Popup */}
      {open && hasAlert && alertData && (
        <div className="absolute right-0 mt-3 w-[420px] bg-white dark:bg-gray-900 border shadow-2xl rounded-xl p-6 z-50">
          <h4 className="font-bold text-lg mb-3 text-red-600">
            🚨 Low QA Score Alert
          </h4>

          <p className="text-sm mb-2">
            <b>Call ID:</b> {alertData.call_id}
          </p>

          <p className="text-xs mb-1">
            <b>Score:</b> {alertData.calculated_score}%
          </p>

          <div className="text-sm mt-3">
            <b>Issues:</b>
            <ul className="list-disc list-inside">
              {Object.keys(alertData.improvements || {}).map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            {new Date(alertData.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
