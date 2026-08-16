import React, { useState } from 'react';
import { Mail, Zap, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../api';
import { useToast } from '../context/ToastContext';

export function NewsletterBlock() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetchApi('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.success) {
        setSubscribed(true);
        addToast(res.message, 'success');
        setEmail('');
      }
    } catch (err) {
      addToast(err.message || 'Subscription failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-wagh-teal text-white py-14 px-4 sm:px-6 lg:px-8 my-16 rounded-3xl relative overflow-hidden shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-wagh-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-wagh-teal-light/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-wagh-gold/20 text-wagh-gold font-mono-tag text-xs font-bold uppercase tracking-widest border border-wagh-gold/30">
          <Zap className="w-3.5 h-3.5 fill-wagh-gold" />
          <span>WAGH Insider Circle</span>
        </div>

        <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Get ₹200 OFF Your First WAGH Order
        </h2>

        <p className="text-gray-200 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Join 100,000+ power users. Be the first to receive flash deals on 45W Chargers, early access to new flagship launches, and secret insider discounts.
        </p>

        {subscribed ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-md mx-auto flex items-center justify-center gap-3 text-wagh-gold font-bold">
            <CheckCircle2 className="w-6 h-6 text-wagh-gold" />
            <span>You're in! Check your inbox for your ₹200 coupon code.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <div className="relative w-full">
              <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white text-wagh-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wagh-gold text-sm font-medium shadow-md"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-wagh-gold text-wagh-dark font-extrabold text-sm hover:bg-wagh-gold-light transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 shrink-0"
            >
              {submitting ? 'Joining...' : 'Subscribe'}
            </button>
          </form>
        )}

        <p className="text-xs text-gray-300 font-mono-tag">
          No spam, ever. Unsubscribe at any time with a single click.
        </p>
      </div>
    </section>
  );
}
