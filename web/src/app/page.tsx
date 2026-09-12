"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Lead {
  pincode: string;
  place_id: string;
  company_name: string;
  address: string;
  website: string;
  mobile_no: string;
  email: string;
  country_code: string;
  latitude: string;
  longitude: string;
  rating: string;
  category: string;
  about_the_company: string;
  customized_whatsapp_message: string;
}

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [groupedLeads, setGroupedLeads] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"chat" | "leads" | "keywords">("chat");
  const [keywords, setKeywords] = useState<{ id: number; keyword: string }[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);

  // New state variables for Leads UI
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPincode, setSelectedPincode] = useState<string>("All");

  const fetchLeads = async () => {
    try {
      const res = await fetch("http://localhost:8000/leads");
      if (res.ok) {
        const data = await res.json();
        setGroupedLeads(data.grouped_leads || {});
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await fetch("http://localhost:8000/keywords");
      if (res.ok) {
        const data = await res.json();
        setKeywords(data || []);
      }
    } catch (err) {
      console.error("Error fetching keywords:", err);
    }
  };

  const addKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setKeywordLoading(true);
    try {
      const res = await fetch("http://localhost:8000/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim() })
      });
      if (res.ok) {
        setNewKeyword("");
        fetchKeywords();
      }
    } catch (err) {
      console.error("Error adding keyword:", err);
    } finally {
      setKeywordLoading(false);
    }
  };

  const deleteKeyword = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/keywords/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchKeywords();
      }
    } catch (err) {
      console.error("Error deleting keyword:", err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchKeywords();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const payload: any = { message: userMessage.content };
      if (sessionId) payload.session_id = sessionId;

      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
        if (data.session_id && !sessionId) {
          setSessionId(data.session_id);
        }
        
        // Refetch leads in case new ones were generated
        fetchLeads();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error communicating with the agent. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Compute leads for table view
  const allPincodes = Object.keys(groupedLeads);
  let allLeads: Lead[] = [];
  if (selectedPincode === "All") {
    Object.values(groupedLeads).forEach(leads => allLeads.push(...leads));
  } else {
    allLeads = groupedLeads[selectedPincode] || [];
  }
  
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    allLeads = allLeads.filter(l => 
      l.company_name?.toLowerCase().includes(q) || 
      l.address?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans flex p-4 lg:p-6 gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-surface rounded-xl shadow-md flex flex-col h-[calc(100vh-3rem)] flex-shrink-0 border border-gray-200">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
            Agent System
          </h1>
        </div>
        <nav className="flex-1 flex flex-col p-4 space-y-3">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full text-left px-6 py-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === "chat"
                ? "bg-primary text-white shadow-inner bg-gray-50"
                : "bg-surface text-text hover:shadow-sm"
            }`}
          >
            Chat Interface
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`w-full text-left flex justify-between items-center px-6 py-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === "leads"
                ? "bg-primary text-white shadow-inner bg-gray-50"
                : "bg-surface text-text hover:shadow-sm"
            }`}
          >
            Leads List
            {Object.keys(groupedLeads).length > 0 && (
              <span className={`text-xs px-3 py-1 font-mono rounded-full font-bold ${
                activeTab === "leads" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}>
                {Object.values(groupedLeads).flat().length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("keywords")}
            className={`w-full text-left flex justify-between items-center px-6 py-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === "keywords"
                ? "bg-primary text-white shadow-inner bg-gray-50"
                : "bg-surface text-text hover:shadow-sm"
            }`}
          >
            Keywords
            {keywords.length > 0 && (
              <span className={`text-xs px-3 py-1 font-mono rounded-full font-bold ${
                activeTab === "keywords" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}>
                {keywords.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-surface rounded-xl shadow-md border border-gray-200">
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-full">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-3xl font-display font-bold text-text">
                Prospecting Assistant
              </h2>
              <p className="text-sm font-sans font-medium text-text/70 mt-1">
                Describe your ideal target audience and location.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-background">
              {messages.length === 0 && (
                <div className="flex justify-center mt-10">
                  <div className="text-text/60 font-mono text-sm p-6 rounded-xl shadow-sm bg-surface border border-gray-200">
                    Awaiting instructions. Example: "Find software agencies in 10001."
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[80%] ${
                    msg.role === "user"
                      ? "self-end items-end ml-auto"
                      : "mr-auto"
                  }`}
                >
                  <span className="text-xs font-bold text-text/50 mb-2 px-2">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </span>
                  <div
                    className={`p-5 text-base font-medium leading-relaxed rounded-xl ${
                      msg.role === "user"
                        ? "bg-primary text-white shadow-sm rounded-tr-sm"
                        : "bg-surface text-text shadow-sm rounded-tl-sm border border-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mr-auto flex flex-col max-w-[80%]">
                   <span className="text-xs font-bold text-text/50 mb-2 px-2">
                    Assistant
                  </span>
                  <div className="p-5 text-base font-medium bg-surface text-text shadow-sm rounded-xl rounded-tl-sm border border-gray-200 animate-pulse">
                    Processing request...
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-surface border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex flex-col gap-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-background rounded-xl shadow-inner bg-gray-50 p-6 text-base font-sans focus:outline-none resize-none min-h-[120px] text-text placeholder:text-text/40 border-none"
                  placeholder="Ask the assistant to find leads..."
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e as any);
                    }
                  }}
                />
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-mono font-medium text-text/50">Press Enter to send, Shift+Enter for new line</span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-white px-8 py-3 rounded-lg text-base font-bold shadow-md hover:shadow-sm active:shadow-inner bg-gray-50 transition-all duration-300 disabled:opacity-50"
                  >
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div className="flex-1 flex flex-col h-full">
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-3xl font-display font-bold text-text">
                Discovered Leads
              </h2>
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface rounded-lg shadow-inner bg-gray-50 px-4 py-2 font-sans font-medium focus:outline-none text-text placeholder:text-text/40 border-none text-sm"
                />
                <select 
                  value={selectedPincode}
                  onChange={(e) => setSelectedPincode(e.target.value)}
                  className="bg-surface rounded-lg shadow-inner bg-gray-50 px-4 py-2 font-sans font-medium focus:outline-none text-text border-none text-sm"
                >
                  <option value="All">All Pincodes</option>
                  {allPincodes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={fetchLeads}
                  className="bg-surface text-primary px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-sm active:shadow-inner bg-gray-50 transition-all duration-300 border border-gray-200 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-background">
              {allLeads.length === 0 ? (
                <div className="flex justify-center mt-10">
                  <div className="text-text/60 font-sans font-medium text-lg p-8 rounded-xl shadow-sm bg-surface border border-gray-200">
                    No leads found matching your criteria.
                  </div>
                </div>
              ) : (
                <div className="bg-surface rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm text-text">
                    <thead className="bg-background border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-display font-bold text-text/60">Company</th>
                        <th className="px-6 py-4 font-display font-bold text-text/60">Category</th>
                        <th className="px-6 py-4 font-display font-bold text-text/60">Contact</th>
                        <th className="px-6 py-4 font-display font-bold text-text/60">Address & Pincode</th>
                        <th className="px-6 py-4 font-display font-bold text-text/60">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allLeads.map((lead, index) => (
                        <tr key={index} className="hover:bg-background/20 transition-colors cursor-pointer" onClick={() => router.push(`/leads/${lead.place_id}`)}>
                          <td className="px-6 py-4 font-sans font-semibold">
                            {lead.company_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-white bg-primary/90 px-2 py-1 rounded-md shadow-sm">
                              {lead.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-text/80">
                            <div>{lead.mobile_no || "No Phone"}</div>
                            <div className="text-xs text-text/50 truncate max-w-[150px]">{lead.email || "No Email"}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-text/80 max-w-[200px] truncate">
                            {lead.address}
                            <div className="text-xs text-text/50 mt-1">Pincode: {lead.pincode}</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-primary">
                            ? {lead.rating}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "keywords" && (
          <div className="flex-1 flex flex-col h-full">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-3xl font-display font-bold text-text">
                Keywords
              </h2>
              <p className="text-sm font-sans font-medium text-text/70 mt-1">
                Manage target keywords for lead generation.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-background flex flex-col items-center">
              <div className="w-full max-w-3xl">
                <form onSubmit={addKeyword} className="mb-12 flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="flex-1 bg-surface rounded-lg shadow-inner bg-gray-50 px-6 py-4 font-sans font-medium focus:outline-none text-text placeholder:text-text/40 border-none"
                    placeholder="Enter a new keyword..."
                    disabled={keywordLoading}
                  />
                  <button
                    type="submit"
                    disabled={keywordLoading || !newKeyword.trim()}
                    className="bg-primary text-white px-8 py-4 rounded-lg font-bold shadow-md hover:shadow-sm active:shadow-inner bg-gray-50 transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                  >
                    Add Keyword
                  </button>
                </form>

                {keywords.length === 0 ? (
                  <div className="flex justify-center">
                    <div className="text-text/60 font-sans font-medium text-lg p-8 rounded-xl shadow-sm bg-surface border border-gray-200 w-full text-center">
                      No keywords found. Add one above.
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-base text-text">
                      <thead className="bg-background border-b border-gray-200">
                        <tr>
                          <th className="px-8 py-5 font-display font-bold text-text/60">ID</th>
                          <th className="px-8 py-5 font-display font-bold text-text/60 w-full">Keyword</th>
                          <th className="px-8 py-5 font-display font-bold text-text/60 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {keywords.map((kw) => (
                          <tr key={kw.id} className="hover:bg-background/20 transition-colors">
                            <td className="px-8 py-5 font-mono text-sm font-medium text-text/50">{kw.id}</td>
                            <td className="px-8 py-5 font-sans font-semibold text-lg">{kw.keyword}</td>
                            <td className="px-8 py-5 text-center">
                              <button
                                onClick={() => deleteKeyword(kw.id)}
                                className="bg-surface text-danger px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-inner bg-gray-50 transition-all duration-300 border border-gray-200"
                              >
                                Remove
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
        )}
      </div>
    </div>
  );
}
