import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ChatDetailViewer({ interaction, customer }) {
  return (
    <Card className="bg-white h-full flex flex-col shadow-lg border-slate-200">
      <CardHeader className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
              <MessageSquare className="text-blue-600" />
              Chat Transcript
            </CardTitle>
            {/* <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {customer.first_name} {customer.last_name}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration: {(interaction.duration / 60).toFixed(0)}m{" "}
                {interaction.duration % 60}s
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
          <div className="flex justify-start">
            <div className="bg-slate-100 p-3 rounded-lg max-w-md">
              <p className="font-semibold text-sm text-slate-800">
                {customer.first_name}
              </p>
              <p className="text-slate-700">
                Hi, I need help with my recent order.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white p-3 rounded-lg max-w-md">
              <p className="font-semibold text-sm">Agent</p>
              <p>
                Certainly, I can help with that. Could you please provide the
                order number?
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
