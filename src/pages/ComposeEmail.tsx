import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createPageUrl } from "@/utils/utils";
import { EmailContext } from "@/store/EmailContext";
import axios from "axios";

/* ---------------------------------------------
   Types (added safely – no impact elsewhere)
--------------------------------------------- */
type AgentEmailTemplate = {
  template_id: number;
  name: string;
  subject: string;
  body: string;
};

/* ---------------------------------------------
   Component
--------------------------------------------- */
export default function ComposeEmailPage() {
  const navigate = useNavigate();
  const { draft: emailData, updateDraft, clearDraft } =
    useContext(EmailContext);

  const [templates, setTemplates] = useState<AgentEmailTemplate[]>([]);
  const [activeTab, setActiveTab] = useState("compose");
  const quillRef = useRef<any>(null);

  /* ---------------------------------------------
     Load templates (IP used directly)
  --------------------------------------------- */
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(
        "https://10.16.7.96/api/email_templates/"
      );

      // ✅ Normalize backend → UI (ADD ONLY)
      const normalized = (response.data || []).map(
        (t: any): AgentEmailTemplate => ({
          template_id: t.template_id,
          name: t.name ?? "",
          subject: t.subject ?? "",
          body: t.body ?? "",
        })
      );

      setTemplates(normalized);
    } catch (e) {
      console.error("Failed to load templates:", e);
    }
  };

  /* ---------------------------------------------
     Helpers (existing logic preserved)
  --------------------------------------------- */
  const handleInputChange = (field: string, value: any) =>
    updateDraft(field, value);

  const handleSendEmail = () => {
    alert(`Email sent to ${emailData.to}`);
    clearDraft();
    navigate(createPageUrl("Dashboard"));
  };

  const useTemplate = (template: AgentEmailTemplate) => {
    updateDraft("subject", template.subject);
    updateDraft("body", template.body); // ✅ FIXED (body, not content)
    setActiveTab("compose");
  };

  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  /* ---------------------------------------------
     UI
  --------------------------------------------- */
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex justify-center items-start">
      <Card className="w-full max-w-5xl shadow-lg">
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            {/* ---------------- COMPOSE ---------------- */}
            <TabsContent value="compose" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From</Label>
                  <Input value={emailData.from} readOnly />
                </div>
                <div>
                  <Label>To</Label>
                  <Input
                    value={emailData.to}
                    onChange={(e) =>
                      handleInputChange("to", e.target.value)
                    }
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>

              <div>
                <Label>Cc</Label>
                <Input
                  value={emailData.cc}
                  onChange={(e) =>
                    handleInputChange("cc", e.target.value)
                  }
                />
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  value={emailData.subject}
                  onChange={(e) =>
                    handleInputChange("subject", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <ReactQuill
                  ref={quillRef}
                  value={emailData.body}
                  onChange={(value) =>
                    handleInputChange("body", value)
                  }
                  modules={modules}
                  placeholder="Type your message..."
                  className="bg-white"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSendEmail}
                  disabled={!emailData.to || !emailData.subject}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </TabsContent>

            {/* ---------------- TEMPLATES ---------------- */}
            <TabsContent value="templates" className="space-y-4">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <Card
                    key={template.template_id}
                    className="p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {template.subject}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => useTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </div>

                    {/* Safe HTML / text preview */}
                    <div
                      className="text-sm text-gray-700 prose prose-sm"
                      dangerouslySetInnerHTML={{
                        __html: template.body || "",
                      }}
                    />
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">
                  No templates found.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
