import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InteractionForm({
  interaction,
  customers,
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState(
    interaction || {
      customer_id: "",
      type: "call_outbound",
      subject: "",
      summary: "",
      status: "completed",
    }
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {interaction ? "Edit Interaction" : "Log New Interaction"}
          </DialogTitle>
          <DialogDescription>
            Fill out the interaction details and click Save.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(val) => handleChange("customer_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(val) => handleChange("type", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call_outbound">Outbound Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject / Title</Label>
            <Input
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Summary / Notes</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave(formData)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
