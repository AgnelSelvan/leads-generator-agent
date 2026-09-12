"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LeadsMap = dynamic(() => import("@/components/LeadsMap"), { ssr: false });

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
  const [activeTab, setActiveTab] = useState<"chat" | "leads" | "keywords" | "map">("chat");
  const [keywords, setKeywords] = useState<{ id: number; keyword: string }[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [sessions, setSessions] = useState<{ session_id: string; title: string; timestamp: string }[]>([]);

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

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data || []);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const loadChatHistory = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/chat/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
        setSessionId(id);
        setActiveTab("chat");
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    setSessionId("");
    setMessages([]);
    setActiveTab("chat");
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
    fetchSessions();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
          fetchSessions();
        }
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
    <div className="min-h-screen bg-surface-raised text-text font-sans flex p-4 lg:p-6 gap-6 w-full max-w-[1440px] mx-auto animate-fade-in">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-surface text-text rounded-xl shadow-sm flex flex-col h-[calc(100vh-3rem)] flex-shrink-0 border border-hairline-strong overflow-hidden animate-slide-up">
        <div className="p-8 pb-6 border-b border-hairline">
          <h1 className="text-[24px] font-[700] text-balance text-foreground mb-4">
            Leads Agent
          </h1>
          <button 
            onClick={createNewChat}
            className="w-full bg-surface-strong text-foreground px-4 py-3 rounded-full font-[600] text-[14px] leading-none transition-all duration-200 hover:opacity-80 flex items-center justify-center gap-2 border border-hairline-strong"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Chat
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <div className="text-[11px] font-[700] text-text-mute uppercase tracking-wider px-4 pb-2 pt-2">Menu</div>
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full text-left px-5 py-3 rounded-full font-[600] text-[15px] leading-none transition-all duration-200 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2 ${
              activeTab === "chat"
                ? "bg-surface-strong text-foreground"
                : "text-text-mute hover:bg-surface-strong hover:text-foreground"
            }`}
          >
            Assistant
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`w-full text-left flex justify-between items-center px-5 py-3 rounded-full font-[600] text-[15px] leading-none transition-all duration-200 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2 ${
              activeTab === "leads"
                ? "bg-surface-strong text-foreground"
                : "text-text-mute hover:bg-surface-strong hover:text-foreground"
            }`}
          >
            Leads
            {Object.keys(groupedLeads).length > 0 && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-[700] tabular-nums ${
                activeTab === "leads" ? "bg-primary text-on-primary" : "bg-hairline text-foreground"
              }`}>
                {Object.values(groupedLeads).flat().length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("keywords")}
            className={`w-full text-left flex justify-between items-center px-5 py-3 rounded-full font-[600] text-[15px] leading-none transition-all duration-200 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2 ${
              activeTab === "keywords"
                ? "bg-surface-strong text-foreground"
                : "text-text-mute hover:bg-surface-strong hover:text-foreground"
            }`}
          >
            Keywords
            {keywords.length > 0 && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-[700] tabular-nums ${
                activeTab === "keywords" ? "bg-primary text-on-primary" : "bg-hairline text-foreground"
              }`}>
                {keywords.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`w-full text-left px-5 py-3 rounded-full font-[600] text-[15px] leading-none transition-all duration-200 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2 ${
              activeTab === "map"
                ? "bg-surface-strong text-foreground"
                : "text-text-mute hover:bg-surface-strong hover:text-foreground"
            }`}
          >
            Map View
          </button>
          
          {sessions.length > 0 && (
            <div className="pt-6">
              <div className="text-[11px] font-[700] text-text-mute uppercase tracking-wider px-4 pb-2">Recent Chats</div>
              <div className="space-y-1">
                {sessions.map(s => (
                  <button
                    key={s.session_id}
                    onClick={() => loadChatHistory(s.session_id)}
                    className={`w-full text-left px-5 py-2.5 rounded-full font-[500] text-[13px] leading-tight transition-all duration-200 truncate ${
                      sessionId === s.session_id && activeTab === "chat"
                        ? "bg-primary/10 text-primary"
                        : "text-text-mute hover:bg-surface-strong hover:text-foreground"
                    }`}
                  >
                    {s.title || "New Chat"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-surface rounded-xl shadow-sm border border-hairline-strong">
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-full">
            <div className="px-16 py-12 border-b border-hairline">
              <h2 className="text-[28px] font-[700] text-balance text-foreground tracking-tight leading-tight">
                Prospecting Assistant
              </h2>
              <p className="text-[16px] font-[400] text-text-mute mt-2">
                Describe your ideal target audience and location.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-16 py-8 space-y-6 bg-surface">
              {messages.length === 0 && (
                <div className="flex justify-center mt-10">
                  <div className="text-text-mute text-[16px] p-6 rounded-lg bg-surface-raised border border-hairline w-full text-center max-w-2xl">
                    Awaiting instructions. Example: &quot;Find software agencies in 10001.&quot;
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[70%] animate-message-pop ${
                    msg.role === "user"
                      ? "self-end items-end ml-auto"
                      : "mr-auto"
                  }`}
                >
                  <span className="text-[12px] font-[600] text-text-mute mb-2 px-1">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </span>
                  <div
                    className={`p-5 text-[16px] font-[400] leading-relaxed rounded-2xl ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary shadow-sm rounded-tr-sm"
                        : "bg-surface-raised text-text border border-hairline rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mr-auto flex flex-col max-w-[70%]">
                   <span className="text-[12px] font-[600] text-text-mute mb-2 px-1">
                    Assistant
                  </span>
                  <div className="p-5 text-[16px] font-[400] bg-surface-raised text-text rounded-2xl rounded-tl-sm border border-hairline animate-pulse">
                    Processing request...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-8 px-16 bg-surface border-t border-hairline">
              <form onSubmit={sendMessage} className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
                <div className="relative flex items-center bg-surface-raised rounded-2xl border border-hairline-strong focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground transition-all duration-200 p-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-[16px] font-[400] focus:outline-none resize-none min-h-[60px] text-text placeholder:text-text-mute"
                    placeholder="Ask the assistant to find leads..."
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e as any);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-4 bottom-4 bg-primary text-on-primary h-[48px] px-6 rounded-full text-[16px] font-[600] hover:bg-primary-deep transition-colors duration-200 disabled:opacity-50 disabled:bg-hairline flex items-center justify-center"
                  >
                    Send
                  </button>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[13px] font-[400] text-text-mute">Press Enter to send, Shift+Enter for new line</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div className="flex-1 flex flex-col h-full">
            <div className="px-16 py-12 border-b border-hairline flex justify-between items-center bg-surface">
              <div>
                <h2 className="text-[28px] font-[700] text-balance text-foreground tracking-tight leading-tight">
                  Discovered Leads
                </h2>
                <p className="text-[16px] font-[400] text-text-mute mt-2">
                  Browse and filter your generated leads.
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-raised rounded-full px-5 py-3 font-[400] text-[14px] focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-0 text-text border border-hairline-strong min-w-[200px]"
                />
                <select 
                  value={selectedPincode}
                  onChange={(e) => setSelectedPincode(e.target.value)}
                  className="bg-surface-raised rounded-full px-5 py-3 font-[400] text-[14px] focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-0 text-text border border-hairline-strong min-w-[150px] appearance-none"
                >
                  <option value="All">All Pincodes</option>
                  {allPincodes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={fetchLeads}
                  className="bg-surface text-foreground px-5 py-3 rounded-full font-[600] text-[14px] border border-hairline-strong hover:bg-surface-raised transition-colors duration-200 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-16 bg-surface">
              {allLeads.length === 0 ? (
                <div className="flex justify-center mt-10">
                  <div className="text-text-mute font-[400] text-[16px] p-8 rounded-2xl bg-surface-raised border border-hairline text-center w-full max-w-2xl">
                    No leads found matching your criteria.
                  </div>
                </div>
              ) : (
                <div className="bg-surface rounded-xl shadow-sm border border-hairline-strong overflow-hidden">
                  <table className="w-full text-left text-[14px] font-[400] text-text">
                    <thead className="bg-surface-raised border-b border-hairline">
                      <tr>
                        <th className="px-6 py-4 font-[600] text-foreground">Company</th>
                        <th className="px-6 py-4 font-[600] text-foreground">Category</th>
                        <th className="px-6 py-4 font-[600] text-foreground">Contact</th>
                        <th className="px-6 py-4 font-[600] text-foreground">Address & Pincode</th>
                        <th className="px-6 py-4 font-[600] text-foreground text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {allLeads.map((lead, index) => (
                        <tr key={index} className="hover:bg-surface-raised transition-colors cursor-pointer group" onClick={() => router.push(`/leads/${lead.place_id}`)}>
                          <td className="px-6 py-5 font-[600] text-foreground group-hover:text-primary transition-colors">
                            {lead.company_name}
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[11px] font-[600] text-foreground bg-surface border border-hairline-strong px-3 py-1 rounded-full uppercase tracking-wider">
                              {lead.category}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-[500] text-foreground">{lead.mobile_no || "No Phone"}</div>
                            <div className="text-[13px] text-text-mute truncate max-w-[150px] mt-1">{lead.email || "No Email"}</div>
                          </td>
                          <td className="px-6 py-5 max-w-[200px] truncate">
                            <div className="font-[500] text-foreground truncate">{lead.address}</div>
                            <div className="text-[13px] text-text-mute mt-1">Pincode: {lead.pincode}</div>
                          </td>
                          <td className="px-6 py-5 font-[600] text-foreground tabular-nums text-right flex items-center justify-end gap-1">
                            <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            {lead.rating}
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
            <div className="px-16 py-12 border-b border-hairline bg-surface">
              <h2 className="text-[28px] font-[700] text-balance text-foreground tracking-tight leading-tight">
                Keywords
              </h2>
              <p className="text-[16px] font-[400] text-text-mute mt-2">
                Manage target keywords for lead generation.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-16 bg-surface flex flex-col items-center">
              <div className="w-full max-w-3xl">
                <form onSubmit={addKeyword} className="mb-12 flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="flex-1 bg-surface-raised rounded-full px-6 py-4 font-[400] text-[16px] focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-0 text-text placeholder:text-text-mute border border-hairline-strong shadow-sm"
                    placeholder="Enter a new keyword..."
                    disabled={keywordLoading}
                  />
                  <button
                    type="submit"
                    disabled={keywordLoading || !newKeyword.trim()}
                    className="bg-primary text-on-primary px-8 py-4 rounded-full font-[600] text-[16px] hover:opacity-90 transition-colors duration-200 disabled:opacity-50 whitespace-nowrap focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2 shadow-sm"
                  >
                    Add Keyword
                  </button>
                </form>

                {keywords.length === 0 ? (
                  <div className="flex justify-center">
                    <div className="text-text-mute font-[400] text-[16px] p-8 rounded-2xl bg-surface-raised border border-hairline w-full text-center">
                      No keywords found. Add one above.
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl shadow-sm border border-hairline-strong overflow-hidden">
                    <table className="w-full text-left text-[14px] font-[400] text-text">
                      <thead className="bg-surface-raised border-b border-hairline">
                        <tr>
                          <th className="px-8 py-5 font-[600] text-foreground">ID</th>
                          <th className="px-8 py-5 font-[600] w-full text-foreground">Keyword</th>
                          <th className="px-8 py-5 font-[600] text-right text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {keywords.map((kw) => (
                          <tr key={kw.id} className="hover:bg-surface-raised transition-colors group">
                            <td className="px-8 py-6 text-[12px] text-text-mute tabular-nums">{kw.id}</td>
                            <td className="px-8 py-6 font-[600] text-foreground group-hover:text-primary transition-colors">{kw.keyword}</td>
                            <td className="px-8 py-6 text-right">
                              <button
                                onClick={() => deleteKeyword(kw.id)}
                                className="text-text-mute hover:text-primary font-[600] text-[14px] transition-colors duration-200 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2 px-3 py-1 rounded-full"
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

        {activeTab === "map" && (
          <div className="flex-1 flex flex-col h-full bg-surface animate-fade-in">
            <div className="px-16 py-12 border-b border-hairline flex justify-between items-center">
              <div>
                <h2 className="text-[28px] font-[700] text-balance text-foreground tracking-tight leading-tight">
                  Lead Locations
                </h2>
                <p className="text-[16px] font-[400] text-text-mute mt-2">
                  Interactive map view of all discovered leads.
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <select 
                  value={selectedPincode}
                  onChange={(e) => setSelectedPincode(e.target.value)}
                  className="bg-surface-raised rounded-full px-5 py-3 font-[400] text-[14px] focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-0 text-text border border-hairline-strong min-w-[150px] appearance-none"
                >
                  <option value="All">All Pincodes</option>
                  {allPincodes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex-1 p-8 bg-surface-raised relative z-0">
              <LeadsMap leads={allLeads} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
