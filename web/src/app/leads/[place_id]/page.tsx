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
        const res = await fetch(`http://localhost:8000/leads/${place_id}`);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text font-medium">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-surface rounded-xl shadow-md p-8 border border-gray-200 text-center max-w-md w-full">
          <h2 className="text-2xl font-display font-bold text-danger mb-4">Error</h2>
          <p className="text-text/70 mb-6">{error || "Lead not found."}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-sm transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 bg-surface rounded-lg shadow-sm border border-gray-200 text-text hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-text">Lead Details</h1>
            <p className="text-sm text-text/60 font-medium">Place ID: {lead.place_id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Header Card */}
            <div className="bg-surface rounded-xl shadow-md border border-gray-200 p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="text-4xl font-display font-bold text-primary mb-2">{lead.company_name}</h2>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-bold text-white bg-primary/90 px-3 py-1 rounded-md shadow-sm">
                      {lead.category}
                    </span>
                    <span className="font-mono text-sm font-bold text-warning flex items-center gap-1 bg-warning/10 px-2 py-1 rounded-md">
                      ★ {lead.rating} <span className="text-xs text-text/50">({lead.number_of_reviews} reviews)</span>
                    </span>
                  </div>
                </div>
                {lead.place_url && lead.place_url !== "N/A" && (
                  <a
                    href={lead.place_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-surface text-primary border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:shadow-inner hover:bg-gray-50 font-bold text-sm transition-all"
                  >
                    View on Maps
                  </a>
                )}
              </div>
              
              <div className="text-base text-text/80 leading-relaxed font-medium">
                {lead.about_the_company || lead.highlights || "No description provided."}
              </div>
            </div>

            {/* AI Generated Message */}
            <div className="bg-surface rounded-xl shadow-md border border-gray-200 p-8">
              <h3 className="text-xl font-display font-bold text-text mb-4 flex items-center gap-2">
                <span className="text-success">✨</span> Customized WhatsApp Message
              </h3>
              <div className="bg-background rounded-lg shadow-inner bg-gray-50 p-6 text-base text-text/80 font-medium italic border border-gray-200">
                "{lead.customized_whatsapp_message}"
              </div>
              <div className="mt-4 flex justify-end">
                <a
                  href={`https://wa.me/${lead.mobile_no.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(lead.customized_whatsapp_message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-success text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-sm transition-all"
                >
                  Send via WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="flex flex-col gap-8">
            {/* Contact Card */}
            <div className="bg-surface rounded-xl shadow-md border border-gray-200 p-8">
              <h3 className="text-xl font-display font-bold text-text mb-6">Contact Info</h3>
              <div className="flex flex-col gap-4 font-medium text-sm">
                <div>
                  <span className="text-text/50 block mb-1">Phone Number</span>
                  <span className="text-text font-semibold text-base">{lead.mobile_no || "N/A"}</span>
                </div>
                <div className="h-px bg-gray-100"></div>
                <div>
                  <span className="text-text/50 block mb-1">Email Address</span>
                  <span className="text-text font-semibold text-base break-all">{lead.email || "N/A"}</span>
                </div>
                <div className="h-px bg-gray-100"></div>
                <div>
                  <span className="text-text/50 block mb-1">Website</span>
                  {lead.website && lead.website !== "N/A" ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold text-base break-all hover:underline">
                      {lead.website}
                    </a>
                  ) : (
                    <span className="text-text font-semibold text-base">N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-surface rounded-xl shadow-md border border-gray-200 p-8">
              <h3 className="text-xl font-display font-bold text-text mb-6">Location</h3>
              <div className="flex flex-col gap-4 font-medium text-sm">
                <div>
                  <span className="text-text/50 block mb-1">Address</span>
                  <span className="text-text font-semibold text-base leading-relaxed">{lead.address || "N/A"}</span>
                </div>
                <div className="h-px bg-gray-100"></div>
                <div>
                  <span className="text-text/50 block mb-1">Pincode</span>
                  <span className="text-text font-semibold text-base">{lead.pincode || "N/A"}</span>
                </div>
                {lead.latitude !== 0 && lead.longitude !== 0 && (
                  <>
                    <div className="h-px bg-gray-100"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-text/50 block mb-1">Latitude</span>
                        <span className="text-text font-semibold">{lead.latitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-text/50 block mb-1">Longitude</span>
                        <span className="text-text font-semibold">{lead.longitude.toFixed(6)}</span>
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
