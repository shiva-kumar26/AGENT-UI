import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Send, Upload } from "lucide-react";
import EmailTemplate from "@/entities/EmailTemplate";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createPageUrl } from "@/utils/utils";
import { EmailContext } from "@/store/EmailContext";
import axios from "axios";
import { dbConfig } from "@/config/config";

export default function ComposeEmailPage() {
  const navigate = useNavigate();
  // const [emailData, setEmailData] = useState({
  //   from: "agent@company.com",
  //   to: "",
  //   cc: "",
  //   subject: "",
  //   body: "",
  // });
  const {
    draft: emailData,
    updateDraft,
    clearDraft,
  } = useContext(EmailContext);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState("compose");
  const quillRef = useRef(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    // try {
    //   const list = await EmailTemplate.list();
    //   setTemplates(list);
    // } catch (e) {
    //   console.error("Failed to load templates:", e);
    // }

    try {
      const response = await axios.get(
        `${dbConfig.baseURL}/${dbConfig.emailTemplates}`
      );
      // console.log("email-templates response", response.data);
      setTemplates(response.data);
    } catch (e) {
      console.error("Failed to load templates:", e);
    }
  };

  const handleInputChange = (field, value) =>
    // setEmailData((prev) => ({ ...prev, [field]: value }));
    updateDraft(field, value);

  const handleSendEmail = () => {
    alert(`Email sent to ${emailData.to}`);
    clearDraft();
    navigate(createPageUrl("Dashboard"));
  };

  const handleSaveDraft = () => {
    alert("Draft saved!");
  };

  const useTemplate = (template) => {
    // setEmailData((prev) => ({
    //   ...prev,
    //   subject: template.subject,
    //   body: template.content,
    // }));
    updateDraft("subject", template.subject);
    updateDraft("body", template.content);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex justify-center items-start">
      <Card className="w-full max-w-5xl shadow-lg">
        <CardHeader className=" flex items-center justify-between">
          {/* <div className="flex items-center gap-3"> */}
          {/* <Button variant="ghost" size="icon" onClick={() => navigate(-1)}> */}
          {/* <ArrowLeft className="w-4 h-4" /> */}
          {/* </Button> */}
          {/* <CardTitle>Compose Email</CardTitle> */}
          {/* </div> */}
          {/* <div className="flex gap-2"> */}
          {/* <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button> */}
          {/* </div> */}
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

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
                    onChange={(e) => handleInputChange("to", e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>

              <div>
                <Label>Cc</Label>
                <Input
                  value={emailData.cc}
                  onChange={(e) => handleInputChange("cc", e.target.value)}
                />
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <ReactQuill
                  ref={quillRef}
                  value={emailData.body}
                  onChange={(value) => handleInputChange("body", value)}
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

            <TabsContent value="templates" className="space-y-4">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
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
                    <div
                      className="text-sm text-gray-700 prose prose-sm"
                      dangerouslySetInnerHTML={{
                        __html: template.content,
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
