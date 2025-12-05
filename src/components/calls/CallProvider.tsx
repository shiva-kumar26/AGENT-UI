import React, { createContext, useState } from "react";

export const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [callState, setCallState] = useState("idle");
  const [activeCallDetails, setActiveCallDetails] = useState(null);
  const [transferCall, setTransferCall] = useState(false);
  const [conferenceCall, setConferenceCall] = useState(false);
  const [transferContextNumber, setTransferContextNumber] = useState(null);
  const [conferenceContextNumber, setConferenceContextNumber] = useState(null);

  const startCall = (details, initialState = "active") => {
    setActiveCallDetails(details);
    setCallState("ringing");
  };

  const endCall = () => {
    setCallState("idle");
    setActiveCallDetails(null);
    setTransferCall(false);
    setConferenceCall(false);
    setTransferContextNumber(null);
    setConferenceContextNumber(null);
  };

  const answerCall = () => {
    console.log("callState", callState);
    // if (callState === "ringing") {
    setCallState("active");
    // }
  };

  const rejectCall = () => {
    if (callState === "ringing") {
      endCall();
    }
  };

  const value = {
    callState,
    startCall,
    endCall,
    answerCall,
    rejectCall,
    activeCallDetails,
    setActiveCallDetails,
    transferCall,
    setTransferCall,
    transferContextNumber,
    setTransferContextNumber,
    conferenceCall,
    setConferenceCall,
    conferenceContextNumber,
    setConferenceContextNumber,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
