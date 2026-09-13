"use client";

import { useState, useEffect, useCallback } from "react";

export default function SessionPanel() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [newSessionName, setNewSessionName] = useState("");
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_OPENWA_API_KEY || "");

  const baseUrl = process.env.NEXT_PUBLIC_OPENWA_BASE_URL || "http://localhost:2785";

  const getHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    return headers;
  };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/sessions`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.sessions || []);
        setSessions(list);
        
        // Update selected session status if it exists
        setSelectedSession((prev: any) => {
          if (prev) {
            const updated = list.find((s: any) => s.name === prev.name || s.id === prev.id || s.sessionId === prev.sessionId);
            return updated || prev;
          }
          return prev;
        });
      } else if (res.status === 401) {
        setError("Unauthorized. Please check your API Key.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not connect to OpenWA.");
    }
  }, [baseUrl, apiKey]);

  const fetchQr = useCallback(async () => {
    if (!selectedSession) return;
    const sId = selectedSession.id || selectedSession.sessionId;
    try {
      const res = await fetch(`${baseUrl}/api/sessions/${sId}/qr`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode || data.qr || data.dataURL || null);
      }
    } catch (err) {
      console.error("Failed to fetch QR code", err);
    }
  }, [baseUrl, apiKey, selectedSession]);

  const createSession = async () => {
    if (!newSessionName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/api/sessions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: newSessionName.trim() })
      });
      if (res.ok) {
        setNewSessionName("");
        await fetchSessions();
      } else {
        const data = await res.json();
        const errMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        setError(errMsg || data.error || "Failed to create session");
      }
    } catch (err) {
      setError("Error creating session");
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (sId: string) => {
    setLoading(true);
    try {
      await fetch(`${baseUrl}/api/sessions/${sId}/start`, { method: "POST", headers: getHeaders() });
      await fetchSessions();
    } catch (err) {
      setError("Failed to start session.");
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async (sId: string) => {
    setLoading(true);
    try {
      await fetch(`${baseUrl}/api/sessions/${sId}/stop`, { method: "POST", headers: getHeaders() });
      await fetchSessions();
    } catch (err) {
      setError("Failed to stop session.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sId: string) => {
    if (!confirm(`Are you sure you want to delete session ${sId}?`)) return;
    setLoading(true);
    try {
      await fetch(`${baseUrl}/api/sessions/${sId}`, { method: "DELETE", headers: getHeaders() });
      if (selectedSession && (selectedSession.name === sId || selectedSession.id === sId || selectedSession.sessionId === sId)) {
        setSelectedSession(null);
        setQrCode(null);
      }
      await fetchSessions();
    } catch (err) {
      setError("Failed to delete session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      const status = selectedSession.status;
      if (status === "qr" || status === "SCAN_QR_CODE" || status === "UNPAIRED") {
        fetchQr();
        const qrInterval = setInterval(fetchQr, 10000);
        return () => clearInterval(qrInterval);
      } else {
        setQrCode(null);
      }
    }
  }, [selectedSession, fetchQr]);

  return (
    <div className="flex flex-col h-full bg-surface animate-fade-in p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Session List & Creation */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div>
            <h2 className="text-[24px] font-[700] text-foreground tracking-tight leading-tight">Sessions</h2>
            <p className="text-[14px] text-text-mute mt-1">Manage WhatsApp connections</p>
          </div>
          
          <div className="bg-surface-raised border border-hairline-strong rounded-xl p-4 flex flex-col gap-4 shadow-sm">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">New Session</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Session ID (e.g. leads-bot)"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="flex-1 bg-surface border border-hairline-strong rounded-lg px-3 py-2 text-sm focus:outline-primary"
              />
              <button
                onClick={createSession}
                disabled={loading || !newSessionName.trim()}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-deep disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
            {!process.env.NEXT_PUBLIC_OPENWA_API_KEY && (
              <input
                type="password"
                placeholder="OpenWA API Key (Optional)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-surface border border-hairline-strong rounded-lg px-3 py-2 text-sm focus:outline-primary mt-2"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            {sessions.length === 0 ? (
              <div className="text-sm text-text-mute italic p-4 bg-surface-raised rounded-lg border border-hairline text-center">
                No sessions found. Create one above!
              </div>
            ) : (
              sessions.map((s, i) => {
                const sId = s.id || s.sessionId;
                const displayName = s.name || sId;
                const isSelected = selectedSession && (selectedSession.id === sId || selectedSession.sessionId === sId);
                const isStarted = s.status === "READY" || s.status === "CONNECTED" || s.status === "STARTING" || s.status === "UNPAIRED" || s.status === "SCAN_QR_CODE" || s.status === "qr" || s.status === "qr_ready";
                return (
                  <div 
                    key={sId || i}
                    onClick={() => setSelectedSession(s)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-hairline-strong bg-surface hover:border-text-mute"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-foreground">{displayName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-mute uppercase">{s.status}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${s.status === "READY" || s.status === "CONNECTED" ? "bg-green-500" : s.status === "ERROR" ? "bg-red-500" : "bg-yellow-500 animate-pulse"}`}></span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!isStarted ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); startSession(sId); }}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
                        >
                          Start
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); stopSession(sId); }}
                            disabled={loading}
                            className="px-3 py-1.5 text-xs font-semibold rounded bg-surface-strong text-text border border-hairline-strong hover:bg-hairline disabled:opacity-50"
                          >
                            Stop
                          </button>
                          <button
                            onClick={async (e) => { 
                              e.stopPropagation();
                              setSelectedSession(s);
                              try {
                                const res = await fetch(`${baseUrl}/api/sessions/${sId}/qr`, { headers: getHeaders() });
                                if (res.ok) {
                                  const data = await res.json();
                                  setQrCode(data.qrCode || data.qr || data.dataURL || null);
                                }
                              } catch (err) {
                                setError("Failed to fetch QR");
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                          >
                            Show QR Code
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected Session Details */}
        <div className="w-full lg:w-2/3">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")} className="text-red-800 hover:text-red-900">&times;</button>
            </div>
          )}

          {selectedSession ? (
            <div className="bg-surface-raised border border-hairline-strong rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-hairline pb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Session: {selectedSession.name || selectedSession.id || selectedSession.sessionId}
                  </h3>
                  <p className="text-sm text-text-mute mt-1">Status: {selectedSession.status}</p>
                </div>
                <div className="flex gap-2">
                  {(selectedSession.status === "READY" || selectedSession.status === "CONNECTED" || selectedSession.status === "STARTING" || selectedSession.status === "UNPAIRED" || selectedSession.status === "SCAN_QR_CODE" || selectedSession.status === "qr" || selectedSession.status === "qr_ready") ? (
                    <>
                      <button
                        onClick={() => stopSession(selectedSession.id || selectedSession.sessionId)}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-surface-strong text-text hover:bg-hairline transition-colors font-semibold text-sm disabled:opacity-50 border border-hairline-strong"
                      >
                        Stop
                      </button>
                      <button
                        onClick={fetchQr}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold text-sm disabled:opacity-50"
                      >
                        Show QR Code
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startSession(selectedSession.id || selectedSession.sessionId)}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-deep transition-colors font-semibold text-sm shadow-sm disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => deleteSession(selectedSession.id || selectedSession.sessionId)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors font-semibold text-sm disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {qrCode ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-gray-800 font-semibold mb-6 text-sm text-center">Scan this QR code with your WhatsApp app to pair.</p>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-hairline-strong">
                    {qrCode.startsWith("data:image") ? (
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                    ) : (
                      <div className="text-xs break-all max-w-xs">{qrCode}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-text-mute">
                  {selectedSession.status === "READY" || selectedSession.status === "CONNECTED" ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <p className="font-semibold text-foreground">WhatsApp Connected!</p>
                      <p className="text-sm mt-2">This session is ready to send and receive messages.</p>
                    </>
                  ) : (
                    <p className="text-sm">No action required at this time. Start the session to generate a QR code.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-surface-raised border border-hairline-strong rounded-2xl p-8 text-center">
              <svg className="w-16 h-16 text-hairline-strong mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
              <h3 className="text-lg font-bold text-foreground">No Session Selected</h3>
              <p className="text-sm text-text-mute mt-2 max-w-sm">Select an existing WhatsApp session from the left or create a new one to get started.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
