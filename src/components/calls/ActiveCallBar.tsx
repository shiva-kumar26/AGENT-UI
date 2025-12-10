import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  UserPlus,
  PhoneForwarded,
  PauseCircle,
  PlayCircle,
  Check,
  X,
  Merge,
} from "lucide-react";
import { CallContext } from "./CallProvider";
import { createPageUrl } from "@/utils/utils";
import { AuthContext } from "@/store/AuthContext";
import userConfig, { dbConfig, backendConfig } from "@/config/config";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Registerer, UserAgentOptions } from "sip.js";
import { SessionDescriptionHandler } from "sip.js/lib/platform/web";
import {
  Invitation,
  Inviter,
  Session,
  SessionState,
  UserAgent,
  Web,
} from "sip.js";

import { useAudio } from "@/pages/useAudio";
import { WebSocketEventContext } from "@/store/WebSocketEventContext";

// *************************************************************************************************************

export default function ActiveCallBar() {
  const navigate = useNavigate();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isConferencing, setIsConferencing] = useState(false);
  const [transferNumber, setTransferNumber] = useState("");
  const [conferenceNumber, setConferenceNumber] = useState("");

  const {
    callState,
    startCall,
    endCall,
    answerCall,
    rejectCall,
    activeCallDetails,
    setActiveCallDetails,
    setTransferCall,
    setConferenceCall,
    transferContextNumber,
    conferenceContextNumber,
  } = useContext(CallContext);

  const [isEstablished, setIsEstablished] = useState(false);
  const { auth, logout, login } = useContext(AuthContext);

  const generateUUID = () => crypto.randomUUID();

  // State variables
  let userAgent: UserAgent;
  let inviter: Inviter;
  let queueCall: any;
  let context: AudioContext;
  let isUserInteracted = false;
  let exstensionPhoneNumber: any;
  let incomingSessionEstablished = false;
  let outgoingSessionEstablished = false;
  let queueName = "";

  const [isAgentRegistered, setIsAgentRegistered] = useState<boolean>(false);
  const [incomingSessions, setIncomingSessions] = useState<Session[]>([]);
  const [outgoingSessions, setOutgoingSessions] = useState<Session[]>([]);

  const invitationRef = useRef<Invitation | null>(null);
  const outgoingSessionRef = useRef<Session | null>(null);
  const [usersAgents, setUserAgents] = useState<any>();
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);
  const [outgoingTone, setOutgoingTone] = useState<HTMLAudioElement | null>(
    null
  );

  const [localStream] = useState(new MediaStream());
  const [remoteStream] = useState(new MediaStream());
  const remoteMedia = useRef<HTMLAudioElement>(null);
  const localMedia = useRef<HTMLAudioElement>(null);

  const {
    audio: incomingAudio,
    play: playIncoming,
    stop: stopIncoming,
  } = useAudio("/audio/ringtone.mp3");

  const {
    audio: outgoingAudio,
    play: playOutgoing,
    stop: stopOutgoing,
  } = useAudio("/audio/outboundring.mp3");

  // *************************  Configuration  ********************

  const username = auth?.userId;
  const password = auth?.password;
  const ip = auth?.hostname;
  const serverURL = userConfig.webSocketServerURL;
  const sip = userConfig.sip;

  const events = useContext(WebSocketEventContext);
  const latestEvent = events?.latestEvent;

  const loggedCalls = useRef(new Set());
  const postedCalls = useRef(new Set());
  const lastKnownCall = useRef({ caller: null, callee: null });
  const isCallEnding = useRef(false);

  // *************************  Initial Setup Effects  ********************

  useEffect(() => {
    if (latestEvent) {
      console.log("🎧 WS EVENT RECEIVED:", latestEvent);
    }
  }, [latestEvent]);

  useEffect(() => {
    unlockAudioContext();
  }, []);

  useEffect(() => {
    if (auth?.isAuthenticated && isAgentRegistered === false) agentRegister();
  }, [auth]);

  useEffect(() => {
    if (isEstablished) {
      answerCall();
      setIsEstablished(false);
    }
  }, [isEstablished]);

  
  useEffect(() => {
    console.log("incomingSessions", incomingSessions);
    console.log("outgoingSessions", outgoingSessions);
  }, [incomingSessions, outgoingSessions]);

  useEffect(() => {
    if (auth?.status === "Logged Out") {
      agentLogout();
    }
  }, [auth]);

  useEffect(() => {
    if (transferContextNumber) {
      transfer(transferContextNumber);
    }
  }, [transferContextNumber]);

  useEffect(() => {
    if (conferenceContextNumber) {
      outBoundCall(conferenceContextNumber);
    }
  }, [conferenceContextNumber]);

  useEffect(() => {
    if (activeCallDetails?.direction === "Outbound") {
      outBoundCall(activeCallDetails?.number);
    }
  }, [activeCallDetails]);

  // *************************  Audio Context & Initialization  ********************

  const unlockAudioContext = () => {
    const silentAudio = new Audio("/audio/silence.mp3");
    silentAudio.volume = 0;
    silentAudio.play().catch(() => {});
  };

  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudioContext();
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return cleanup;
  }, []);

  // Pre-initialize audio elements
  useEffect(() => {
    if (remoteMedia.current) {
      remoteMedia.current.load();
    }
    if (localMedia.current) {
      localMedia.current.load();
    }
  }, []);

  // *************************  Logout Handler  ********************
