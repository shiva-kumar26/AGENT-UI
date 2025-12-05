import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone, ArrowLeft, X, Minus } from "lucide-react";
import { CallContext } from "../components/calls/CallProvider";
 
interface NewCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
 
export default function NewCallDialog({
  open,
  onOpenChange,
}: NewCallDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const { startCall } = useContext(CallContext);
 
  useEffect(() => {
    if (!open) setIsMinimized(false);
  }, [open]);
 
  const dialPadNumbers = [
    { num: "1", letters: "" },
    { num: "2", letters: "ABC" },
    { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" },
    { num: "5", letters: "JKL" },
    { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" },
    { num: "8", letters: "TUV" },
    { num: "9", letters: "WXYZ" },
    { num: "*", letters: "+" },
    { num: "0", letters: "" },
    { num: "#", letters: "" },
  ];
 
  const quickDialContacts = [
    { name: "Support Line", number: "+1-800-555-0123" },
    { name: "Sales Team", number: "+1-800-555-0456" },
  ];
 
  const handleNumberClick = (num: string) =>
    setPhoneNumber((prev) => prev + num);
  const handleClear = () => setPhoneNumber("");
  const handleBackspace = () => setPhoneNumber((prev) => prev.slice(0, -1));
  const handleQuickDial = (number: string) => setPhoneNumber(number);
 
  const handleCall = () => {
    if (phoneNumber) {
      // Start outbound call with active state immediately
      startCall(
        {
          name: `Outbound Call`,
          number: phoneNumber,
          direction: "Outbound",
        },
        "ringing"
      );
 
      // Close dialog and reset form
      onOpenChange(false);
      setPhoneNumber("");
    }
  };
 
  const handleMinimize = () => {
    setIsMinimized(true);
  };
 
  const handleClose = () => {
    onOpenChange(false);
    setPhoneNumber(""); // Reset form when closing
    setIsMinimized(false);
  };
 
  if (!open) return null;
 
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 left-5 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
        >
          <Phone className="w-6 h-6" />
        </Button>
      </div>
    );
  }
 
  return (
    <Dialog open={open} onOpenChange={handleMinimize}>
      <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Make Call
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} title="Minimize">
                <Minus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose} title="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
 
        <div className="space-y-6">
          <div className="text-center">
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="text-center text-lg h-12 border-2"
            />
          </div>
 
          <div className="grid grid-cols-3 gap-4">
            {dialPadNumbers.map((item) => (
              <Button
                key={item.num}
                variant="outline"
                className="h-12 flex flex-col justify-center hover:bg-blue-50"
                onClick={() => handleNumberClick(item.num)}
              >
                <span className="text-lg font-semibold">{item.num}</span>
                {/* {item.letters && (
                  <span className="text-[10px] text-gray-500">
                    {item.letters}
                  </span>
                )} */}
              </Button>
            ))}
          </div>
 
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackspace}
              disabled={!phoneNumber}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
 
            <Button
              onClick={handleCall}
              disabled={!phoneNumber}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
 
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!phoneNumber}
            >
              Clear
            </Button>
          </div>
 
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Quick Dial</h3>
            {quickDialContacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleQuickDial(contact.number)}
              >
                <div>
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.number}</p>
                </div>
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
 
 