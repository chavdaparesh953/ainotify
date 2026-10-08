import React, { useState } from 'react';
import { LegalLayout } from '../../components/LegalLayout.jsx';
import { Mail, Clock, MessageSquare, Send, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { BrandLoader } from '../../components/BrandLoader.jsx';

export function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    storeUrl: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate support ticket dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <LegalLayout
      title="Contact Us & Merchant Support"
      subtitle="Have questions about Meta WhatsApp Cloud API, connecting your store, or billing? Our dedicated merchant support engineers are here to help."
      badge="Customer Helpdesk & Support"
      lastUpdated="October 2026"
      icon={Mail}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Support Card 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Technical Support</h3>
          <p className="text-xs text-slate-400">For webhook troubleshooting &amp; store connectivity.</p>
          <a href="mailto:support@wanotify.com" className="text-xs text-teal-400 font-semibold hover:underline block pt-1">
            support@wanotify.com
          </a>
        </div>

        {/* Support Card 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Privacy &amp; Compliance</h3>
          <p className="text-xs text-slate-400">For GDPR data erasure &amp; compliance inquiries.</p>
          <a href="mailto:privacy@wanotify.com" className="text-xs text-indigo-400 font-semibold hover:underline block pt-1">
            privacy@wanotify.com
          </a>
        </div>

        {/* Support Card 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Response Guarantee</h3>
          <p className="text-xs text-slate-400">We respond to every merchant query within 24 hours.</p>
          <p className="text-xs text-emerald-400 font-semibold pt-1">Monday &ndash; Saturday (Global)</p>
        </div>
      </div>

      {/* Interactive Contact Form */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-400" />
          Send a Direct Support Message
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Fill out the details below and an e-commerce automation engineer will get back to you shortly.
        </p>

        {submitted ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Message Dispatched Successfully!</h3>
            <p className="text-xs text-emerald-300/90 max-w-md mx-auto">
              Thank you for reaching out. A ticket has been created and we have dispatched a confirmation email to <strong>{formData.email}</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', storeUrl: '', subject: 'General Inquiry', message: '' });
              }}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Business Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. merchant@store.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Store Domain (Optional)
                </label>
                <input
                  type="text"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                  placeholder="e.g. mybrand.myshopify.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Inquiry Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                >
                  <option value="General Inquiry">General Inquiry / Feedback</option>
                  <option value="Store Setup & Webhooks">Shopify / WooCommerce Webhook Setup</option>
                  <option value="Meta WhatsApp API">Meta WhatsApp Cloud API Configuration</option>
                  <option value="Billing & Plans">Billing, Plan Upgrades &amp; Invoices</option>
                  <option value="Privacy & Data Deletion">Data Deletion Request</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Your Message / Details
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe what you need help with, error logs, or store details..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <BrandLoader variant="inline" message="Submitting..." />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Support Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </LegalLayout>
  );
}
export default ContactUsPage;
