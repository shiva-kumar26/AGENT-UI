import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Mail,
  Trash2,
  CheckCircle,
  X,
  Download,
  Paperclip,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { EmailContext } from "@/store/EmailContext";
import axios from "axios";


/* ================= TYPES ================= */


type EmailAttachment = {
  id: string;
  name: string;
  file?: File;
  data?: string;
  url?: string;
};


type AgentEmailTemplate = {
  template_id: number;
  name: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
};


type InboxEmail = {
  id: number;
  sender: string;
  sender_email: string;
  subject: string;
  body: string;
  created_at: string;
  is_read: boolean;
  status: string;
  assigned_agent?: string;
  assignment_status?: string;
  opened_by?: string;
  opened_at?: string;
};


type SentEmail = {
  id: number;
  recipient: string;
  recipient_email: string;
  subject: string;
  body: string;
  created_at: string;
  agent_name: string;
};


type EmailDetail = {
  id: number;
  sender: string;
  sender_email: string;
  subject: string;
  body: string;
  created_at: string;
  status: string;
  assigned_agent?: string;
  opened_by?: string;
  opened_at?: string;
  recipient?: any;
  cc_emails?: any;
  attachments?: any;
};


/* ================= UTILS ================= */


const emailsChanged = (prev: any[], next: any[]): boolean => {
  if (prev.length !== next.length) return true;
  return prev.some(
    (p, i) =>
      p.id !== next[i].id ||
      p.is_read !== next[i].is_read ||
      p.opened_by !== next[i].opened_by ||
      p.opened_at !== next[i].opened_at
  );
};


const sentEmailsChanged = (prev: any[], next: any[]): boolean => {
  if (prev.length !== next.length) return true;
  return prev.some((p, i) => p.id !== next[i].id);
};


/* ================= COMPONENT ================= */


