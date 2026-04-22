import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Navbar } from '../components/Navbar';
import { STORE_CONFIG } from '../config';
import { useSeo } from '../hooks/useSeo';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^(03|923)\d{9}$/, 'Enter a valid Pakistani phone number (03XXXXXXXXX)'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  useSeo({ title: `Contact Us — Zorvik`, description: `Get in touch with Zorvik. Order via WhatsApp, send us a message, or visit us. Cash on Delivery across Pakistan.` });

  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema as any),
    defaultValues: { name: '', phone: '', email: '', subject: '', message: '' },
  });

  const handleSubmit = (data: ContactForm) => {
    const msg = encodeURIComponent(
      `*Contact Form Submission*\n\nName: ${data.name}\nPhone: ${data.phone}${data.email ? `\nEmail: ${data.email}` : ''}\nSubject: ${data.subject}\n\nMessage:\n${data.message}`
    );
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${msg}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        {/* Page header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3">Get In Touch</h1>
          <div className="w-16 h-1 bg-primary mx-auto mb-4" />
          <p className="text-muted-foreground max-w-md mx-auto">
            Have a question about an order? Want to know about a product? We're here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 lg:gap-16">
          {/* Info Cards */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {[
              {
                icon: Phone,
                title: 'WhatsApp / Call',
                lines: ['+92 300 1234567', 'Mon–Sat, 9am–9pm'],
                action: () => window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}`, '_blank'),
                actionLabel: 'Chat Now',
              },
              {
                icon: Clock,
                title: 'Order Delivery',
                lines: ['2–4 working days', 'All across Pakistan'],
              },
              {
                icon: MapPin,
                title: 'Location',
                lines: ['Pakistan', 'Nationwide Delivery'],
              },
              {
                icon: Mail,
                title: 'Email',
                lines: ['support@pkstore.pk', 'Reply within 24 hours'],
              },
            ].map(({ icon: Icon, title, lines, action, actionLabel }) => (
              <div
                key={title}
                className="flex gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">{title}</p>
                  {lines.map(l => (
                    <p key={l} className="text-muted-foreground text-sm">{l}</p>
                  ))}
                  {action && (
                    <button
                      onClick={action}
                      className="mt-2 text-primary text-xs font-bold hover:underline"
                    >
                      {actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3 bg-card border border-border rounded-2xl p-6 md:p-8">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-black mb-2">Message Sent!</h2>
                <p className="text-muted-foreground mb-6 max-w-xs">
                  WhatsApp khul gaya. Hamara team jald hi aapko reply karega.
                </p>
                <button
                  onClick={() => { setSubmitted(false); form.reset(); }}
                  className="text-primary font-bold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black mb-6 uppercase tracking-wide">Send a Message</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider">Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ali Hassan" {...field} data-testid="input-contact-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider">Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="03001234567" type="tel" {...field} data-testid="input-contact-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider">Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="ali@example.com" type="email" {...field} data-testid="input-contact-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider">Subject *</FormLabel>
                          <FormControl>
                            <Input placeholder="Order inquiry, product question..." {...field} data-testid="input-contact-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider">Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Aapka sawaal yahan likhein..."
                              rows={5}
                              className="resize-none"
                              {...field}
                              data-testid="input-contact-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 font-black uppercase tracking-widest text-sm"
                      data-testid="button-contact-submit"
                    >
                      Send via WhatsApp
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Message WhatsApp par automatically bheji jayegi
                    </p>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © 2026 Zorvik. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
