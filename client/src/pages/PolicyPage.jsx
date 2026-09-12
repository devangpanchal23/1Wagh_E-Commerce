import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Truck } from 'lucide-react';

const POLICIES = {
  '/privacy-policy': {
    icon: ShieldCheck,
    title: 'Privacy Policy',
    updated: 'Last updated: September 2026',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'When you shop with WAGH Mobile Accessories, we collect the information you provide directly — your name, email address, phone number, shipping address, and order history — solely to process and deliver your orders.',
      },
      {
        heading: 'How We Use Your Information',
        body: 'We use your details to fulfil orders, send shipping and order updates, respond to support requests, and improve our products. We never sell your personal information to third parties.',
      },
      {
        heading: 'Payment Security',
        body: 'All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. WAGH does not store your card, UPI, or netbanking credentials on its servers.',
      },
      {
        heading: 'Your Rights',
        body: 'You can request access to, correction of, or deletion of your personal data at any time by contacting us at waghonline9@gmail.com.',
      },
    ],
  },
  '/terms-of-service': {
    icon: FileText,
    title: 'Terms of Service',
    updated: 'Last updated: September 2026',
    sections: [
      {
        heading: 'Using Our Website',
        body: 'By browsing or purchasing from waghonline.in, you agree to use the site only for lawful purposes and to provide accurate information during checkout and account creation.',
      },
      {
        heading: 'Orders & Pricing',
        body: 'All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to correct pricing errors and cancel affected orders with a full refund.',
      },
      {
        heading: 'Product Warranty',
        body: 'WAGH products carry a 6-month doorstep warranty against manufacturing defects. Warranty does not cover physical damage, liquid damage, or misuse.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'WAGH Mobile Accessories is not liable for indirect or incidental damages arising from the use of our products beyond the value of the product purchased.',
      },
    ],
  },
  '/shipping-policy': {
    icon: Truck,
    title: 'Shipping Policy',
    updated: 'Last updated: September 2026',
    sections: [
      {
        heading: 'Processing Time',
        body: 'Orders are processed and dispatched within 24-48 hours of confirmation, excluding Sundays and public holidays.',
      },
      {
        heading: 'Delivery Time & Charges',
        body: 'We offer free express delivery across India, with most orders arriving within 3-7 business days depending on your location.',
      },
      {
        heading: 'Order Tracking',
        body: 'Once your order ships, you will receive a tracking link via SMS and email so you can follow your package in real time.',
      },
      {
        heading: 'Returns & Refunds',
        body: 'Items can be returned within 7 days of delivery if unused and in original packaging. Refunds are processed within 5-7 business days of the return being received and inspected.',
      },
    ],
  },
};

export function PolicyPage() {
  const { pathname } = useLocation();
  const policy = POLICIES[pathname] || POLICIES['/privacy-policy'];
  const Icon = policy.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="space-y-3 border-b border-wagh-border pb-8">
        <div className="w-14 h-14 rounded-2xl bg-wagh-teal text-wagh-gold flex items-center justify-center">
          <Icon className="w-7 h-7" />
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark">{policy.title}</h1>
        <p className="text-xs font-mono-tag text-wagh-muted uppercase tracking-wider">{policy.updated}</p>
      </div>

      <div className="space-y-8">
        {policy.sections.map((section) => (
          <div key={section.heading} className="space-y-2">
            <h2 className="font-editorial text-xl font-bold text-wagh-dark">{section.heading}</h2>
            <p className="text-sm sm:text-base text-wagh-muted leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-wagh-muted leading-relaxed pt-4 border-t border-wagh-border">
        Questions about this policy? Reach out to us at{' '}
        <a href="mailto:waghonline9@gmail.com" className="text-wagh-teal font-semibold hover:underline">
          waghonline9@gmail.com
        </a>{' '}
        or call +91 90544 05305.
      </p>
    </div>
  );
}
