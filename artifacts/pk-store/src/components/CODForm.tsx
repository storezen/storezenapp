import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from './ui/dialog';
import { STORE_CONFIG } from '../config';
import { trackInitiateCheckout, trackCompletePayment } from '../lib/tiktok-pixel';
import { CartItem } from '../hooks/use-cart';

const phoneRegex = /^(03|923)\d{9}$/;

const codFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(phoneRegex, "Must be a valid Pakistani number starting with 03 or 923 (11 digits)"),
  address: z.string().min(10, "Please provide complete street address"),
  city: z.string().min(2, "City is required"),
});

type CODFormValues = z.infer<typeof codFormSchema>;

interface CODFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onOrderSuccess: () => void;
}

export function CODForm({ open, onOpenChange, items, onOrderSuccess }: CODFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CODFormValues>({
    resolver: zodResolver(codFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      city: "",
    },
  });

  useEffect(() => {
    if (open && items.length > 0) {
      trackInitiateCheckout();
    }
  }, [open, items]);

  const itemTotal = items.reduce((total, item) => {
    const price = item.variant?.optionPrice ?? item.product.price;
    return total + price * item.quantity;
  }, 0);
  const grandTotal = itemTotal + STORE_CONFIG.deliveryCharge;

  const onSubmit = async (data: CODFormValues) => {
    setIsSubmitting(true);
    
    // Generate order text for WhatsApp
    let orderText = `*New Order - ${STORE_CONFIG.storeName}*\n\n`;
    orderText += `*Customer:* ${data.fullName}\n`;
    orderText += `*Phone:* ${data.phone}\n`;
    orderText += `*Address:* ${data.address}, ${data.city}\n\n`;
    
    orderText += `*Items:*\n`;
    items.forEach((item, idx) => {
      const price = item.variant?.optionPrice ?? item.product.price;
      const variantText = [];
      if (item.variant?.size) variantText.push(item.variant.size);
      if (item.variant?.color) variantText.push(item.variant.color);
      if (item.variant?.optionName) variantText.push(item.variant.optionName);
      
      const variantStr = variantText.length > 0 ? ` (${variantText.join(', ')})` : '';
      orderText += `${idx + 1}. ${item.product.name}${variantStr} x${item.quantity} - Rs. ${price * item.quantity}\n`;
    });
    
    orderText += `\n*Subtotal:* Rs. ${itemTotal}\n`;
    orderText += `*Delivery:* Rs. ${STORE_CONFIG.deliveryCharge}\n`;
    orderText += `*Total:* Rs. ${grandTotal}\n`;
    orderText += `*Payment Method:* Cash on Delivery\n`;
    
    // Track complete payment (since COD is essentially "payment committed" for conversion tracking)
    trackCompletePayment(grandTotal);
    
    // Wait a brief moment to let tracking fire
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Open WhatsApp
    const message = encodeURIComponent(orderText);
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${message}`, '_blank');
    
    setIsSubmitting(false);
    onOpenChange(false);
    onOrderSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-2 bg-muted/30">
          <DialogTitle className="text-xl font-bold">Complete Your Order</DialogTitle>
          <DialogDescription>
            Pay with Cash on Delivery anywhere in Pakistan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto p-6 pt-2 pb-0 flex-grow">
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-sm mb-2">Order Summary ({items.length} items)</h4>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rs. {itemTotal}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Delivery</span>
              <span>Rs. {STORE_CONFIG.deliveryCharge}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">Rs. {grandTotal}</span>
            </div>
          </div>

          <Form {...form}>
            <form id="cod-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ali Khan" {...field} data-testid="input-fullname" />
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
                    <FormLabel>WhatsApp / Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="03001234567" type="tel" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="House 123, Street 4, Block 5..." 
                        className="resize-none" 
                        {...field} 
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Lahore" {...field} data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        
        <DialogFooter className="p-6 pt-4 bg-muted/30 mt-auto">
          <Button 
            type="submit" 
            form="cod-form" 
            className="w-full text-lg h-12 font-bold" 
            disabled={isSubmitting || items.length === 0}
            data-testid="button-submit-order"
          >
            {isSubmitting ? "Processing..." : `Place Order - Rs. ${grandTotal}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
