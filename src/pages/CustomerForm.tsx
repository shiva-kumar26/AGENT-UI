import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { backendConfig } from "@/config/config"; // ✅ Import config


type CustomerFormProps = {
  isEdit?: boolean;
  customerForm: any;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean; // ✅ Add loading state
};


export default function CustomerForm({
  isEdit = false,
  customerForm,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false, // ✅ Default to false
}: CustomerFormProps) {
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);


  // 🧠 Initialize summary when customerForm.latest_summary changes
  useEffect(() => {
    setSummary(customerForm?.latest_summary || "");
  }, [customerForm?.latest_summary]);


  // ✅ FIXED: Use config + proper error handling
  const handleSaveSummary = async () => {
    if (!customerForm?.id) {
      console.error("❌ Missing customer_id for update");
      alert("Cannot save summary: Customer ID not found");
      return;
    }


    setSaving(true);
    try {
      // ✅ Use config instead of hard-coded URL
      const url = `${backendConfig.baseURL}${backendConfig.customers}/${customerForm.id}`;
      console.log("[SAVE-SUMMARY] Updating:", url);


      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: customerForm.first_name,
          last_name: customerForm.last_name,
          email: customerForm.email,
          phone: customerForm.phone,
          company: customerForm.company,
          job_title: customerForm.job_title,
          status: customerForm.status,
          preferred_contact: customerForm.preferred_contact,
          latest_summary: summary, // ✅ Update summary
        }),
      });


      if (res.ok) {
        const data = await res.json();
        console.log("✅ Customer summary updated:", data);
        onChange("latest_summary", data.latest_summary || summary);
        alert("Summary saved successfully!");
      } else {
        const errorText = await res.text();
        console.error("❌ Failed to update customer:", errorText);
        alert(`Error saving summary: ${res.status} - ${errorText}`);
      }
    } catch (err: any) {
      console.error("[SAVE-SUMMARY] Error:", err);
      alert(`Error saving summary: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };


  // ✅ FIXED: Update summary in parent form before submission
  const handleSubmit = () => {
    console.log("[FORM-SUBMIT] Submitting form...");
    
    // If summary exists, update it in parent form first
    if (isEdit && summary) {
      onChange("latest_summary", summary);
    }
    
    // Then call the parent's onSubmit
    onSubmit();
  };


  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
      {/* 🧾 Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={customerForm.first_name || ""}
            onChange={(e) => onChange("first_name", e.target.value)}
            placeholder="John"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={customerForm.last_name || ""}
            onChange={(e) => onChange("last_name", e.target.value)}
            placeholder="Doe"
            disabled={isLoading}
          />
        </div>
      </div>


      {/* 📨 Contact Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={customerForm.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="john@example.com"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={customerForm.phone || ""}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
          />
        </div>
      </div>


      {/* 🏢 Company Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={customerForm.company || ""}
            onChange={(e) => onChange("company", e.target.value)}
            placeholder="Acme Corp"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job_title">Job Title</Label>
          <Input
            id="job_title"
            value={customerForm.job_title || ""}
            onChange={(e) => onChange("job_title", e.target.value)}
            placeholder="Manager"
            disabled={isLoading}
          />
        </div>
      </div>


      {/* 🟢 Status & Preferred Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={customerForm.status || "Active"}
            onValueChange={(v) => onChange("status", v)}
            disabled={isLoading}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferred_contact">Preferred Contact</Label>
          <Select
            value={customerForm.preferred_contact || "Phone"}
            onValueChange={(v) => onChange("preferred_contact", v)}
            disabled={isLoading}
          >
            <SelectTrigger id="preferred_contact">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Phone">Phone</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* 🧩 Post Call Summary — only in edit mode */}
      {isEdit && (
        <div className="space-y-2 pt-2 border-t mt-4">
          <Label htmlFor="summary">Previous Call Summary</Label>
          <Textarea
            id="summary"
            placeholder="Add notes from previous calls..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="text-sm"
            disabled={isLoading || saving}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSummary}
              disabled={!customerForm?.id || saving || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white mt-2"
              type="button"
            >
              {saving ? "Saving..." : "Save Summary"}
            </Button>
          </div>
        </div>
      )}


      {/* 🔘 Form Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          onClick={onCancel}
          disabled={isLoading || saving}
          variant="outline"
          type="button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !customerForm.first_name ||
            !customerForm.last_name ||
            !customerForm.email ||
            !customerForm.phone ||
            isLoading ||
            saving
          }
          className="bg-blue-600 hover:bg-blue-700 text-white"
          type="button"
        >
          {isLoading ? "Saving..." : isEdit ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </div>
  );
}