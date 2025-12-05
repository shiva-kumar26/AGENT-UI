import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmailDetailViewer({ interaction, customer }) {
  return (
    <Card className="bg-white h-full flex flex-col shadow-lg border-slate-200">
      <CardHeader className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
              <Mail className="text-blue-600" />
              Email Details
            </CardTitle>
            {/* <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {customer.first_name} {customer.last_name}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Received: {new Date(interaction.created_date).toLocaleString()}
              </span>
            </div> */}
          </div>
          <Badge
            variant={
              interaction.status === "completed" ? "default" : "destructive"
            }
            className="capitalize"
          >
            {interaction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800">Subject</h3>
            <p className="text-slate-600 mt-1">
              {interaction.subject || "No Subject"}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Body</h3>
            <div
              className="prose prose-sm max-w-none mt-2 p-4 border rounded-lg bg-slate-50"
              dangerouslySetInnerHTML={{
                __html: interaction.summary || "No content.",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
