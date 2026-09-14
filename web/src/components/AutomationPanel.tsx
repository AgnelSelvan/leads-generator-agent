"use client";

import { useState, useEffect, useRef } from "react";

interface Lead {
  pincode: string;
  place_id: string;
  company_name: string;
  mobile_no: string;
  customized_whatsapp_message: string;
  message_status: string;
}

export default function AutomationPanel() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const stopRequested = useRef(false);

  const baseUrl = process.env.NEXT_PUBLIC_OPENWA_BASE_URL || "http://localhost:2785";
  const apiKey = process.env.NEXT_PUBLIC_OPENWA_API_KEY || "";

  const getHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    return headers;
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    fetchSessions();
    fetchLeads();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/sessions`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.sessions || []);
        setSessions(list);
        if (list.length > 0) {
          setSelectedSessionId(list[0].id || list[0].sessionId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/leads");
      if (res.ok) {
        const data = await res.json();
        const groupedLeads = data.grouped_leads || {};
        let allLeads: Lead[] = [];
        Object.values(groupedLeads).forEach((list: any) => {
          allLeads.push(...list);
        });
        // Filter leads that have mobile_no, customized_whatsapp_message, and are NOT_SENT
        allLeads = allLeads.filter(
          (l) => l.mobile_no && l.customized_whatsapp_message && l.message_status === "NOT_SENT"
        );
        setLeads(allLeads);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    }
  };

  const updateLeadStatus = async (placeId: string, status: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/leads/${placeId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_status: status }),
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const startAutomation = async () => {
    if (!selectedSessionId) {
      addLog("Please select a session first.");
      return;
    }
    if (leads.length === 0) {
      addLog("No pending leads to process.");
      return;
    }
    
    setIsRunning(true);
    stopRequested.current = false;
    addLog(`Starting automation for ${leads.length} leads...`);

    for (let i = 0; i < leads.length; i++) {
      if (stopRequested.current) {
        addLog("Automation stopped by user.");
        break;
      }

      setCurrentIndex(i);
      const lead = leads[i];
      addLog(`Processing: ${lead.company_name} (${lead.mobile_no})`);

      try {
        let phone = lead.mobile_no.replace(/[^0-9]/g, "");
        if (!phone.startsWith("91") && phone.length === 10) {
           phone = "91" + phone;
        }

        // Verify the contact using OpenWA check endpoint
        const checkRes = await fetch(`${baseUrl}/api/sessions/${selectedSessionId}/contacts/check/${phone}`, { 
          headers: getHeaders() 
        });
        
        if (!checkRes.ok) {
           addLog(`Failed to verify ${phone}. Error response.`);
           await updateLeadStatus(lead.place_id, "ERROR");
           continue;
        }

        const checkData = await checkRes.json();
        if (!checkData.exists) {
          addLog(`${phone} is not on WhatsApp.`);
          await updateLeadStatus(lead.place_id, "ERROR");
          continue;
        }

        const whatsappId = checkData.whatsappId || checkData.jid;
        
        // Send the customized message
        const sendRes = await fetch(`${baseUrl}/api/sessions/${selectedSessionId}/messages/send-text`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ chatId: whatsappId, text: lead.customized_whatsapp_message })
        });

        if (sendRes.ok) {
          addLog(`Message sent successfully to ${lead.company_name}.`);
          await updateLeadStatus(lead.place_id, "SENT");
        } else {
          addLog(`Failed to send message to ${lead.company_name}.`);
          await updateLeadStatus(lead.place_id, "ERROR");
        }
      } catch (err: any) {
        addLog(`Error processing ${lead.company_name}: ${err.message}`);
        await updateLeadStatus(lead.place_id, "ERROR");
      }

      if (i < leads.length - 1 && !stopRequested.current) {
        addLog("Waiting for 2 minutes before the next message...");
        // Wait 2 minutes (120,000 ms)
        for(let w = 0; w < 120; w++) {
           if (stopRequested.current) break;
           await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    addLog("Automation finished.");
    setIsRunning(false);
    setCurrentIndex(-1);
    fetchLeads(); // Refresh leads
  };

  const stopAutomation = () => {
    stopRequested.current = true;
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
        <div>
          <h2 className="text-[24px] font-[700] text-foreground">Automation</h2>
          <p className="text-[14px] text-text-mute mt-1">
            Send automated WhatsApp messages to pending leads. Messages will be sent with a 2-minute delay between each lead.
          </p>
        </div>

        <div className="bg-surface-raised border border-hairline-strong rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Select WhatsApp Session</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={isRunning}
              className="bg-surface border border-hairline-strong rounded-lg px-3 py-2 text-sm focus:outline-primary"
            >
              <option value="">-- Select Session --</option>
              {sessions.map((s: any) => {
                const sId = s.id || s.sessionId;
                return (
                  <option key={sId} value={sId}>
                    {s.name || sId} ({s.status})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex justify-between items-center mt-2">
            <div>
              <span className="font-semibold text-foreground">Pending Leads: </span>
              <span className="text-primary font-bold">{leads.length}</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchLeads}
                disabled={isRunning}
                className="px-4 py-2 bg-surface-strong text-text border border-hairline-strong rounded-lg font-semibold text-sm hover:bg-hairline disabled:opacity-50"
              >
                Refresh Leads
              </button>
              {!isRunning ? (
                <button
                  onClick={startAutomation}
                  disabled={leads.length === 0 || !selectedSessionId}
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-deep disabled:opacity-50 shadow-sm"
                >
                  Start Automation
                </button>
              ) : (
                <button
                  onClick={stopAutomation}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 shadow-sm"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface-raised border border-hairline-strong rounded-xl p-6 flex flex-col flex-1 shadow-sm h-[400px]">
          <h3 className="text-sm font-semibold text-foreground mb-4">Activity Logs</h3>
          <div className="flex-1 overflow-y-auto bg-black text-green-400 p-4 rounded-lg font-mono text-sm flex flex-col gap-1">
            {logs.length === 0 ? (
              <span className="text-gray-500 italic">No activity yet.</span>
            ) : (
              logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
