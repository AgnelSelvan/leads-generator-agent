"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Lead {
  pincode: string;
  place_id: string;
  company_name: string;
  address: string;
  mobile_no: string;
  customized_whatsapp_message: string;
}

export default function PersonalizePanel() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [companyContext, setCompanyContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"pending" | "generated">("pending");
  const router = useRouter();

  useEffect(() => {
    fetchContext();
    fetchLeads();
  }, []);

  const fetchContext = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/settings/company_context");
      if (res.ok) {
        const data = await res.json();
        setCompanyContext(data.value || "");
      }
    } catch (err) {
      console.error("Failed to fetch company context", err);
    }
  };

  const saveContext = async () => {
    setSaving(true);
    try {
      await fetch("http://127.0.0.1:8000/settings/company_context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: companyContext }),
      });
      alert("Context saved successfully!");
    } catch (err) {
      console.error("Failed to save context", err);
      alert("Failed to save context.");
    } finally {
      setSaving(false);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/leads");
      if (res.ok) {
        const data = await res.json();
        const groupedLeads = data.grouped_leads || {};
        let list: Lead[] = [];
        Object.values(groupedLeads).forEach((l: any) => {
          list.push(...l);
        });
        setAllLeads(list);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingLeads = allLeads.filter(
    (l) => !l.customized_whatsapp_message || l.customized_whatsapp_message === "NOT_SENT"
  );
  
  const generatedLeads = allLeads.filter(
    (l) => l.customized_whatsapp_message && l.customized_whatsapp_message !== "NOT_SENT"
  );

  const displayLeads = activeTab === "pending" ? pendingLeads : generatedLeads;

  const generateMessage = async (e: React.MouseEvent, placeId: string) => {
    e.stopPropagation();
    setGeneratingIds(prev => new Set(prev).add(placeId));
    try {
      const res = await fetch(`http://127.0.0.1:8000/leads/${placeId}/generate_message`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchLeads();
      } else {
        alert("Failed to generate message.");
      }
    } catch (err) {
      console.error("Error generating message", err);
      alert("Error generating message.");
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(placeId);
        return next;
      });
    }
  };

  const generateAll = async () => {
    for (const lead of pendingLeads) {
      // Create a synthetic event
      await generateMessage({ stopPropagation: () => {} } as any, lead.place_id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
        <div>
          <h2 className="text-[24px] font-[700] text-foreground">Personalized Message Generation</h2>
          <p className="text-[14px] text-text-mute mt-1">
            Configure the context of your company and view leads that need a customized message.
          </p>
        </div>

        <div className="bg-surface-raised border border-hairline-strong rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Company Context</h3>
          <p className="text-sm text-text-mute">
            Describe your company and what you offer. This context will be used to generate highly relevant WhatsApp messages for each lead.
          </p>
          <textarea
            value={companyContext}
            onChange={(e) => setCompanyContext(e.target.value)}
            className="w-full bg-surface border border-hairline-strong rounded-lg px-4 py-3 text-sm focus:outline-primary min-h-[120px] resize-y"
            placeholder="e.g. We are a digital marketing agency specializing in local SEO and lead generation..."
          />
          <div className="flex justify-end">
            <button
              onClick={saveContext}
              disabled={saving}
              className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-deep disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Context"}
            </button>
          </div>
        </div>

        <div className="bg-surface-raised border border-hairline-strong rounded-xl flex flex-col shadow-sm flex-1 overflow-hidden">
          <div className="flex border-b border-hairline-strong bg-surface">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${
                activeTab === "pending" ? "text-primary border-b-2 border-primary bg-surface-raised" : "text-text-mute hover:bg-surface-strong"
              }`}
            >
              Not Generated ({pendingLeads.length})
            </button>
            <button
              onClick={() => setActiveTab("generated")}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${
                activeTab === "generated" ? "text-primary border-b-2 border-primary bg-surface-raised" : "text-text-mute hover:bg-surface-strong"
              }`}
            >
              Generated ({generatedLeads.length})
            </button>
          </div>

          <div className="p-6 flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                {activeTab === "pending" ? "Leads Pending Personalization" : "Leads with Custom Messages"}
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={fetchLeads}
                  disabled={loading}
                  className="px-4 py-2 bg-surface-strong text-text border border-hairline-strong rounded-lg font-semibold text-sm hover:bg-hairline disabled:opacity-50"
                >
                  Refresh
                </button>
                {activeTab === "pending" && (
                  <button
                    onClick={generateAll}
                    disabled={loading || pendingLeads.length === 0 || generatingIds.size > 0}
                    className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-deep disabled:opacity-50 transition-colors"
                  >
                    Generate All
                  </button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="text-center p-8 text-text-mute">Loading leads...</div>
            ) : displayLeads.length === 0 ? (
              <div className="text-center p-8 text-text-mute bg-surface rounded-lg border border-hairline">
                {activeTab === "pending" 
                  ? "No leads currently need message generation. All leads have personalized messages!"
                  : "No messages have been generated yet. Go to the 'Not Generated' tab to generate some."
                }
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-hairline-strong">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-hairline-strong">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-foreground w-1/4">Company Name</th>
                      <th className="px-4 py-3 font-semibold text-foreground w-1/4">Address</th>
                      {activeTab === "generated" && (
                        <th className="px-4 py-3 font-semibold text-foreground w-1/3">Message Snippet</th>
                      )}
                      <th className="px-4 py-3 font-semibold text-foreground text-right w-[150px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {displayLeads.map((lead, i) => (
                      <tr 
                        key={i} 
                        className="hover:bg-surface-strong transition-colors cursor-pointer"
                        onClick={() => router.push(`/leads/${lead.place_id}`)}
                      >
                        <td className="px-4 py-4 text-foreground font-medium">{lead.company_name}</td>
                        <td className="px-4 py-4 text-text-mute truncate max-w-[200px]">{lead.address}</td>
                        {activeTab === "generated" && (
                          <td className="px-4 py-4 text-text-mute italic truncate max-w-[250px]">
                            {lead.customized_whatsapp_message}
                          </td>
                        )}
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={(e) => generateMessage(e, lead.place_id)}
                            disabled={generatingIds.has(lead.place_id)}
                            className="px-4 py-1.5 bg-primary/10 text-primary font-semibold rounded hover:bg-primary/20 disabled:opacity-50"
                          >
                            {generatingIds.has(lead.place_id) 
                              ? "Generating..." 
                              : activeTab === "generated" ? "Regenerate" : "Generate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
