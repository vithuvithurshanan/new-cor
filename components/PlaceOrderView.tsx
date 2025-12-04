import React, { useState, useEffect } from 'react';
import { Package, Truck, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Info, CreditCard, Wallet, Banknote, Loader2, CheckCircle, User } from 'lucide-react';
import { getPackagingAdvice } from '../services/geminiService';
import { mockDataService } from '../services/mockDataService';
import { PaymentMethod, ShipmentStatus } from '../types';

export const PlaceOrderView: React.FC = () => {
  const [formData, setFormData] = useState({
    recipientName: '',
    pickupAddress: '',
    dropoffAddress: '',
    weight: 1,
    description: '',
    serviceType: 'STANDARD' // 'STANDARD' | 'EXPRESS' | 'SAME_DAY'
  });

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [quote, setQuote] = useState({ price: 0, eta: '' });

  // Payment States
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdShipmentId, setCreatedShipmentId] = useState('');

  // Mock Price Calculation
  useEffect(() => {
    let basePrice = 10;
    const weightPrice = formData.weight * 2;
    const multiplier = formData.serviceType === 'SAME_DAY' ? 2.5 : formData.serviceType === 'EXPRESS' ? 1.5 : 1;

    const finalPrice = (basePrice + weightPrice) * multiplier;

    let eta = '';
    const today = new Date();
    if (formData.serviceType === 'SAME_DAY') {
      eta = 'Today by 8:00 PM';
    } else if (formData.serviceType === 'EXPRESS') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      eta = tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      const standard = new Date(today);
      standard.setDate(today.getDate() + 3);
      eta = standard.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    setQuote({ price: Math.round(finalPrice), eta });
  }, [formData]);

  const handleGetAdvice = async () => {
    if (!formData.description) return;
    setLoadingAdvice(true);
    const advice = await getPackagingAdvice(formData.description);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);

    try {
      // Create shipment in mock service
      const newShipment = await mockDataService.createShipment({
        recipientName: formData.recipientName,
        destination: formData.dropoffAddress,
        estimatedDelivery: quote.eta,
      });

      setCreatedShipmentId(newShipment.id);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsProcessingPayment(false);
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Payment failed", error);
      setIsProcessingPayment(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-in zoom-in duration-300 ring-4 ring-emerald-50">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Order Confirmed!</h2>
        <p className="text-slate-500 mb-8">Your package delivery has been scheduled. A driver will be assigned shortly.</p>

        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 mb-8 inline-block w-full">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Tracking ID</p>
          <p className="text-2xl font-mono font-bold text-indigo-600">{createdShipmentId}</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          Book Another Shipment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 relative">
      {/* Left Column: Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/60">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Package className="text-indigo-600" />
            Place Delivery Order
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full pl-10 p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.recipientName}
                  onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street, City, Zip"
                  className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.pickupAddress}
                  onChange={e => setFormData({ ...formData, pickupAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Drop-off Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street, City, Zip"
                  className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.dropoffAddress}
                  onChange={e => setFormData({ ...formData, dropoffAddress: e.target.value })}
                />
              </div>
            </div>

            {/* Package Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Package Type</label>
                <select className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>Box</option>
                  <option>Document / Envelope</option>
                  <option>Pallet</option>
                </select>
              </div>
            </div>

            {/* Description & AI */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Description</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Glass Vase, Electronics"
                  className="flex-1 p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleGetAdvice}
                  disabled={!formData.description || loadingAdvice}
                  className="px-4 bg-violet-100/80 text-violet-700 rounded-xl hover:bg-violet-200 transition-colors flex items-center gap-2 font-medium text-sm whitespace-nowrap shadow-sm backdrop-blur-sm"
                >
                  <Sparkles size={16} />
                  {loadingAdvice ? 'Analyzing...' : 'AI Tips'}
                </button>
              </div>

              {/* AI Advice Result */}
              {aiAdvice && (
                <div className="mt-3 p-4 bg-violet-50/90 backdrop-blur-sm border border-violet-100 rounded-xl text-sm text-slate-700 animate-fade-in shadow-inner">
                  <div className="flex items-center gap-2 mb-2 text-violet-800 font-semibold">
                    <ShieldCheck size={16} />
                    Gemini Packaging Recommendation:
                  </div>
                  <div className="prose prose-sm prose-violet leading-snug">
                    {aiAdvice.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </div>
              )}
            </div>

            {/* Service Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Delivery Service</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'STANDARD', label: 'Standard', desc: '3-5 Days' },
                  { id: 'EXPRESS', label: 'Express', desc: 'Next Day' },
                  { id: 'SAME_DAY', label: 'Same Day', desc: 'Today' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: type.id })}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all hover:shadow-md
                      ${formData.serviceType === type.id
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-white/40 text-slate-700 hover:border-slate-300'}
                    `}
                  >
                    <div className="font-bold">
                      {type.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]">
                Continue to Payment
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900/95 backdrop-blur-xl text-white p-6 rounded-3xl shadow-2xl sticky top-6 border border-slate-700">
          <h3 className="text-lg font-bold mb-6 border-b border-slate-700 pb-4">Order Summary</h3>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Service</span>
              <span className="font-medium">{formData.serviceType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Weight</span>
              <span className="font-medium">{formData.weight} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Estimated Delivery</span>
              <span className="font-medium text-emerald-400">{quote.eta}</span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 text-sm">Estimated Total</span>
              <span className="text-2xl font-bold">${quote.price}.00</span>
            </div>
            <div className="text-xs text-slate-500 text-right">Includes taxes & fees</div>
          </div>

          <div className="flex items-start gap-3 text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <Info size={16} className="flex-shrink-0 mt-0.5" />
            <p>
              Final price may vary based on exact volumetric weight measured at the hub.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPayment(false)}></div>
          <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/40">
            <div className="p-6 border-b border-slate-100/50">
              <h3 className="text-xl font-bold text-slate-800">Secure Payment</h3>
              <p className="text-slate-500 text-sm">Complete your order of ${quote.price}.00</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CREDIT_CARD' ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700' : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'}`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-bold">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'WALLET' ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700' : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'}`}
                >
                  <Wallet size={24} />
                  <span className="text-xs font-bold">Wallet</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'COD' ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700' : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'}`}
                >
                  <Banknote size={24} />
                  <span className="text-xs font-bold">COD</span>
                </button>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <input type="text" placeholder="Card Number" className="w-full p-3 bg-white/60 border border-slate-300 rounded-lg" />
                  <div className="flex gap-3">
                    <input type="text" placeholder="MM/YY" className="flex-1 p-3 bg-white/60 border border-slate-300 rounded-lg" />
                    <input type="text" placeholder="CVC" className="w-24 p-3 bg-white/60 border border-slate-300 rounded-lg" />
                  </div>
                </div>
              )}

              {paymentMethod === 'WALLET' && (
                <div className="bg-slate-50 p-4 rounded-xl text-center animate-in fade-in">
                  <p className="text-sm text-slate-600 mb-2">Available Balance</p>
                  <p className="text-2xl font-bold text-slate-800">$120.50</p>
                </div>
              )}

              {paymentMethod === 'COD' && (
                <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-sm text-amber-800">Please have exact change ready for the rider upon pickup.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : `Pay $${quote.price}.00`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};