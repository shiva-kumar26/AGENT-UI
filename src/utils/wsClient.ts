let wsInstance: WebSocket | null = null;

export function getWebSocket(agentId: string) {
  const WEBSOCKET_URL = `ws://10.16.7.130:2700/transcripts?agentId=${agentId}`;

  // Create new WebSocket only if one doesn't exist or was closed
  if (!wsInstance || wsInstance.readyState === WebSocket.CLOSED) {
    wsInstance = new WebSocket(WEBSOCKET_URL);
    console.log("✅ New WebSocket created for agent:", agentId);
  } else {
    console.log("♻️ Reusing existing WebSocket for agent:", agentId);
  }

  return wsInstance;
}

export function closeWebSocket() {
  if (wsInstance) {
    console.log("🔒 Closing WebSocket");
    wsInstance.close();
    wsInstance = null;
  }
}
