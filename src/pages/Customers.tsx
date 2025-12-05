import React, { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Filter,
  Users,
  Mail,
  Phone,
  Briefcase,
  Phone as PhoneIcon,
  X,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { backendConfig } from "@/config/config";
import axios from "axios";
import CustomerForm from "./CustomerForm";
import { CallContext } from "@/components/calls/CallProvider";
import { WebSocketEventContext } from "@/store/WebSocketEventContext";

type CustomerFormType = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  status: "Active" | "Inactive";
  preferred_contact: "Phone" | "Email" | "SMS";
  latest_summary?: string;
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // ✅ RESTORE selectedCustomer from sessionStorage on mount
  const [selectedCustomer, setSelectedCustomer] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem("selectedCustomer");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerForm, setCustomerForm] = useState<CustomerFormType>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    job_title: "",
    status: "Active",
    preferred_contact: "Phone",
  });

  // ✅ Track active call customer (empty string when no active call)
  const [activeCallCustomer, setActiveCallCustomer] = useState<string>("");

  // ✅ Track last called customer - restored from sessionStorage on mount
  const [lastCalledCustomer, setLastCalledCustomer] = useState<string>(() => {
    try {
      return sessionStorage.getItem("lastCalledCustomer") || "";
    } catch {
      return "";
    }
  });

  // ✅ Track if call is currently active (to prevent clearing selectedCustomer)
  const [isCallActive, setIsCallActive] = useState(false);

  const { activeCallDetails, startCall } = useContext(CallContext);
  const context = useContext(WebSocketEventContext);
  const latestEvent = context?.latestEvent;

  const location = useLocation();
  const incomingPhoneNumber = location.state?.incomingPhoneNumber;
  const incomingHandledRef = useRef<string | null>(null);
  const pendingCallRef = useRef<string | null>(null);

  // ✅ PERSIST selectedCustomer to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (selectedCustomer) {
        sessionStorage.setItem("selectedCustomer", JSON.stringify(selectedCustomer));
        console.log(`[STORAGE] Saved selectedCustomer: ${selectedCustomer.first_name}`);
      } else {
        sessionStorage.removeItem("selectedCustomer");
      }
    } catch {
      console.error("[STORAGE] Failed to save selectedCustomer");
    }
  }, [selectedCustomer]);

  // ✅ Save lastCalledCustomer to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (lastCalledCustomer) {
        sessionStorage.setItem("lastCalledCustomer", lastCalledCustomer);
        console.log(
          `[STORAGE] Saved lastCalledCustomer: ${lastCalledCustomer}`
        );
      }
    } catch {
      console.error("[STORAGE] Failed to save to sessionStorage");
    }
  }, [lastCalledCustomer]);

  // ✅ PRIORITY 1: Load all customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(
        `${backendConfig.baseURL}${backendConfig.customers}`
      );
      setCustomers(response.data);
      console.log(`[CUSTOMERS] Loaded ${response.data.length} customers`);
      setCustomersLoaded(true);

      // ✅ If there's a pending incoming call, process it NOW
      if (pendingCallRef.current) {
        console.log(
          `[INCOMING] Processing pending call: ${pendingCallRef.current}`
        );
        processIncomingCall(pendingCallRef.current, response.data);
        pendingCallRef.current = null;
      }
    } catch (e) {
      console.error("Failed to load customers:", e);
      setCustomersLoaded(true);
    }
  };

  // ✅ PRIORITY 2: Handle incoming phone number
  useEffect(() => {
    if (!incomingPhoneNumber) return;

    // Don't process same call twice
    if (incomingHandledRef.current === incomingPhoneNumber) {
      console.log(`[INCOMING] Call already handled: ${incomingPhoneNumber}`);
      return;
    }

    console.log(
      `[INCOMING] New incoming call: ${incomingPhoneNumber}, customersLoaded: ${customersLoaded}`
    );

    // ✅ If customers already loaded, process immediately
    if (customersLoaded) {
      processIncomingCall(incomingPhoneNumber, customers);
      incomingHandledRef.current = incomingPhoneNumber;
      setActiveCallCustomer(incomingPhoneNumber); // ✅ Set active call
      setLastCalledCustomer(incomingPhoneNumber); // ✅ Remember this customer
      setIsCallActive(true); // ✅ Mark call as active
    } else {
      // ✅ If NOT loaded yet, save as pending and wait for loadCustomers
      console.log(
        `[INCOMING] Customers not loaded yet, saving as pending...`
      );
      pendingCallRef.current = incomingPhoneNumber;
      incomingHandledRef.current = incomingPhoneNumber;
    }

    // Clear location state after handling
    setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 500);
  }, [incomingPhoneNumber, customersLoaded, customers, navigate, location.pathname]);

  // ✅ Listen for WebSocket events to track active calls
  useEffect(() => {
    if (!latestEvent) return;

    const caller = latestEvent.Caller || latestEvent["Caller-ID-Number"] || "";
    const callEvent = latestEvent.Event || latestEvent.EventName || "";

    console.log(`[WEBSOCKET] Call event: ${callEvent}, Caller: ${caller}`);

    if (callEvent === "CHANNEL_ANSWER" || callEvent === "CHANNEL_BRIDGE") {
      // Call answered - set as active and move to top
      setActiveCallCustomer(caller);
      setLastCalledCustomer(caller);
      setIsCallActive(true); // ✅ Mark call as active
      console.log(`[WEBSOCKET] ✅ Call active for: ${caller}`);
    } else if (callEvent === "CHANNEL_HANGUP") {
      // Call ended - clear active
      setActiveCallCustomer("");
      setIsCallActive(false); // ✅ Mark call as ended
      console.log(`[WEBSOCKET] ❌ Call ended`);
    }
  }, [latestEvent]);

  // ✅ CRITICAL: Only clear when call truly ends (activeCallDetails becomes null)
  useEffect(() => {
    if (!activeCallDetails && isCallActive) {
      // Call has ended - NOW clear everything
      console.log("[CUSTOMERS] Call ended - clearing selected customer");
      incomingHandledRef.current = null;
      setActiveCallCustomer("");
      setSelectedCustomer(null); // ✅ CLEAR only when call ends
      setLastCalledCustomer(""); // ✅ Reset
      setIsCallActive(false); // ✅ Mark as inactive
      
      // ✅ Reload customer list to refresh data
      if (!showAddDialog && !showEditDialog) {
        loadCustomers();
      }
    }
  }, [activeCallDetails, isCallActive, showAddDialog, showEditDialog]);

  // ✅ PROCESS INCOMING CALL (Core Logic)
  const processIncomingCall = (phoneNumber: string, customersList: any[]) => {
    console.log(`[INCOMING-PROCESS] Processing call for: ${phoneNumber}`);

    // Normalize phone number for matching (trim spaces, remove extra chars)
    const normalizedIncoming = phoneNumber.trim();

    // Find matching customer
    const match = customersList.find((c) => {
      const normalizedCustomerPhone = String(c.phone).trim();
      return normalizedCustomerPhone === normalizedIncoming;
    });

    console.log(`[INCOMING-PROCESS] Match found: ${match ? "YES" : "NO"}`);

    if (match) {
      // ✅ Customer exists - show details panel
      console.log(
        `[INCOMING-PROCESS] Opening customer: ${match.first_name} ${match.last_name}`
      );
      setSelectedCustomer(match);
      setCustomerForm({ ...match });
    } else {
      // ✅ Customer doesn't exist - show add dialog
      console.log(`[INCOMING-PROCESS] No match found, opening add dialog`);
      resetForm();
      setCustomerForm((prev) => ({ ...prev, phone: normalizedIncoming }));
      setShowAddDialog(true);
    }
  };

  // ✅ Update both customerForm + selectedCustomer
  const handleFormChange = (field: string, value: any) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));

    // Update the right panel instantly when editing
    if (selectedCustomer && showEditDialog) {
      setSelectedCustomer((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setCustomerForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      job_title: "",
      status: "Active",
      preferred_contact: "Phone",
      latest_summary: "",
    });
  };

  const handleAddCustomer = async () => {
    try {
      const response = await axios.post(
        `${backendConfig.baseURL}${backendConfig.customers}`,
        customerForm
      );
      
      // ✅ ADD new customer to existing list (don't reload all)
      setCustomers((prevCustomers) => [...prevCustomers, response.data]);
      console.log(`[ADD] New customer added to list`);
      
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleEditCustomer = async () => {
    try {
      const response = await axios.put(
        `${backendConfig.baseURL}${backendConfig.customers}/${selectedCustomer.id}`,
        customerForm
      );
      
      // ✅ UPDATE customer in existing list (don't reload all)
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === selectedCustomer.id ? response.data : c
        )
      );
      console.log(`[EDIT] Customer updated in list`);
      
      setShowEditDialog(false);
      setSelectedCustomer((prev: any) => ({ ...prev, ...customerForm }));
      resetForm();
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const openEditDialog = (customer: any) => {
    setCustomerForm({ ...customer });
    setShowEditDialog(true);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const makeCall = (phone: string) => {
    startCall(
      {
        name: `Outbound Call`,
        number: phone,
        direction: "Outbound",
      },
      "ringing"
    );
  };

  const filteredCustomers = customers.filter((c: any) =>
    Object.values(c).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // ✅ SMART SORTING: Active/Last called customer always at TOP
  const sortedCustomers = (() => {
    const sortByPhone = activeCallCustomer || lastCalledCustomer;

    if (!sortByPhone) {
      return filteredCustomers;
    }

    const phoneDigits = String(sortByPhone || "")
      .trim()
      .replace(/\D/g, "");

    if (!phoneDigits) {
      return filteredCustomers;
    }

    const calledCustomers = filteredCustomers.filter((c: any) => {
      const customerPhoneDigits = String(c.phone || "")
        .trim()
        .replace(/\D/g, "");
      return customerPhoneDigits === phoneDigits;
    });

    const otherCustomers = filteredCustomers.filter((c: any) => {
      const customerPhoneDigits = String(c.phone || "")
        .trim()
        .replace(/\D/g, "");
      return customerPhoneDigits !== phoneDigits;
    });

    return [...calledCustomers, ...otherCustomers];
  })();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // ✅ Customer detail view with summary
  const CustomerDetailView = ({ customer, onEdit }: any) => {
    if (!customer)
      return (
        <Card className="h-full flex items-center justify-center bg-gray-50/50">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">
              Select a Customer
            </h3>
            <p className="text-sm text-gray-500">
              Choose a customer from the list to see details.
            </p>
          </div>
        </Card>
      );

    // Check if this customer is on an active call
    const customerPhoneDigits = String(customer.phone || "")
      .trim()
      .replace(/\D/g, "");
    const activePhoneDigits = String(activeCallCustomer || "")
      .trim()
      .replace(/\D/g, "");
    const isOnCall =
      customerPhoneDigits === activePhoneDigits && activePhoneDigits !== "";

    return (
      <AnimatePresence>
        <Card className="max-h-[82vh] h-auto shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Customer Details
              {/* ✅ Show "On Call" badge only when on active call */}
              {isOnCall && (
                <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                  <PhoneIcon className="w-3 h-3 mr-1" /> On Call
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(customer)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                  isOnCall ? "bg-red-100" : "bg-blue-100"
                }`}
              >
                <span
                  className={`text-3xl font-bold ${
                    isOnCall ? "text-red-700" : "text-blue-700"
                  }`}
                >
                  {customer.first_name?.[0]}
                  {customer.last_name?.[0]}
                </span>
              </div>
              <h3 className="text-xl font-bold">
                {customer.first_name} {customer.last_name}
              </h3>
              <Badge className={`mt-2 ${getStatusColor(customer.status)}`}>
                {customer.status}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{customer.email}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{customer.company}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Details</h4>
              <div className="text-sm space-y-2">
                <p>
                  <span className="font-medium text-gray-600">Job:</span>{" "}
                  {customer.job_title}
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    Preferred Contact:
                  </span>{" "}
                  {customer.preferred_contact}
                </p>
              </div>
            </div>

            {/* ✅ Summary now reflects instantly */}
            {customer.latest_summary && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Previous Call Summary</h4>
                <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-700 leading-relaxed">
                  {customer.latest_summary}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatePresence>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex">
      <div className={`flex-1 transition-all duration-300 ${showAddDialog || showEditDialog ? "mr-96" : ""}`}>
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Customers</h1>
            <Button
              onClick={openAddDialog}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
            {/* Left Table */}
            <div
              className={`${
                selectedCustomer ? "col-span-5" : "col-span-12"
              } h-full`}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search customers by name, email, company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button variant="outline" className="ml-4">
                      <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  <Table>
                    <TableBody>
                      {/* ✅ Use sortedCustomers - called customer stays at TOP */}
                      {sortedCustomers.map((customer: any) => {
                        const customerPhoneDigits = String(customer.phone || "")
                          .trim()
                          .replace(/\D/g, "");
                        const activePhoneDigits = String(activeCallCustomer || "")
                          .trim()
                          .replace(/\D/g, "");
                        const isOnCall =
                          customerPhoneDigits === activePhoneDigits &&
                          activePhoneDigits !== "";

                        return (
                          <TableRow
                            key={customer.id}
                            onClick={() => setSelectedCustomer(customer)}
                            className={`cursor-pointer hover:bg-gray-50 ${
                              selectedCustomer?.id === customer.id
                                ? "bg-blue-50"
                                : ""
                            } ${
                              isOnCall ? "bg-red-50 border-l-4 border-red-500" : ""
                            }`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isOnCall ? "bg-red-100" : "bg-blue-100"
                                  }`}
                                >
                                  <span
                                    className={`font-semibold ${
                                      isOnCall
                                        ? "text-red-700"
                                        : "text-blue-700"
                                    }`}
                                  >
                                    {customer.first_name?.[0]}
                                    {customer.last_name?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      {customer.first_name} {customer.last_name}
                                    </p>
                                    {/* ✅ Show pulsing phone icon only when on call */}
                                    {isOnCall && (
                                      <PhoneIcon className="w-3 h-3 text-red-500 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {customer.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(customer.status)}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel */}
            {selectedCustomer && (
              <div className="col-span-7 h-full">
                <CustomerDetailView
                  customer={selectedCustomer}
                  onEdit={openEditDialog}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ FIXED RIGHT SIDE PANEL (ALWAYS VISIBLE WHEN OPEN) */}
      {(showAddDialog || showEditDialog) && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl border-l overflow-y-auto z-40">
          {/* ✅ Header with close button */}
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {showAddDialog ? "Add New Customer" : "Edit Customer"}
            </h2>
            <button
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ✅ Form content */}
          <div className="p-4">
            <CustomerForm
              isEdit={showEditDialog}
              customerForm={customerForm}
              onChange={handleFormChange}
              onCancel={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
              onSubmit={
                showAddDialog ? handleAddCustomer : handleEditCustomer
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}