export default function ComposeEmailPage() {
  const navigate = useNavigate();

  const {
    draft: emailData,
    updateDraft,
    clearDraft,
    setFromEmail,
  } = useContext<any>(EmailContext);

  const [templates, setTemplates] = useState<AgentEmailTemplate[]>([]);
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isComposeMaximized, setIsComposeMaximized] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [agentName, setAgentName] = useState<string>("");

  const prevInboxRef = useRef<InboxEmail[]>([]);
  const prevSentRef = useRef<SentEmail[]>([]);
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  /* ================= AUTH ================= */


  useEffect(() => {
    const authRaw = localStorage.getItem("auth");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      setAgentName(auth.userName);
    }
  }, []);


  /* ================= FETCH AGENT EMAIL ================= */


  const fetchAgentEmail = async () => {
    try {
      const res = await axios.get(
        `http://10.16.7.91:8899/agent/${agentName}/email-queues`
      );

      if (Array.isArray(res.data) && res.data.length > 0) {
        const agentEmail = res.data[0];
        setFromEmail(agentEmail);
        updateDraft("from", agentEmail);
        console.log("Agent email set to:", agentEmail);
      }
    } catch (err) {
      console.error("Failed to fetch agent email", err);
    }
  };


  /* ================= INITIAL LOAD ================= */


  useEffect(() => {
    if (!agentName) return;

    loadInboxEmails(true);
    loadSentEmails(true);
    loadTemplates();
    fetchAgentEmail();

    const interval = setInterval(() => {
      loadInboxEmails(true);
      loadSentEmails(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [agentName]);


  const loadInboxEmails = async (silent = false) => {
    if (!agentName) return;

    try {
      if (!silent) setLoadingInbox(true);

      const response = await axios.get(
        `http://10.16.7.91:8899/get-agent-inbox/${agentName}`
      );
      if (response.data?.emails) {
        const newEmails = response.data.emails;
        const prevEmails = prevInboxRef.current;

        if (emailsChanged(prevEmails, newEmails)) {
          setInboxEmails(newEmails);
          prevInboxRef.current = newEmails;
        }
      }
    } catch (error) {
      console.error("Failed to load inbox:", error);
    } finally {
      if (!silent) setLoadingInbox(false);
    }
  };


  const loadSentEmailDetail = async (emailId: number) => {
    try {
      setLoadingDetail(true);

      const response = await axios.get(
        `http://10.16.7.91:8899/get-sent-email-detail/${emailId}`
      );

      if (response.data) {
        setSelectedEmail({
          ...response.data,
          created_at: response.data.sent_at,
          status: "sent",
          sender_email: response.data.sender,
        });

        setIsComposeOpen(false);
      }
    } catch (error) {
      console.error("Failed to load sent email detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };


  const loadSentEmails = async (silent = false) => {
    if (!agentName) return;

    try {
      if (!silent) setLoadingSent(true);

      const response = await axios.get(
        `http://10.16.7.91:8899/get-agent-sent-mails/${agentName}`
      );
      if (response.data?.emails) {
        const newEmails = response.data.emails;
        const prevEmails = prevSentRef.current;

        if (sentEmailsChanged(prevEmails, newEmails)) {
          setSentEmails(newEmails);
          prevSentRef.current = newEmails;
        }
      }
    } catch (error) {
      console.error("Failed to load sent emails:", error);
    } finally {
      if (!silent) setLoadingSent(false);
    }
  };


  const fetchFileAsBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };


  const loadEmailDetail = async (emailId: number) => {
    if (!agentName) return;

    try {
      setLoadingDetail(true);
      const response = await axios.get(
        `http://10.16.7.91:8899/get-email-detail/${emailId}?agent_name=${agentName}`
      );

      if (response.data) {
        setSelectedEmail(response.data);
        await assignEmailToAgent(emailId);
        await loadInboxEmails(false);
      }
    } catch (error) {
      console.error("Failed to load email detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };


  const loadTemplates = async () => {
    try {
      const response = await axios.get("https://10.16.7.96/api/email_templates/");
      const normalized = (response.data || []).map(
        (t: any): AgentEmailTemplate => ({
          template_id: t.template_id,
          name: t.name ?? "",
          subject: t.subject ?? "",
          body: t.body ?? "",
          attachments: Array.isArray(t.attachments) ? t.attachments : [],
        })
      );
      setTemplates(normalized);
    } catch (e) {
      console.error("Failed to load templates:", e);
    }
  };


  const assignEmailToAgent = async (emailId: number) => {
    if (!agentName) return;
    try {
      await axios.post(
        `http://10.16.7.91:8899/assign-email/${emailId}?agent_name=${agentName}`
      );
    } catch (error) {
      console.error("Failed to assign email:", error);
    }
  };


  const markEmailAsRead = async (emailId: number) => {
    try {
      await axios.post(`http://10.16.7.91:8899/mark-email-read/${emailId}`);
      const filtered = inboxEmails.filter((e) => e.id !== emailId);
      setInboxEmails(filtered);
      prevInboxRef.current = filtered;
      setSelectedEmail(null);
    } catch (error) {
      console.error("Failed to mark email as read:", error);
    }
  };


  const deleteEmail = async (emailId: number) => {
    try {
      await axios.post(`http://10.16.7.91:8899/delete-email/${emailId}`);
      const filtered = inboxEmails.filter((e) => e.id !== emailId);
      setInboxEmails(filtered);
      prevInboxRef.current = filtered;
      setSelectedEmail(null);
      alert("Email deleted!");
    } catch (error) {
      console.error("Failed to delete email:", error);
    }
  };


  const handleSendEmail = async () => {
    if (!agentName) {
      alert("Agent not logged in!");
      return;
    }

    if (!emailData.from || emailData.from.trim() === "") {
      alert("⚠️ Agent email not loaded! Please refresh.");
      return;
    }

    if (!emailData.to || emailData.to.trim() === "") {
      alert("⚠️ Please enter recipient email!");
      return;
    }

    if (!emailData.subject || emailData.subject.trim() === "") {
      alert("⚠️ Please enter email subject!");
      return;
    }

    try {
      const senderEmail = emailData.from.trim();

      const attachments = [];

      for (const att of emailData.attachments || []) {
        if (att.file instanceof File) {
          const base64 = await fileToBase64(att.file);
          attachments.push({
            name: att.name,
            data: base64,
          });
        } else if (att.data) {
          attachments.push({
            name: att.name,
            data: att.data,
          });
        }
      }

      const payload = {
        sender: senderEmail,
        recipient: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        cc: emailData.cc || "",
        attachments: attachments,
        date: new Date().toISOString(),
        agent_name: agentName,
      };

      await axios.post("http://10.16.7.91:8899/send-email", payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (selectedEmail) {
        await axios.post(
          `http://10.16.7.91:8899/mark-email-replied/${selectedEmail.id}`
        );
        const filtered = inboxEmails.filter((e) => e.id !== selectedEmail.id);
        setInboxEmails(filtered);
        prevInboxRef.current = filtered;
      }

      alert(`✅ Email sent by ${agentName}!`);
      clearDraft();
      setSelectedEmail(null);
      setIsComposeOpen(false);
      setIsComposeMaximized(false);
      setActiveTab("inbox");

      await loadInboxEmails(true);
      await loadSentEmails(true);
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("❌ Failed to send email. Please try again.");
    }
  };


  const openCompose = () => {
    setSelectedEmail(null);
    setIsComposeOpen(true);
    setIsComposeMaximized(false);
  };


  const handleReplyToEmail = (email: EmailDetail) => {
    updateDraft("to", email.sender_email);
    updateDraft("subject", `Re: ${email.subject}`);

    if (email.attachments) {
      updateDraft(
        "attachments",
        email.attachments.map((a: any) => ({
          id: Math.random().toString(),
          name: a.file_name || a.name,
          data: a.data,
        }))
      );
    }

    setIsComposeOpen(true);
    setIsComposeMaximized(false);
  };


  const handleUseTemplate = async (template: AgentEmailTemplate) => {
    const resolvedAttachments = [];

    for (const att of template.attachments || []) {
      if (att.url) {
        const base64 = await fetchFileAsBase64(att.url);

        resolvedAttachments.push({
          id: crypto.randomUUID(),
          name: att.name,
          data: base64,
        });
      }
    }

    updateDraft("subject", template.subject);
    updateDraft("body", template.body);
    updateDraft("attachments", resolvedAttachments);

    setActiveTab("inbox");
    setIsComposeOpen(true);
    setIsComposeMaximized(false);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
    });
  };


  const downloadAttachment = (attachment: any) => {
    if (attachment.data) {
      try {
        const link = document.createElement("a");
        link.href = `data:${
          attachment.content_type || "application/octet-stream"
        };base64,${attachment.data}`;
        link.download = attachment.file_name || attachment.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        alert("Failed to download attachment");
      }
    }
  };


  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments = [];

    for (const file of Array.from(files)) {
      const base64 = await fileToBase64(file);

      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        data: base64,
      });
    }

    updateDraft("attachments", [
      ...(emailData.attachments || []),
      ...newAttachments,
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const removeAttachment = (id: string) => {
    const filtered = (emailData.attachments || []).filter(
      (att: any) => att.id !== id
    );
    updateDraft("attachments", filtered);
  };


  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link", "image"],
      ["clean"],
    ],
  };


  const getStatusBadge = (email: InboxEmail) => {
    if (email.opened_by === agentName) return "🔴 YOU";
    if (email.opened_by) return `Opened by 🟡 ${email.opened_by}`;
    return "🟢 NEW";
  };


  if (!agentName) {
    return <div className="p-6 text-center">Loading agent info...</div>;
  }


  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="w-full h-full flex flex-col border border-gray-200">
        {/* HEADER */}
        <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Mail className="w-5 h-5" />
              Email System - {agentName}
            </div>
            <Button
              size="sm"
              onClick={openCompose}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ✉️ New Mail
            </Button>
          </div>
        </div>

        {/* TABS */}
        <div className="border-b border-gray-200 flex-shrink-0 bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full rounded-none border-0">
              <TabsTrigger
                value="inbox"
                className="rounded-none border-r border-gray-200"
              >
                📬 Inbox ({inboxEmails.length})
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                className="rounded-none border-r border-gray-200"
              >
                ✉️ Sent ({sentEmails.length})
              </TabsTrigger>
              <TabsTrigger value="templates" className="rounded-none">
                📋 Templates
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            {/* INBOX TAB */}
            <TabsContent value="inbox" className="h-full m-0">
              <div className="flex h-full">
                <div
                  className={`w-full bg-white overflow-y-auto transition-all duration-300 ${
                    isComposeOpen ? "w-full md:w-1/2" : "w-full"
                  }`}
                >
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Auto-refresh: 2s (Silent)
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadInboxEmails(false)}
                      disabled={loadingInbox}
                    >
                      {loadingInbox ? "Loading..." : "Refresh Now"}
                    </Button>
                  </div>

                  {loadingInbox ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Loading emails...</p>
                    </div>
                  ) : inboxEmails.length > 0 ? (
                    <div className="space-y-0 p-2">
                      {inboxEmails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-4 hover:bg-gray-100 cursor-pointer transition-all border-l-4 ${
                            selectedEmail?.id === email.id
                              ? "border-blue-500 bg-blue-50"
                              : email.opened_by === agentName
                              ? "border-red-500 bg-red-50"
                              : email.opened_by
                              ? "border-yellow-500 bg-yellow-50"
                              : "border-green-500 bg-green-50"
                          }`}
                          onClick={() => loadEmailDetail(email.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {email.sender}
                              </p>
                              <p className="text-sm text-gray-700 font-medium truncate">
                                {email.subject}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                {email.body.replace(/<[^>]*>/g, "")}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDate(email.created_at)}
                              </p>
                            </div>
                            <span className="text-xs font-bold whitespace-nowrap">
                              {getStatusBadge(email)}
                            </span>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadEmailDetail(email.id);
                                handleReplyToEmail({
                                  ...email,
                                  attachments: [],
                                } as EmailDetail);
                              }}
                            >
                              💬 Reply
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-semibold">
                        ✅ All caught up!
                      </p>
                    </div>
                  )}
                </div>

                {!isComposeOpen && selectedEmail && (
                  <div className="w-full md:w-1/2 border-l border-gray-200 bg-white overflow-y-auto">
                    <div className="p-6 space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold">
                            {selectedEmail.subject}
                          </h2>
                          <div className="mt-4 space-y-2 text-sm text-gray-600">
                            {selectedEmail.status === "sent" ? (
                              <p>
                                <strong>To:</strong>{" "}
                                {Array.isArray(selectedEmail.recipient)
                                  ? selectedEmail.recipient[0]
                                  : selectedEmail.recipient}
                              </p>
                            ) : (
                              <p>
                                <strong>From:</strong>{" "}
                                {selectedEmail.sender} &lt;
                                {selectedEmail.sender_email}&gt;
                              </p>
                            )}

                            <p>
                              <strong>Date:</strong>{" "}
                              {new Date(
                                selectedEmail.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEmail(null)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                      />

                      {selectedEmail.attachments &&
                        selectedEmail.attachments.length > 0 && (
                          <div className="border-t pt-6">
                            <h3 className="font-semibold mb-3">
                              📎 Attachments (
                              {selectedEmail.attachments.length})
                            </h3>
                            <div className="grid gap-3">
                              {selectedEmail.attachments.map(
                                (att: any, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between bg-gray-50 p-3 rounded"
                                  >
                                    <span className="truncate">
                                      {att.file_name || att.name}
                                    </span>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        downloadAttachment(att)
                                      }
                                    >
                                      Download
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      <div className="flex gap-3">
                        <Button
                          onClick={() =>
                            handleReplyToEmail(selectedEmail)
                          }
                        >
                          💬 Reply
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            markEmailAsRead(selectedEmail.id)
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Mark
                          Read
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm("Delete permanently?"))
                              deleteEmail(selectedEmail.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* SENT TAB */}
            <TabsContent value="sent" className="h-full m-0 bg-white">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Sent Emails (Auto-refresh: 2s Silent)
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSentEmails(false)}
                    disabled={loadingSent}
                  >
                    {loadingSent ? "Loading..." : "Refresh"}
                  </Button>
                </div>

                {loadingSent ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading sent emails...</p>
                  </div>
                ) : sentEmails.length > 0 ? (
                  <div className="overflow-y-auto flex-1">
                    <div className="space-y-0 p-2">
                      {sentEmails.map((email) => (
                        <div
                          key={email.id}
                          className="p-4 hover:bg-gray-100 cursor-pointer transition-all border-l-4 border-purple-500 bg-purple-50"
                          onClick={() => loadSentEmailDetail(email.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                To: {email.recipient_email || email.recipient}
                              </p>
                              <p className="text-sm text-gray-700 font-medium truncate">
                                {email.subject}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                {email.body.replace(/<[^>]*>/g, "")}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDate(email.created_at)}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-purple-700">
                              SENT
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-semibold">
                      No sent emails yet.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TEMPLATES TAB */}
            <TabsContent value="templates" className="h-full m-0 p-6 overflow-y-auto bg-gray-50">
              <h2 className="text-2xl font-bold mb-8 text-gray-800">
                Email Templates
              </h2>

              {templates.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card
                      key={template.template_id}
                      className="hover:shadow-xl transition-shadow duration-300 border border-gray-200"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {template.name || "Untitled Template"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Subject:</strong>
                          </p>
                          <p className="text-sm bg-gray-100 px-3 py-2 rounded border">
                            {template.subject || "No subject"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Preview:</strong>
                          </p>
                          <div
                            className="text-sm prose prose-sm max-w-none bg-gray-50 p-4 rounded border min-h-20"
                            dangerouslySetInnerHTML={{
                              __html:
                                template.body || "<em>No content</em>",
                            }}
                          />
                        </div>

                        {template.attachments &&
                          template.attachments.length > 0 && (
                            <div className="pt-3 border-t">
                              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                Attachments (
                                {template.attachments.length})
                              </p>
                              <div className="space-y-2">
                                {template.attachments.map(
                                  (att, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded border border-blue-200"
                                    >
                                      <span className="text-lg">
                                        📄
                                      </span>
                                      <span className="truncate flex-1">
                                        {att.name ||
                                          att.file_name ||
                                          "Unknown file"}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <Button
                          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                          onClick={() =>
                            handleUseTemplate(template)
                          }
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-lg">
                    No templates available at this time.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* COMPOSE PANEL */}
          <div
            className={`fixed inset-y-0 right-0 w-full md:w-1/2 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
              isComposeOpen ? "translate-x-0" : "translate-x-full"
            } ${isComposeMaximized ? "md:w-full" : ""}`}
          >
            <div className="h-full flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex justify-between items-center shadow-md">
                <h2 className="text-2xl font-bold text-white">
                  Compose Email
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setIsComposeMaximized(!isComposeMaximized)
                    }
                    className="text-white hover:bg-white/20"
                  >
                    {isComposeMaximized ? (
                      <Minimize2 className="w-5 h-5" />
                    ) : (
                      <Maximize2 className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Discard draft?")) {
                        clearDraft();
                        setIsComposeOpen(false);
                        setIsComposeMaximized(false);
                      }
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>From</Label>
                      <Input
                        value={emailData.from || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Loading agent email..."
                      />
                    </div>
                    <div>
                      <Label>
                        To <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={emailData.to || ""}
                        onChange={(e) =>
                          updateDraft("to", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Cc</Label>
                    <Input
                      value={emailData.cc || ""}
                      onChange={(e) =>
                        updateDraft("cc", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={emailData.subject || ""}
                      onChange={(e) =>
                        updateDraft("subject", e.target.value)
                      }
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label>Message</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <ReactQuill
                        ref={quillRef}
                        value={emailData.body || ""}
                        onChange={(v) => updateDraft("body", v)}
                        modules={modules}
                        className="bg-white h-96"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments (
                      {emailData.attachments?.length || 0})
                    </Label>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                      >
                        <Paperclip className="w-4 h-4 mr-2" />{" "}
                        Attach Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileAttach}
                        className="hidden"
                      />
                    </div>
                    {emailData.attachments?.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {emailData.attachments.map((att: any) => (
                          <div
                            key={att.id}
                            className="bg-gray-100 p-4 rounded border flex items-center justify-between"
                          >
                            <span className="truncate text-sm">
                              {att.name}
                              {att.file && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (
                                  {Math.round(
                                    att.file.size / 1024
                                  )}{" "}
                                  KB)
                                </span>
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeAttachment(att.id)
                              }
                              className="text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-4 border-t pt-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        if (confirm("Discard draft?")) {
                          clearDraft();
                          setIsComposeOpen(false);
                          setIsComposeMaximized(false);
                        }
                      }}
                    >
                      Discard
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleSendEmail}
                      disabled={
                        !emailData.to ||
                        !emailData.subject ||
                        !emailData.from
                      }
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BACKDROP */}
          {isComposeOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => {
                if (confirm("Close compose?")) {
                  clearDraft();
                  setIsComposeOpen(false);
                  setIsComposeMaximized(false);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
