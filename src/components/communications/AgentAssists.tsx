import React, { useContext, useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AuthContext } from "@/store/AuthContext";
import { CallContext } from "@/components/calls/CallProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, FileText, Smile, BarChart3, BookOpen } from "lucide-react";

type SentimentType = string | { label: string; score?: number };
type TranscriptMessage = {
  speaker: "Agent" | "Customer";
  text: string;
  time?: string;
  sentiment?: SentimentType;
};

const STORAGE_KEY = "AgentAssists:activeCallData";
const CLEAR_AFTER_SUMMARY_MS = 5000;

export default function AgentAssists() {
  const { auth } = useContext(AuthContext);
  const { activeCallDetails } = useContext(CallContext);
  const wsRef = useRef<WebSocket | null>(null);

  const [liveTranscript, setLiveTranscript] = useState<TranscriptMessage[]>([]);
  const [keyPhrases, setKeyPhrases] = useState<string[]>([]);
  const [postCallSummary, setPostCallSummary] = useState<string>("");
  const [sentimentChartData, setSentimentChartData] = useState<
    { name: string; value: number }[]
  >([]);
  const [sentimentScore, setSentimentScore] = useState<number>(0);
  const [sentimentLabel, setSentimentLabel] = useState<string>("No Data");
  const [currentPartial, setCurrentPartial] = useState<{
    speaker: string;
    text: string;
  } | null>(null);

  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [isPostCallComplete, setIsPostCallComplete] =
    useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableSummary, setEditableSummary] = useState<string>("");

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const sentimentIdxRef = useRef<number>(0);
  const summaryClearTimeoutRef = useRef<number | null>(null);

  const formatGrammar = (text: string): string => {
    if (!text) return "";
    text = text.trim();
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const formatted = sentences
      .map((sentence) => {
        let s = sentence.trim();
        if (!s) return "";
        s = s.charAt(0).toUpperCase() + s.slice(1);
        if (!/[.!?]$/.test(s)) s += ".";
        return s;
      })
      .filter((s) => s.length > 0)
      .join(" ");
    return formatted;
  };

  const saveToSession = () => {
    const payload = {
      liveTranscript,
      keyPhrases,
      postCallSummary,
      sentimentChartData,
      sentimentScore,
      sentimentLabel,
      isCallActive,
      isPostCallComplete,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save session", e);
    }
  };

  const loadFromSession = () => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setLiveTranscript(data.liveTranscript || []);
      setKeyPhrases(data.keyPhrases || []);
      setPostCallSummary(data.postCallSummary || "");
      setEditableSummary(data.postCallSummary || "");
      setSentimentChartData(data.sentimentChartData || []);
      setSentimentScore(
        typeof data.sentimentScore === "number" ? data.sentimentScore : 0
      );
      setSentimentLabel(data.sentimentLabel || "No Data");
      setIsCallActive(!!data.isCallActive);
      setIsPostCallComplete(!!data.isPostCallComplete);

      if (
        Array.isArray(data.sentimentChartData) &&
        data.sentimentChartData.length > 0
      ) {
        const last = data.sentimentChartData[data.sentimentChartData.length - 1];
        const parsed = Number(last?.name);
        sentimentIdxRef.current = Number.isFinite(parsed)
          ? parsed
          : data.sentimentChartData.length;
      }
    } catch (e) {
      console.warn("Failed to parse saved session, clearing it.", e);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearSession = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const normalizeSentiment = (label?: string, score?: number) => {
    const s = typeof score === "number" ? score : 0.5;
    const l = (label || "").toLowerCase();
    if (l === "positive") return Math.min(1, 0.5 + s / 2);
    if (l === "negative") return Math.max(0, 0.5 - s / 2);
    return 0.5;
  };

  const mapNumericSentimentToLabelScore = (
    num?: number
  ): { label: string; score?: number } => {
    if (typeof num !== "number" || Number.isNaN(num))
      return { label: "Neutral", score: 0.5 };
    if (num >= -1 && num <= 1) {
      if (num >= 0 && num <= 1) {
        const score = Math.abs(num - 0.5) * 2;
        if (num < 0.5) return { label: "Negative", score };
        if (num > 0.5) return { label: "Positive", score };
        return { label: "Neutral", score: 0.5 };
      } else {
        const score = Math.abs(num);
        if (num < 0) return { label: "Negative", score };
        if (num > 0) return { label: "Positive", score };
        return { label: "Neutral", score: 0.5 };
      }
    }
    return { label: "Neutral", score: 0.5 };
  };

  useEffect(() => {
    loadFromSession();
  }, []);

  useEffect(() => {
    if (isCallActive || !isPostCallComplete) {
      saveToSession();
    }
  }, [
    liveTranscript,
    keyPhrases,
    postCallSummary,
    sentimentChartData,
    sentimentScore,
    sentimentLabel,
    isCallActive,
    isPostCallComplete,
  ]);

  useEffect(() => {
    const fetchPreviousSummary = async () => {
      try {
        if (activeCallDetails?.number && !postCallSummary) {
          const response = await fetch(
            `/api/get-summary/${encodeURIComponent(
              activeCallDetails.number
            )}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.summary) {
              setPostCallSummary(data.summary);
              setEditableSummary(data.summary);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching previous summary:", err);
      }
    };
    fetchPreviousSummary();
  }, [activeCallDetails?.number, postCallSummary]);

  useEffect(() => {
    if (!auth) return;
    const agentId = (auth as any).agentId || (auth as any).userId;
    if (!agentId) return;

    const WEBSOCKET_URL = `wss://10.16.7.130:2700/transcripts?agentId=${agentId}`;
    const ws = new WebSocket(WEBSOCKET_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const text = (event.data || "").toString().trim();
        if (!text) return;
        if (text.startsWith("<!DOCTYPE")) return;
        const data = JSON.parse(text);

        if (data.type === "call_start") {
          clearSession();
          if (summaryClearTimeoutRef.current) {
            window.clearTimeout(summaryClearTimeoutRef.current);
            summaryClearTimeoutRef.current = null;
          }
          setIsCallActive(true);
          setIsPostCallComplete(false);
          setLiveTranscript([]);
          setKeyPhrases([]);
          setPostCallSummary("");
          setEditableSummary("");
          setSentimentChartData([]);
          setSentimentScore(0.5);
          setSentimentLabel("Neutral");
          setCurrentPartial(null);
          sentimentIdxRef.current = 0;
          return;
        }

        if (data.type === "call_end") {
          setIsCallActive(false);
          setCurrentPartial(null);
          return;
        }

        const messages = Array.isArray(data) ? data : [data];

        messages
          .filter(
            (m: any) =>
              m.type === "transcript" && m.message_type === "partial"
          )
          .forEach((m: any) => {
            const speaker = m.speaker || "Speaker";
            const text = m.partial || "";
            setCurrentPartial({ speaker, text });
          });

        const mappedTranscripts: TranscriptMessage[] = [];
        messages
          .filter(
            (m: any) =>
              m && m.type === "transcript" && m.message_type === "final"
          )
          .forEach((m: any) => {
            const speaker = m.speaker === "Agent" ? "Agent" : "Customer";
            let text = m.final || m.text || "";
            text = formatGrammar(text);
            const time = m.timestamp
              ? new Date(Number(m.timestamp) * 1000).toLocaleTimeString()
              : undefined;
            const sentiment = m.sentiment;
            const last = mappedTranscripts[mappedTranscripts.length - 1];
            if (last && last.speaker === speaker) {
              last.text += " " + text;
              last.time = time;
              last.sentiment = sentiment;
            } else {
              mappedTranscripts.push({ speaker, text, time, sentiment });
            }
          });

        if (mappedTranscripts.length > 0) {
          setLiveTranscript((prev) => {
            const updated = [...prev];
            mappedTranscripts.forEach((msg) => {
              const last = updated[updated.length - 1];
              if (last && last.speaker === msg.speaker) {
                last.text += " " + msg.text;
                last.time = msg.time;
                last.sentiment = msg.sentiment;
              } else {
                updated.push(msg);
              }
            });
            return updated;
          });

          const latest = mappedTranscripts[mappedTranscripts.length - 1];
          let label = "";
          let score: number | undefined;

          if (typeof latest.sentiment === "string") {
            label = latest.sentiment;
          } else if (
            latest.sentiment &&
            typeof latest.sentiment === "object"
          ) {
            label = latest.sentiment.label;
            score = latest.sentiment.score;
          } else if (typeof latest.sentiment === "number") {
            const m = mapNumericSentimentToLabelScore(
              latest.sentiment as number
            );
            label = m.label;
            score = m.score;
          }

          const val = normalizeSentiment(label, score);
          setSentimentScore(val);
          setSentimentLabel(label || "Neutral");
          setSentimentChartData((prev) => {
            const idx = sentimentIdxRef.current + 1;
            sentimentIdxRef.current = idx;
            const next = [...prev, { name: String(idx), value: val }];
            return next.length > 9 ? next.slice(next.length - 9) : next;
          });
        }

        const topicsMsg =
          messages.find(
            (m: any) =>
              m && m.type === "key_topics" && Array.isArray(m.topics)
          ) ||
          messages.find(
            (m: any) =>
              m &&
              m.type === "transcript" &&
              Array.isArray(m.keyphrases)
          );
        if (topicsMsg) {
          setKeyPhrases(topicsMsg.topics || topicsMsg.keyphrases || []);
        }

        const summaryMsg = messages.find(
          (m: any) =>
            m &&
            (m.type === "summary" || m.type === "post_call") &&
            (m.summary ||
              m.keywords ||
              typeof m.sentiment !== "undefined")
        );

        if (summaryMsg) {
          const summaryText = summaryMsg.summary || "";
          handlePostCallSummary(summaryText);

          if (Array.isArray(summaryMsg.keywords)) {
            setKeyPhrases(summaryMsg.keywords);
          } else if (Array.isArray(summaryMsg.keyphrases)) {
            setKeyPhrases(summaryMsg.keyphrases);
          }

          if (typeof summaryMsg.sentiment === "number") {
            const mapped = mapNumericSentimentToLabelScore(
              summaryMsg.sentiment
            );
            const normalizedVal = normalizeSentiment(
              mapped.label,
              mapped.score
            );
            setSentimentScore(normalizedVal);
            setSentimentLabel(mapped.label || "Neutral");
            setSentimentChartData((prev) => {
              const idx = sentimentIdxRef.current + 1;
              sentimentIdxRef.current = idx;
              const next = [
                ...prev,
                { name: String(idx), value: normalizedVal },
              ];
              return next.length > 9
                ? next.slice(next.length - 9)
                : next;
            });
          }

          setIsPostCallComplete(true);

          if (summaryClearTimeoutRef.current) {
            window.clearTimeout(summaryClearTimeoutRef.current);
            summaryClearTimeoutRef.current = null;
          }

          summaryClearTimeoutRef.current = window.setTimeout(() => {
            clearSession();
            summaryClearTimeoutRef.current = null;
          }, CLEAR_AFTER_SUMMARY_MS);
        }
      } catch (e) {
        console.error("Invalid JSON in WebSocket message:", e, event.data);
      }
    };

    return () => {
      try {
        ws.close();
      } catch {
        //
      }
      wsRef.current = null;
    };
  }, [auth, activeCallDetails?.number]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveTranscript]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data.isCallActive && data.isPostCallComplete) {
        clearSession();
        setLiveTranscript([]);
        setKeyPhrases([]);
        setPostCallSummary("");
        setSentimentChartData([]);
        setSentimentScore(0);
        setSentimentLabel("No Data");
        setIsCallActive(false);
        setIsPostCallComplete(false);
      }
    } catch {
      clearSession();
    }
  }, []);

  const computeDistributionForSpeaker = (
    speaker: "Agent" | "Customer"
  ) => {
    const scores: number[] = liveTranscript
      .filter((m) => m.speaker === speaker && m.sentiment)
      .map((msg) => {
        if (typeof msg.sentiment === "string") {
          if (msg.sentiment === "Positive") return 0.9;
          if (msg.sentiment === "Negative") return 0.1;
          return 0.5;
        } else if (typeof msg.sentiment === "object") {
          if (typeof msg.sentiment.score === "number") {
            const s = msg.sentiment.score;
            return (s + 1) / 2;
          }
        } else if (typeof msg.sentiment === "number") {
          const mapped = mapNumericSentimentToLabelScore(
            msg.sentiment
          );
          return normalizeSentiment(mapped.label, mapped.score);
        }
        return 0.5;
      });

    const total = scores.length || 0;
    const neg = scores.filter((s) => s <= 0.33).length;
    const neu = scores.filter((s) => s > 0.33 && s < 0.66).length;
    const pos = scores.filter((s) => s >= 0.66).length;

    return {
      total,
      neg,
      neu,
      pos,
      negPct: total === 0 ? 0 : (neg / total) * 100,
      neuPct: total === 0 ? 0 : (neu / total) * 100,
      posPct: total === 0 ? 0 : (pos / total) * 100,
    };
  };

  const customerDist = computeDistributionForSpeaker("Customer");
  const agentDist = computeDistributionForSpeaker("Agent");

  const handlePostCallSummary = async (summaryText: string) => {
    const formattedSummary = formatGrammar(summaryText);
    setPostCallSummary(formattedSummary);
    setEditableSummary(formattedSummary);

    try {
      if (activeCallDetails?.number) {
        const response = await fetch(
          `/api/update-summary/${encodeURIComponent(
            activeCallDetails.number
          )}?summary=${encodeURIComponent(formattedSummary)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          console.error("Failed to update summary:", await response.text());
        }
      }
    } catch (err) {
      console.error("Error updating summary:", err);
    }
  };

  const handleSaveSummary = async () => {
    setPostCallSummary(editableSummary);
    setIsEditing(false);

    try {
      if (activeCallDetails?.number) {
        const response = await fetch(
          `/api/update-summary/${encodeURIComponent(
            activeCallDetails.number
          )}?summary=${encodeURIComponent(editableSummary)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          console.error("Failed to update edited summary:", await response.text());
        }
      }
    } catch (err) {
      console.error("Error saving edited summary:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditableSummary(postCallSummary);
    setIsEditing(false);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 via-sky-50 to-slate-50">
      <div className="h-full overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full mx-auto">
            {/* Header Card */}
            <Card className="bg-white border border-sky-200 rounded-3xl shadow-md mb-6">
              <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 rounded-t-3xl px-8 py-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                  <div className="p-2 bg-sky-100 rounded-full">
                    <Phone className="text-sky-600 w-6 h-6" />
                  </div>
                  Call Assistant
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1.65fr] gap-6 mb-6">
              {/* Left: Transcript */}
              <div className="flex flex-col h-full">
                <Card className="rounded-3xl shadow-md border border-sky-200 bg-white flex-1 flex flex-col min-h-0 overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 rounded-t-3xl px-7 py-5">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
                      <FileText className="text-sky-600 w-5 h-5" />
                      Live Call Transcription
                      <span className="ml-auto text-xs text-sky-600 font-semibold bg-sky-100 px-3 py-1 rounded-full">
                        {liveTranscript.length} messages
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="px-5 py-4 flex-1 flex flex-col min-h-0">
                    <div
                      className="flex flex-col gap-3 overflow-y-auto flex-1 pr-2 custom-scrollbar"
                      style={{ maxHeight: "450px" }}
                    >
                      {liveTranscript.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-sky-200 mx-auto mb-2" />
                            <p className="text-sky-300 font-medium">
                              No transcript yet.
                            </p>
                            <p className="text-sky-200 text-sm">
                              Waiting for call data...
                            </p>
                          </div>
                        </div>
                      ) : (
                        liveTranscript.map((msg, idx) => {
                          let sentimentText = "";
                          let sentimentScoreNum: number | undefined;
                          if (msg.sentiment) {
                            if (typeof msg.sentiment === "string") {
                              sentimentText = msg.sentiment;
                            } else if (typeof msg.sentiment === "object") {
                              sentimentText = msg.sentiment.label;
                              sentimentScoreNum = msg.sentiment.score;
                            } else if (typeof msg.sentiment === "number") {
                              sentimentText =
                                msg.sentiment > 0
                                  ? "Positive"
                                  : msg.sentiment < 0
                                  ? "Negative"
                                  : "Neutral";
                              sentimentScoreNum = Math.abs(msg.sentiment);
                            }
                          }
                          const label = sentimentText.toLowerCase();
                          const dotColor =
                            label === "positive"
                              ? "bg-emerald-500"
                              : label === "negative"
                              ? "bg-rose-500"
                              : "bg-amber-500";
                          const textColor =
                            label === "positive"
                              ? "text-emerald-700"
                              : label === "negative"
                              ? "text-rose-700"
                              : "text-amber-700";
                          const isAgent = msg.speaker === "Agent";

                          return (
                            <div
                              key={idx}
                              className={`flex ${
                                isAgent ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`p-4 max-w-[78%] rounded-2xl shadow-sm border ${
                                  isAgent
                                    ? "bg-sky-100 border-sky-200 rounded-tr-sm"
                                    : "bg-white border-slate-200 rounded-tl-sm"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-slate-800 text-sm">
                                    {msg.speaker}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {msg.time}
                                  </span>
                                </div>

                                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                  {msg.text}
                                  {currentPartial &&
                                    currentPartial.speaker === msg.speaker &&
                                    idx === liveTranscript.length - 1 && (
                                      <span className="text-gray-400 italic">
                                        {" "}
                                        {currentPartial.text}
                                      </span>
                                    )}
                                </div>

                                {sentimentText && (
                                  <div className="flex items-center gap-2 text-xs mt-3 pt-2 border-t border-slate-200">
                                    <span
                                      className={`w-2 h-2 rounded-full ${dotColor}`}
                                    />
                                    <span
                                      className={`${textColor} font-semibold`}
                                    >
                                      {label}
                                      {sentimentScoreNum !== undefined
                                        ? ` (${sentimentScoreNum.toFixed(2)})`
                                        : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}

                      <div ref={transcriptEndRef} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6 h-full">
                {/* Sentiment Analysis */}
                <Card className="rounded-3xl shadow-md border border-sky-200 bg-white hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 rounded-t-3xl px-7 py-5">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
                      <BarChart3 className="text-sky-600 w-5 h-5" />
                      Sentiment Analysis
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 bg-white">
                    <div className="flex flex-col gap-6">
                      {/* Chart & Gauge */}
                      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                        <div className="flex-1 min-w-0">
                          {sentimentChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={140}>
                              <LineChart
                                data={sentimentChartData}
                                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="6 6"
                                  stroke="#e0f2fe"
                                />
                                <XAxis
                                  dataKey="name"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                  domain={[0, 1]}
                                  ticks={[0, 0.5, 1]}
                                  axisLine={false}
                                  tickLine={false}
                                  width={60}
                                  tick={{ fontSize: 10 }}
                                  tickFormatter={(v) =>
                                    v === 0
                                      ? "Neg"
                                      : v === 0.5
                                      ? "Neu"
                                      : "Pos"
                                  }
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#f0f9ff",
                                    border: "1px solid #bae6fd",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(v: number) =>
                                    v === 0
                                      ? "Negative"
                                      : v === 0.5
                                      ? "Neutral"
                                      : v === 1
                                      ? "Positive"
                                      : `${(v * 100).toFixed(1)}%`
                                  }
                                />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#0284c7"
                                  strokeWidth={3}
                                  dot={{ r: 4, fill: "#0284c7" }}
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center text-sky-300 text-sm h-[140px] bg-sky-50 rounded-lg">
                              No sentiment data yet
                            </div>
                          )}
                        </div>

                        {/* Circular Gauge */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg
                              className="w-full h-full rotate-[-90deg]"
                              viewBox="0 0 56 56"
                            >
                              <circle
                                cx="28"
                                cy="28"
                                r="25"
                                fill="none"
                                stroke="#e0f2fe"
                                strokeWidth="5"
                              />
                              <circle
                                cx="28"
                                cy="28"
                                r="25"
                                fill="none"
                                stroke="#0284c7"
                                strokeWidth="5"
                                strokeDasharray={2 * Math.PI * 25}
                                strokeDashoffset={
                                  (1 -
                                    (sentimentChartData.length > 0
                                      ? sentimentScore
                                      : 0)) *
                                  2 *
                                  Math.PI *
                                  25
                                }
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-sky-700">
                                {sentimentChartData.length === 0
                                  ? "0.0%"
                                  : (sentimentScore * 100).toFixed(1) + "%"}
                              </span>
                              <span className="text-xs text-sky-600 font-semibold">
                                {sentimentChartData.length === 0
                                  ? "No Data"
                                  : sentimentLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Phrases */}
                      <div className="border-t border-sky-100 pt-6">
                        <h3 className="text-slate-800 font-bold text-sm mb-3">
                          Key Phrases
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {keyPhrases.length > 0 ? (
                            keyPhrases.map((phrase, idx) => (
                              <span
                                key={idx}
                                className="bg-sky-100 text-sky-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-sky-300 shadow-sm hover:bg-sky-200 transition-colors"
                              >
                                {phrase}
                              </span>
                            ))
                          ) : (
                            <span className="text-sky-300 text-xs italic">
                              No key phrases yet.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Distribution */}
                <Card className="rounded-3xl shadow-md border border-sky-200 bg-white hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 rounded-t-3xl px-7 py-5">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
                      <Smile className="text-sky-600 w-5 h-5" />
                      Sentiment Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-7 py-6">
                    <div className="space-y-6">
                      {(["Customer", "Agent"] as const).map((type) => {
                        const dist =
                          type === "Customer" ? customerDist : agentDist;
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-slate-800 font-semibold text-sm">
                                {type} Sentiment
                              </span>
                              <span className="text-xs text-slate-500 bg-sky-50 px-2 py-1 rounded">
                                Total: {dist.total}
                              </span>
                            </div>

                            <div className="h-5 bg-slate-100 rounded-full w-full relative overflow-hidden border border-slate-200">
                              <div
                                className="h-5 bg-rose-400 absolute left-0 top-0 hover:opacity-80 transition-opacity"
                                style={{ width: `${dist.negPct}%` }}
                                title={`Negative: ${dist.neg}`}
                              />
                              <div
                                className="h-5 bg-amber-400 absolute top-0 hover:opacity-80 transition-opacity"
                                style={{
                                  width: `${dist.neuPct}%`,
                                  left: `${dist.negPct}%`,
                                }}
                                title={`Neutral: ${dist.neu}`}
                              />
                              <div
                                className="h-5 bg-emerald-400 absolute top-0 hover:opacity-80 transition-opacity"
                                style={{
                                  width: `${dist.posPct}%`,
                                  left: `${dist.negPct + dist.neuPct}%`,
                                }}
                                title={`Positive: ${dist.pos}`}
                              />
                            </div>

                            <div className="flex justify-between text-xs text-slate-600 mt-2 font-semibold">
                              <span>
                                <span className="text-rose-600">●</span>{" "}
                                Negative: {dist.neg}
                              </span>
                              <span>
                                <span className="text-amber-600">●</span>{" "}
                                Neutral: {dist.neu}
                              </span>
                              <span>
                                <span className="text-emerald-600">●</span>{" "}
                                Positive: {dist.pos}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Post Call Summary */}
            <Card className="rounded-3xl shadow-md border border-sky-200 bg-white hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 rounded-t-3xl px-8 py-6">
                <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
                  <BookOpen className="text-sky-600 w-5 h-5" />
                  Post Call Summary
                  {isPostCallComplete && (
                    <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      ✓ Generated
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 py-7">
                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <textarea
                      className="w-full border border-sky-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-sky-50 font-medium"
                      rows={7}
                      value={editableSummary}
                      onChange={(e) => setEditableSummary(e.target.value)}
                    />
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 text-sm font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSummary}
                        className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-semibold shadow-md transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[140px]">
                    <div className="text-slate-700 text-sm leading-7 whitespace-pre-wrap bg-sky-50/50 rounded-xl p-5 border border-sky-100">
                      {postCallSummary || (
                        <span className="text-sky-300 italic">
                          No summary available yet.
                        </span>
                      )}
                    </div>
                    {postCallSummary && (
                      <div className="flex justify-end mt-5">
                        <button
                          onClick={() => {
                            setEditableSummary(postCallSummary);
                            setIsEditing(true);
                          }}
                          className="px-4 py-2 bg-sky-100 text-sky-700 border border-sky-300 rounded-lg hover:bg-sky-200 text-xs font-semibold transition-colors"
                        >
                          ✎ Edit Summary
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