const agentLogout = async () => {
  console.log("🔄 Calling backend logout for:", auth?.userName);

  try {
    const response = await axios.post(
      `${backendConfig.baseURL}${backendConfig.logoutEndPoint}`,  // ← No query params!
      { user_id: auth?.userName },  // ✅ JSON body with user_id
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Response status:", response.status);

    if (response.status === 200) {
      console.log("✅ Backend logout success:", response.data);
      login({
        userId: "",
        userName: "",
        password: "",
        status: "",
        isAuthenticated: false,
        hostname: "",
      });
      agentUnRegister();
      logout();
      navigate(createPageUrl("Welcome"));
    }
  } catch (error: any) {
    console.error("❌ Logout error:", error.response?.status, error.message);
  }
};


  // *************************  Agent Registration  ********************

  const agentRegister = useCallback(() => {
    const uri = UserAgent.makeURI(`${sip}${username}@${ip}`);

    console.log("Uri in agentregister", uri);
    if (!uri) throw new Error("Failed to create URI");

    const transportOptions = {
      server: serverURL,
      traceSip: true,
    };
    const userAgentOptions: UserAgentOptions = {
      displayName: username,
      authorizationPassword: password,
      authorizationUsername: username,
      transportOptions,
      uri,
      noAnswerTimeout: 60,
    };
    userAgent = new UserAgent(userAgentOptions);
    const registerer = new Registerer(userAgent);

    userAgent
      .start()
      .then(async () => {
        try {
          await registerer.register();
          setIsAgentRegistered(true);
          console.log("✅ AGENT REGISTERED");
          setUserAgents(userAgent);
        } catch (error) {
          console.error("Error in registration process:", error);
        }
      })
      .catch((error) => {
        console.error("Error in start process:", error);
      });
  }, [navigate, password, sip, username, serverURL, ip]);

  const agentUnRegister = useCallback(() => {
    if (isAgentRegistered) {
      if (!usersAgents) {
        return;
      }
      if (!isAgentRegistered) {
        return;
      }

      const registerer = new Registerer(usersAgents);
      registerer
        .unregister()
        .then(() => {
          setIsAgentRegistered(false);
          console.log("✅ AGENT UN-REGISTERED");
        })
        .catch((error) => {
          console.error("Error in unregistration process:", error);
        });
    }
  }, [isAgentRegistered, navigate]);

  // *************************  Session Management  ********************

  const clearSession = useCallback(
    (sessionType: "incoming" | "outgoing") => {
      queueName = "";
      if (sessionType === "outgoing") {
        setOutgoingSessions([]);
        if (invitationRef.current) {
          invitationRef.current.invite({
            sessionDescriptionHandlerModifiers: [],
          });
        }

        console.log("outgoingSessionEstablished", outgoingSessionEstablished);

        if (outgoingSessionEstablished) {
          handleEndCall();
          outgoingSessionEstablished = false;
        }
        outgoingSessionRef.current = null;
      } else if (sessionType === "incoming") {
        setIncomingSessions([]);
        if (outgoingSessionRef.current) {
          outgoingSessionRef.current.invite({
            sessionDescriptionHandlerModifiers: [],
          });
        }
        console.log("incomingSessionEstablished", incomingSessionEstablished);
        if (incomingSessionEstablished) {
          handleEndCall();
          incomingSessionEstablished = false;
        }

        invitationRef.current = null;
      }
    },
    [setIncomingSessions, setOutgoingSessions]
  );

  // *************************  Audio Playback - FIX #1: IMMEDIATE CALL (NO DELAY)  ********************

  const playAudio = useCallback(() => {
    const session = outgoingSessionRef.current || invitationRef.current;
    console.log("🔊 playAudio called - session:", session?.state);

    if (
      !session ||
      session.state !== SessionState.Established ||
      !session.sessionDescriptionHandler
    ) {
      console.log("⚠️ Session not ready for audio playback");
      return;
    }

    const sessionDescriptionHandler =
      session.sessionDescriptionHandler as SessionDescriptionHandler;
    const peerConnection = sessionDescriptionHandler.peerConnection;
    if (!peerConnection) {
      console.log("⚠️ No peer connection available");
      return;
    }

    console.log("✅ peerConnection found - setting up audio streams");

    if (peerConnection) {
      peerConnection.getReceivers().forEach((receiver) => {
        if (receiver.track) remoteStream.addTrack(receiver.track);
      });

      if (remoteMedia.current) {
        remoteMedia.current.srcObject = remoteStream;
        remoteMedia.current
          .play()
          .catch((e) => console.error("❌ Error playing remote media", e));
      }

      peerConnection.getSenders().forEach((sender) => {
        if (sender.track) localStream.addTrack(sender.track);
      });

      if (localMedia.current) {
        localMedia.current.srcObject = localStream;
        localMedia.current
          .play()
          .catch((e) => console.error("❌ Error playing local media", e));
      }

      console.log("✅ Audio streams connected successfully");
    }
  }, [invitationRef, outgoingSessionRef, localStream, remoteStream]);

  // *************************  Tone Management  ********************

  const playTone = (audio: HTMLAudioElement) => {
    const attemptPlay = () => {
      audio.play().catch((error: any) => {
        console.error("Audio playback error:", error);
      });
    };
    if (isUserInteracted) {
      attemptPlay();
    } else {
      const handleUserInteraction = () => {
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("keydown", handleUserInteraction);
        document.removeEventListener("touchstart", handleUserInteraction);
      };

      document.addEventListener("click", handleUserInteraction, { once: true });
      document.addEventListener("keydown", handleUserInteraction, {
        once: true,
      });
      document.addEventListener("touchstart", handleUserInteraction, {
        once: true,
      });
    }
  };

  const stopTone = (audio: HTMLAudioElement) => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  // *************************  State Change Handler - FIX #2: REMOVE setTimeout  ********************

  const handleStateChange = useCallback(
    (
      session: Session,
      audio: HTMLAudioElement,
      sessionType: "incoming" | "outgoing"
    ) => {
      session.stateChange.addListener((newState) => {
        switch (newState) {
          case SessionState.Establishing:
            if (
              invitationRef.current &&
              invitationRef.current.state === SessionState.Established
            ) {
              invitationRef.current.invite({
                sessionDescriptionHandlerModifiers: [Web.holdModifier],
              });
            }
            if (
              outgoingSessionRef.current &&
              outgoingSessionRef.current.state === SessionState.Established
            ) {
              outgoingSessionRef.current.invite({
                sessionDescriptionHandlerModifiers: [Web.holdModifier],
              });
            }

            console.log("📞 Connection Establishing in", sessionType, "session");
            break;

          case SessionState.Established:
            console.log("✅ Connection Established in", sessionType, "session");
            if (sessionType === "outgoing") {
              answerCall();
              setIsEstablished(true);
              stopOutgoing();
              outgoingSessionEstablished = true;
            } else {
              stopIncoming();
              incomingSessionEstablished = true;
            }

            // ✅ FIX #2: Call playAudio IMMEDIATELY without setTimeout delay
            playAudio();
            console.log("🎵 Audio playback initiated immediately");
            break;

          case SessionState.Terminated:
            console.log("❌ Connection Terminated in", sessionType, "session");
            clearSession(sessionType);
            stopTone(audio);
            queueCall = null;
            break;

          default:
            break;
        }
      });
    },
    [clearSession, playAudio]
  );

  // *************************  Incoming Call Setup - FIX #3: NON-BLOCKING API CALL  ********************

  useEffect(() => {
    const setupAgent = async () => {
      if (usersAgents) {
        usersAgents.delegate = {
          async onInvite(invitation: Invitation) {
            console.log("📞 Incoming invitation received");

            // ✅ Show ringing immediately without waiting for API
            setIncomingSessions((prev) => [...prev, invitation]);
            playIncoming();
            handleStateChange(invitation, incomingAudio, "incoming");

            invitationRef.current = invitation;
            const Username = invitation.remoteIdentity.displayName;
            exstensionPhoneNumber = Username;

            // ✅ Show UI immediately with empty queue name
            startCall(
              {
                name: "",
                number: exstensionPhoneNumber,
                direction: "Inbound",
              },
              "ringing"
            );

            navigate("/customers", {
              state: { incomingPhoneNumber: exstensionPhoneNumber },
            });

            // ✅ FIX #3: Fetch queue name asynchronously WITHOUT blocking
            const headers = invitation.request.headers;
            console.log("headers", headers);

            if (headers["X-Queue-Name"]) {
              const queueHeader = headers["X-Queue-Name"][0].raw;
              console.log("queueHeader from SIP:", queueHeader);
              queueCall = queueHeader;
              queueName = queueHeader;
            } else {
              // Non-blocking API call - doesn't block call acceptance
              axios
                .get(`${backendConfig.baseURL}${backendConfig.queueName}`)
                .then((response) => {
                  const { queue_name } = response.data;
                  if (queue_name) {
                    console.log("✅ Queue name fetched:", queue_name);
                    queueName = queue_name;
                    setActiveCallDetails((prev) => ({
                      ...prev,
                      name: queue_name,
                    }));
                  }
                })
                .catch((error) => {
                  console.error("⚠️ Error fetching queue name (non-blocking):", error);
                });
            }
          },
        };
      }
    };

    setupAgent();

    return () => {
      if (ringtone) {
        stopTone(ringtone);
      }
      if (outgoingTone) {
        stopTone(outgoingTone);
      }
    };
  }, [usersAgents, handleStateChange]);

  useEffect(() => {
    if (outgoingSessions.length > 0) {
      playOutgoing();
      outgoingSessions.forEach((session) =>
        handleStateChange(session, outgoingAudio, "outgoing")
      );
    }
  }, [handleStateChange, outgoingSessions]);

  useEffect(() => {
    return () => {
      stopIncoming();
      stopOutgoing();
    };
  }, []);

  // *************************  Transfer  ********************

  const transfer = useCallback(
    async (transferNum) => {
      console.log("📤 Transfer initiated to:", transferNum);
      const target = UserAgent.makeURI(`${sip}${transferNum}@${ip}`);
      if (!target) {
        throw new Error("Failed to create target URI.");
      }

      const session = outgoingSessions[0] || incomingSessions[0];
      if (!session) {
        console.warn("No active session found for transfer.");
        return;
      }

      if (session.state !== SessionState.Established) {
        console.warn("Transfer attempted before session established.");
        session.stateChange.once((state) => {
          if (state === SessionState.Established) {
            console.log("Session established, retrying transfer...");
            transfer(transferNum);
          }
        });
        return;
      }

      try {
        const referral = await session.refer(target);
        referral.delegate = {
          onAccept: () => {
            console.log("✅ Transfer complete");
            session.dispose();
            clearSession(outgoingSessions.length > 0 ? "outgoing" : "incoming");
          },
          onReject: () => console.log("❌ Transfer rejected"),
        };
      } catch (err) {
        console.error("Transfer error:", err);
      }
    },
    [incomingSessions, outgoingSessions, clearSession, sip, ip]
  );

  // *************************  Outbound Call  ********************

  const outBoundCall = useCallback(
    (dialPhoneNumber: string) => {
      if (!dialPhoneNumber) {
        console.error("No phone number entered. Call aborted.");
        return;
      }

      const target = UserAgent.makeURI(sip + dialPhoneNumber + `@${ip}`);
      console.log("target in outboundcall", target);

      if (!target) {
        throw new Error("Failed to create target URI.");
      }

      if (invitationRef.current || outgoingSessionRef.current) {
        setActiveCallDetails((prev) => ({
          ...prev,
          name: "Conference Call",
          number: "",
        }));
      }

      inviter = new Inviter(usersAgents, target);
      outgoingSessionRef.current = inviter;
      setOutgoingSessions((prev) => [...prev, outgoingSessionRef.current]);

      inviter
        .invite()
        .then(() => {
          console.log("✅ Invite Sent");
        })
        .catch((error: Error) => {
          console.log("❌ Error in Invite", error);
        });
    },
    [sip, ip, usersAgents, setOutgoingSessions, outgoingSessionRef]
  );

  // *************************  Conference  ********************

  const conference = useCallback(async () => {
    try {
      const bridgeURI = UserAgent.makeURI(`${sip}conf123@${ip}`);
      if (!bridgeURI) {
        console.error("Invalid conference bridge URI");
        return;
      }

      const sessions = [...incomingSessions, ...outgoingSessions];
      if (sessions.length < 2) {
        console.warn("Need at least 2 active calls to merge");
        return;
      }

      console.log("Sending REFER to move calls to bridge:", bridgeURI.toString());

      for (const session of sessions) {
        try {
          const referral = await session.refer(bridgeURI);
          referral.delegate = {
            onAccept: () => console.log("→ Call moved to conference"),
            onReject: () => console.warn("→ Conference REFER rejected"),
          };
        } catch (err) {
          console.error("Conference REFER error:", err);
        }
      }

      setTimeout(() => {
        sessions.forEach((s) => {
          try {
            s.bye();
          } catch (err) {
            console.warn("Error ending initiator call:", err);
          }
        });
        console.log("Initiator left conference");
      }, 2000);
    } catch (err) {
      console.error("Conference setup failed:", err);
    }
  }, [incomingSessions, outgoingSessions, sip, ip]);

  // *************************  Call Response Handler - FIX #4: CALL playAudio IMMEDIATELY  ********************

  const handleCallResponse = useCallback(
    (accept: boolean) => {
      const invite = invitationRef.current;
      if (!invite) return console.error("No invitation available to process.");

      const options = {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      };

      const action = accept ? invite.accept(options) : invite.reject();
      action
        .then(() => {
          console.log("accept", accept);
          if (accept) {
            answerCall();
            // ✅ FIX #4: Call playAudio immediately when accepting call
            playAudio();
            console.log("🎵 Audio playback triggered immediately on accept");
          }

          console.log(
            accept ? "✅ Incoming INVITE Accepted" : "❌ Incoming INVITE Rejected"
          );
        })
        .catch((error) =>
          console.error(
            `Error ${accept ? "accepting" : "rejecting"} incoming call:`,
            error
          )
        );
    },
    [playAudio, answerCall]
  );

  // *************************  Call End Handler  ********************

  const endVoiceCall = useCallback(() => {
    if (outgoingSessions.length > 0) {
      outgoingSessions.forEach((session) => endSession(session));
    }

    if (incomingSessions.length > 0) {
      incomingSessions.forEach((session) => endSession(session));
    }

    [remoteMedia.current, localMedia.current].forEach((audio) => {
      if (audio) {
        audio.srcObject = null;
        audio.pause();
      }
    });
    localStream.getTracks().forEach((track) => track.stop());
    remoteStream.getTracks().forEach((track) => track.stop());
  }, [outgoingSessions, incomingSessions]);

  const endSession = (session: Session) => {
    if (!session) return;

    switch (session.state) {
      case SessionState.Initial:
      case SessionState.Establishing:
        if (session instanceof Inviter) {
          session.cancel();
          session.dispose();
        }
        break;
      case SessionState.Established:
        session.bye();
        break;
      default:
        break;
    }
  };

  // *************************  Audio Controls  ********************

  const toggleMute = useCallback(
    (isMuted: boolean, session: SessionDescriptionHandler) => {
      session.peerConnection?.getSenders().forEach((sender) => {
        if (sender.track) sender.track.enabled = !isMuted;
      });
    },
    []
  );

  const handleSession = useCallback(
    (session: Session, isMuted: boolean) => {
      if (
        session?.state === SessionState.Established &&
        session.sessionDescriptionHandler
      ) {
        toggleMute(
          isMuted,
          session.sessionDescriptionHandler as SessionDescriptionHandler
        );
      }
    },
    [toggleMute]
  );

  const muteCall = useCallback(() => {
    if (outgoingSessions.length > 0) {
      outgoingSessions.forEach((session) => handleSession(session, true));
    }

    if (incomingSessions.length > 0) {
      incomingSessions.forEach((session) => handleSession(session, true));
    }
  }, [outgoingSessions, incomingSessions, handleSession]);

  const unMuteCall = useCallback(() => {
    if (outgoingSessions.length > 0) {
      outgoingSessions.forEach((session) => handleSession(session, false));
    }

    if (incomingSessions.length > 0) {
      incomingSessions.forEach((session) => handleSession(session, false));
    }
  }, [outgoingSessions, incomingSessions, handleSession]);

  const inviteWithSession = (session: Session, options: any) => {
    if (session?.state === SessionState.Established) session.invite(options);
  };

  const holdCall = useCallback(() => {
    const holdOptions = {
      sessionDescriptionHandlerModifiers: [Web.holdModifier],
    };

    if (outgoingSessions.length > 0) {
      outgoingSessions.forEach((session) =>
        inviteWithSession(session, holdOptions)
      );
    }

    if (incomingSessions.length > 0) {
      incomingSessions.forEach((session) =>
        inviteWithSession(session, holdOptions)
      );
    }
  }, [outgoingSessions, incomingSessions]);

  const unHoldCall = useCallback(() => {
    const unholdOptions = { sessionDescriptionHandlerModifiers: [] };

    if (outgoingSessions.length > 0) {
      outgoingSessions.forEach((session) =>
        inviteWithSession(session, unholdOptions)
      );
    }

    if (incomingSessions.length > 0) {
      incomingSessions.forEach((session) =>
        inviteWithSession(session, unholdOptions)
      );
    }
  }, [outgoingSessions, incomingSessions]);

  // *************************  DB Interaction  ********************

  const createInteraction = async (data) => {
    console.log("Data", data);
    try {
      const response = await axios.post(
        `${backendConfig.baseURL}${backendConfig.callInteractions}`,
        data
      );
      console.log("✅ Interaction created:", response.data);
    } catch (err) {
      console.error(
        "❌ Failed to create interaction:",
        err.response?.data || err.message
      );
    }
  };

  const completeInteraction = async (latestEvent) => {
    try {
      const endTime = new Date().toISOString();
      const duration = callDuration || 0;

      const direction =
        activeCallDetails?.direction || latestEvent?.Direction || "Inbound";

      const wsCaller = latestEvent?.Caller || activeCallDetails?.caller;
      const wsCallee = latestEvent?.Callee || activeCallDetails?.callee;
      const wsCallerUUID =
        latestEvent?.Caller_UUID || activeCallDetails?.caller_uuid;
      const wsCalleeUUID =
        latestEvent?.Callee_UUID || activeCallDetails?.callee_uuid;

      const agentId = auth?.userId || "unknown_agent";

      let caller, callee, caller_uuid, callee_uuid;

      if (direction === "Outbound") {
        caller = agentId;
        callee =
          wsCallee ||
          activeCallDetails?.number ||
          lastKnownCall.current.callee ||
          "unknown_customer";
        caller_uuid = wsCallerUUID || generateUUID();
        callee_uuid = wsCalleeUUID || generateUUID();
      } else {
        caller =
          wsCaller ||
          activeCallDetails?.number ||
          lastKnownCall.current.caller ||
          "unknown_customer";
        callee = agentId;
        caller_uuid = wsCallerUUID || generateUUID();
        callee_uuid = wsCalleeUUID || generateUUID();
      }

      lastKnownCall.current = { caller, callee };

      const callId =
        activeCallDetails?.call_id ||
        `${caller}_${callee}_${generateUUID().slice(0, 8)}`;

      if (postedCalls.current.has(callId)) {
        console.log("⚠️ Skipping duplicate interaction post for:", callId);
        return;
      }

      const payload = {
        call_id: callId,
        caller,
        caller_uuid,
        callee,
        callee_uuid,
        direction,
        summary: "Call completed successfully",
        transcript: [
          { speaker: "Agent", text: "Conversation summary not available" },
        ],
        disposition: "completed",
        end_time: endTime,
        duration,
      };

      console.log("📤 Sending final interaction payload:", payload);

      const response = await axios.post(
        `${backendConfig.baseURL}/api/interactions/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Interaction posted successfully:", response.data);
      postedCalls.current.add(callId);
    } catch (err) {
      console.error(
        "❌ Failed to complete interaction:",
        err.response?.data || err.message
      );
    }
  };

  // *************************  Call End Handler with Deduplication  ********************

  const handleEndCall = () => {
    if (isCallEnding.current) {
      console.log(
        "⚠️ handleEndCall already executed — skipping duplicate trigger."
      );
      return;
    }
    isCallEnding.current = true;

    const postAndEnd = async () => {
      try {
        console.log("📞 Call ending — checking and posting interaction...");
        await completeInteraction(latestEvent);
      } catch (err) {
        console.error("❌ Error completing interaction:", err);
      } finally {
        if (!transferNumber) endVoiceCall();
        endCall();
        resetAllStates();

        setTimeout(() => {
          isCallEnding.current = false;
        }, 2000);
      }
    };

    postAndEnd();
  };

  // *************************  UI Handlers  ********************

  const handleMuteToggle = () => {
    try {
      if (isMuted) {
        unMuteCall();
      } else {
        muteCall();
      }
      setIsMuted(!isMuted);
    } catch (err) {
      console.error("Mute toggle failed:", err);
    }
  };

  const handleHoldToggle = () => {
    try {
      if (isHolding) {
        unHoldCall();
      } else {
        holdCall();
      }
      setIsHolding(!isHolding);
    } catch (err) {
      console.error("Hold toggle failed:", err);
    }
  };

  useEffect(() => {
    let timer;
    if (callState === "active") {
      timer = setInterval(() => {
        if (!isHolding) {
          setCallDuration((prev) => prev + 1);
        }
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState, isHolding]);

  const resetAllStates = () => {
    setCallDuration(0);
    setIsMuted(false);
    setIsHolding(false);
    setIsTransferring(false);
    setIsConferencing(false);
    setTransferNumber("");
    setConferenceNumber("");
  };

  const handleRejectCall = () => {
    endVoiceCall();
    rejectVoiceCall();
    rejectCall();
    resetAllStates();
  };

  const answerVoiceCall = useCallback(() => {
    handleCallResponse(true);
  }, [handleCallResponse]);

  const rejectVoiceCall = useCallback(() => {
    if (outgoingSessions.length > 0) {
      endVoiceCall();
    } else handleCallResponse(false);
  }, [handleCallResponse, endCall, outgoingSessions]);

  const handleAnswerCall = () => {
    answerVoiceCall();
  };

  const handleTransfer = async () => {
    if (!transferNumber) return;

    const target = UserAgent.makeURI(`${sip}${transferNumber}@${ip}`);
    const session = outgoingSessions[0] || incomingSessions[0];
    if (!session) return;

    try {
      const referral = await session.refer(target);

      referral.delegate = {
        onAccept: () => {
          console.log("✅ Transfer accepted — ending original call");
          handleEndCall();
        },
        onReject: () => {
          console.warn("❌ Transfer rejected — keeping call active");
        },
      };
    } catch (err) {
      console.error("Transfer failed:", err);
    }
  };

  const handleAddParticipant = () => {
    outBoundCall(conferenceNumber);
    setActiveCallDetails((prev) => ({
      ...prev,
      name: "Conference Call",
      number: "",
    }));
    setIsConferencing(false);
    setConferenceNumber("");
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // *************************  RENDER  ********************

  if (callState === "idle") return null;

  return (
    <div
      className={`absolute top-0 left-0 right-0 bg-white border-b-2 shadow-lg px-6 py-3 z-50 transition-colors ${
        isHolding ? "border-yellow-500" : "border-green-500"
      }`}
      style={{ padding: "14.5px" }}
    >
      <div className="flex items-center justify-start max-w-7xl mx-auto gap-14">
        {/* Call Info */}
        <div className="flex items-center gap-4 flex-shrink min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                isHolding ? "bg-yellow-500" : "bg-green-500"
              }`}
            />
            <Phone
              className={`w-4 h-4 ${
                isHolding ? "text-yellow-600" : "text-green-600"
              }`}
            />
            <span className="font-semibold text-gray-900 truncate w-[100px]">
              {isHolding
                ? "On Hold"
                : activeCallDetails?.direction === "Conference"
                ? "Conference Call"
                : `${activeCallDetails?.direction || "Incoming"} Call`}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-6 min-w-0">
            <span className="font-semibold text-gray-900 truncate">
              {activeCallDetails?.name || ""}
            </span>
            <span className="text-gray-500 truncate">
              {activeCallDetails?.number || ""}
            </span>
            {callState === "active" && (
              <Badge
                variant="outline"
                className={`flex-shrink-0 w-14 text-center ${
                  isHolding
                    ? "text-yellow-700 border-yellow-200"
                    : "text-green-700 border-green-200"
                }`}
              >
                {formatDuration(callDuration)}
              </Badge>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div
          className="flex items-center gap-2 flex-shrink-0"
          style={{ padding: "1.7px" }}
        >
          <TooltipProvider>
            {callState === "ringing" && (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRejectCall}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>

                {activeCallDetails?.direction !== "Outbound" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleAnswerCall}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Answer
                  </Button>
                )}
              </>
            )}

            {callState === "active" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      onClick={handleMuteToggle}
                    >
                      {isMuted ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white">
                    <p>{isMuted ? "UnMute" : "Mute"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isHolding ? "destructive" : "outline"}
                      size="icon"
                      onClick={handleHoldToggle}
                    >
                      <span className="w-5 h-5 flex items-center justify-center">
                        {isHolding ? (
                          <PlayCircle className="w-4 h-4" />
                        ) : (
                          <PauseCircle className="w-4 h-4" />
                        )}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white">
                    <p>{isHolding ? "UnHold" : "Hold"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigate(createPageUrl("Team"));
                        setTransferCall(true);
                        setIsTransferring(true);
                      }}
                    >
                      <PhoneForwarded className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white">
                    <p>Transfer</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigate(createPageUrl("Team"));
                        setConferenceCall(true);
                        setIsConferencing(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white">
                    <p>Add</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={conference}
                      disabled={
                        !(
                          incomingSessionEstablished &&
                          outgoingSessionEstablished
                        )
                      }
                      className={
                        !(
                          incomingSessionEstablished &&
                          outgoingSessionEstablished
                        )
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    >
                      <Merge className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white">
                    <p>Merge Calls</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleEndCall}
                      className="ml-2"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white">
                    <p>End Call</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </div>

      <audio ref={remoteMedia} autoPlay />
      <audio ref={localMedia} autoPlay muted />
    </div>
  );
}