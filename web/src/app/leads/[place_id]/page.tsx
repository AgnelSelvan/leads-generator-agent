"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
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
  latitude: number;
  longitude: number;
  rating: number;
  category: string;
  about_the_company: string;
  customized_whatsapp_message: string;
  place_url: string;
  social_media: string;
  featured_image_url: string;
  reservation_url: string;
  number_of_reviews: number;
  number_of_images: number;
  price_level: string;
  opening_hours: string;
  service_options: string;
  highlights: string;
  accessibility: string;
  payment_types: string;
}

export default function LeadDetailsPage({ params }: { params: Promise<{ place_id: string }> }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Unwrap the params Promise
  const unwrappedParams = use(params);
  const { place_id } = unwrappedParams;

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/leads/${place_id}`);
        if (res.ok) {
          const data = await res.json();
          setLead(data);
        } else {
          setError("Lead not found.");
        }
      } catch (err) {
        console.error("Error fetching lead:", err);
        setError("Error connecting to server.");
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [place_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-raised flex items-center justify-center p-6 font-sans animate-fade-in">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text font-[600]">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-surface-raised flex flex-col items-center justify-center p-6 font-sans animate-fade-in">
        <div className="bg-surface rounded-2xl shadow-sm p-8 border border-hairline-strong text-center max-w-md w-full animate-slide-up">
          <h2 className="text-[28px] font-[700] text-primary mb-4">Error</h2>
          <p className="text-text-mute mb-6 font-[400] text-[16px]">{error || "Lead not found."}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-on-primary px-8 py-4 rounded-full font-[600] text-[16px] hover:bg-primary-deep transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-raised text-text font-sans p-4 lg:p-8 animate-fade-in">
      <div className="max-w-[1200px] mx-auto animate-slide-up">
        {/* Header Navigation */}
        <div className="flex items-center gap-6 mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-12 h-12 bg-surface rounded-full shadow-sm border border-hairline-strong text-foreground hover:bg-surface-raised transition-all duration-200 focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-2 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-[32px] font-[700] text-foreground tracking-tight leading-none mb-1">Lead Details</h1>
            <p className="text-[14px] text-text-mute font-[500]">Place ID: {lead.place_id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Header Card */}
            <div className="bg-surface rounded-2xl shadow-sm border border-hairline-strong p-10 hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div>
                  <h2 className="text-[40px] leading-tight tracking-tight font-[700] text-foreground mb-4 text-balance">{lead.company_name}</h2>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-[13px] font-[700] text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-wider">
                      {lead.category}
                    </span>
                    <span className="text-[15px] font-[700] text-foreground flex items-center gap-1.5 bg-surface-raised border border-hairline px-3 py-1.5 rounded-full">
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      {lead.rating} <span className="text-[13px] text-text-mute font-[500] ml-1">({lead.number_of_reviews} reviews)</span>
                    </span>
                  </div>
                </div>
                {lead.place_url && lead.place_url !== "N/A" && (
                  <a
                    href={lead.place_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-surface text-foreground border border-hairline-strong px-6 py-3 rounded-full hover:bg-surface-raised font-[600] text-[15px] transition-all duration-200 flex items-center gap-2 hover:scale-105"
                  >
                    View on Maps
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                )}
              </div>
              
              <div className="text-[16px] text-text leading-relaxed font-[400]">
                {lead.about_the_company || lead.highlights || "No description provided for this business."}
              </div>
            </div>

            {/* AI Generated Message */}
            <div className="bg-surface rounded-2xl shadow-sm border border-hairline-strong p-10 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-[22px] font-[700] text-foreground mb-6 flex items-center gap-3">
                <span className="text-[24px]">✨</span> Customized AI Pitch
              </h3>
              <div className="bg-surface-raised rounded-2xl p-8 text-[16px] text-text font-[400] italic border border-hairline relative before:content-[''] before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:bg-primary before:rounded-r-full">
                "{lead.customized_whatsapp_message}"
              </div>
              <div className="mt-8 flex justify-end">
                <a
                  href={`https://wa.me/${lead.mobile_no.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(lead.customized_whatsapp_message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-on-primary px-8 py-4 rounded-full font-[600] text-[16px] hover:bg-primary-deep transition-all duration-200 flex items-center gap-2 shadow-sm hover:scale-105 hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Send via WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="flex flex-col gap-8">
            {/* Contact Card */}
            <div className="bg-surface rounded-2xl shadow-sm border border-hairline-strong p-8 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-[20px] font-[700] text-foreground mb-6">Contact Info</h3>
              <div className="flex flex-col gap-5 text-[15px]">
                <div className="group">
                  <span className="text-[13px] font-[600] text-text-mute uppercase tracking-wider block mb-1.5">Phone Number</span>
                  <span className="text-foreground font-[600]">{lead.mobile_no || "N/A"}</span>
                </div>
                <div className="h-px bg-hairline-strong"></div>
                <div className="group">
                  <span className="text-[13px] font-[600] text-text-mute uppercase tracking-wider block mb-1.5">Email Address</span>
                  <span className="text-foreground font-[600] break-all">{lead.email || "N/A"}</span>
                </div>
                <div className="h-px bg-hairline-strong"></div>
                <div className="group">
                  <span className="text-[13px] font-[600] text-text-mute uppercase tracking-wider block mb-1.5">Website</span>
                  {lead.website && lead.website !== "N/A" ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary font-[600] break-all hover:underline underline-offset-4 decoration-2 decoration-primary/30 hover:decoration-primary transition-all">
                      {lead.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-foreground font-[600]">N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-surface rounded-2xl shadow-sm border border-hairline-strong p-8 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-[20px] font-[700] text-foreground mb-6">Location</h3>
              <div className="flex flex-col gap-5 text-[15px]">
                <div>
                  <span className="text-[13px] font-[600] text-text-mute uppercase tracking-wider block mb-1.5">Address</span>
                  <span className="text-foreground font-[600] leading-relaxed">{lead.address || "N/A"}</span>
                </div>
                <div className="h-px bg-hairline-strong"></div>
                <div>
                  <span className="text-[13px] font-[600] text-text-mute uppercase tracking-wider block mb-1.5">Pincode</span>
                  <span className="text-foreground font-[600] bg-surface-raised px-3 py-1 rounded-full border border-hairline">{lead.pincode || "N/A"}</span>
                </div>
                {lead.latitude !== 0 && lead.longitude !== 0 && (
                  <>
                    <div className="h-px bg-hairline-strong"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[13px] font-[600] text-text-mute uppercase tracking-wider block mb-1.5">Latitude</span>
                        <span className="text-foreground font-[600] font-mono text-[14px] bg-surface-raised px-2 py-1 rounded-md">{lead.latitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-[13px] font-[600] text-text-mute uppercase tracking-wider block mb-1.5">Longitude</span>
                        <span className="text-foreground font-[600] font-mono text-[14px] bg-surface-raised px-2 py-1 rounded-md">{lead.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
