import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Send, MessageSquare, CheckCircle2, Navigation } from 'lucide-react';
import { fetchApi } from '../api';
import { useToast } from '../context/ToastContext';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetchApi('/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setSubmitted(true);
        addToast(res.message, 'success');
        setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
      }
    } catch (err) {
      addToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
          Customer Support & Inquiries
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl font-extrabold text-wagh-dark">
          We're Here to Help
        </h1>
        <p className="text-wagh-muted text-sm sm:text-base">
          Have questions about your 45W charger, warranty claim, or order tracking? Send us a message or reach out directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-4">
            <h3 className="font-editorial text-xl font-bold text-wagh-dark border-b border-wagh-border pb-3">
              Direct Channels
            </h3>

            <div className="space-y-4 text-sm text-wagh-dark">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wagh-teal/10 text-wagh-teal flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Phone Support</span>
                  <span className="font-bold">+91 90544 05305</span>
                  <span className="text-xs text-wagh-muted block">Mon–Sat: 9:30 AM – 7:00 PM IST</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wagh-teal/10 text-wagh-teal flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Official Website</span>
                  <a href="https://www.waghonline.in" target="_blank" rel="noreferrer" className="font-bold text-wagh-teal hover:underline">
                    www.waghonline.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wagh-teal/10 text-wagh-teal flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Email Support</span>
                  <span className="font-bold">waghonline9@gmail.com</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wagh-teal/10 text-wagh-teal flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-xs font-mono-tag text-wagh-muted uppercase block">Headquarters & Store</span>
                    <span className="font-bold text-xs sm:text-sm text-wagh-dark leading-snug block">
                      6VGR+92G, Surat &ndash; Kamrej Hwy, Silver Point, Moti Nagar, Nana Varachha, Surat, Gujarat 395013
                    </span>
                  </div>

                  {/* Compact Maps Widget & Directions Button */}
                  <div className="space-y-2 pt-1">
                    <div className="relative rounded-xl overflow-hidden border border-wagh-border h-36 w-full group shadow-inner">
                      <iframe
                        title="WAGH Mobile Accessories Store Location"
                        src="https://maps.google.com/maps?q=21.2259373,72.8900723&t=&z=16&ie=UTF8&iwloc=&output=embed"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full"
                      />
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=21.2259373,72.8900723"
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-transparent opacity-0 group-hover:bg-wagh-dark/20 transition-opacity flex items-center justify-center"
                        title="Open in Google Maps"
                      >
                        <span className="bg-wagh-dark/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-wagh-gold" />
                          <span>Open Map</span>
                        </span>
                      </a>
                    </div>

                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=21.2259373,72.8900723"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wagh-teal/10 hover:bg-wagh-teal hover:text-white text-wagh-teal font-bold text-xs transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get Directions on Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-wagh-border shadow-soft space-y-6">
          <h3 className="font-editorial text-2xl font-bold text-wagh-dark flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-wagh-teal" />
            <span>Send Us a Message</span>
          </h3>

          {submitted ? (
            <div className="p-8 text-center space-y-4 bg-wagh-teal/5 rounded-2xl border border-wagh-teal/20">
              <CheckCircle2 className="w-12 h-12 text-wagh-teal mx-auto" />
              <h4 className="font-editorial text-2xl font-bold text-wagh-teal">Message Received!</h4>
              <p className="text-sm text-wagh-muted">
                Thank you for contacting WAGH Mobile Accessories. Our support executive will respond to your email within 4 business hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 rounded-full bg-wagh-teal text-white font-bold text-xs"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Devang Panchal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    placeholder="devang@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Tracking">Order Tracking</option>
                    <option value="Warranty Claim">Warranty Claim (6 Mo)</option>
                    <option value="Bulk/Corporate Order">Bulk / Corporate Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we assist you with WAGH products?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-full bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Sending...' : 'Submit Message'}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
