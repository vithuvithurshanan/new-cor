import React, { useState } from 'react';
import { CreditCard, Wallet, Banknote, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { PaymentMethod, PAYMENT_METHODS, PAYMENT_STATUS, ShipmentStatus } from '../types';

interface PaymentPageProps {
  orderData: {
    recipientName: string;
    pickupAddress: any;
    dropoffAddress: any;
    weight: number;
    description: string;
    serviceType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
    price: number;
    distanceMiles?: number;
    estimatedDelivery: string;
  };
  onSuccess: (trackingId: string) => void;
  onCancel: () => void;
}

export const DummyPaymentPage: React.FC<PaymentPageProps> = ({ orderData, onSuccess, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CREDIT_CARD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  const handlePayment = async () => {
    setIsProcessing(true);
    setShowError(false);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate tracking ID
      const newTrackingId = `TRK${Date.now()}`;
      
      // Create shipment data
      const shipmentData = {
        trackingId: newTrackingId,
        customerId: 'demo-user',
        recipientName: orderData.recipientName,
        pickupAddress: orderData.pickupAddress,
        dropoffAddress: orderData.dropoffAddress,
        weight: orderData.weight,
        description: orderData.description,
        serviceType: orderData.serviceType,
        currentStatus: ShipmentStatus.PLACED,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === PAYMENT_METHODS.COD ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID,
        price: orderData.price,
        distanceMiles: orderData.distanceMiles || 0,
        estimatedDelivery: orderData.estimatedDelivery,
        events: [
          {
            status: ShipmentStatus.PLACED,
            timestamp: new Date().toISOString(),
            description: 'Order placed and payment processed',
            location: `${orderData.pickupAddress.city}, ${orderData.pickupAddress.state}`
          }
        ]
      };

      // Add to Firebase database
      try {
        const shipmentId = await firebaseService.addShipment(shipmentData);
        console.log('✅ Order added to Firebase with ID:', shipmentId);
      } catch (firebaseError) {
        console.log('⚠️ Firebase not available, order created locally');
      }

      setTrackingId(newTrackingId);
      setIsProcessing(false);
      setShowSuccess(true);

      // Show browser notification
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Payment Successful! 🎉', {
          body: `Your order ${newTrackingId} has been placed successfully.`,
          icon: '/favicon.ico'
        });
      }

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess(newTrackingId);
      }, 3000);

    } catch (error) {
      console.error('Payment failed:', error);
      setIsProcessing(false);
      setShowError(true);
    }
  };

  // Request notification permission on component mount
  React.useEffect(() => {
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-bounce">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
        <p className="text-slate-600 mb-6">Your order has been placed and added to the database.</p>
        
        <div className="bg-slate-50 p-4 rounded-xl mb-6">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Tracking ID</p>
          <p className="text-xl font-mono font-bold text-indigo-600">{trackingId}</p>
        </div>

        <div className="text-sm text-slate-500 mb-6">
          <p>✅ Payment processed: ${orderData.price}</p>
          <p>✅ Order added to Firebase database</p>
          <p>✅ Notification sent</p>
        </div>

        <button
          onClick={() => onSuccess(trackingId)}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <h2 className="text-xl font-bold">Secure Payment</h2>
        <p className="text-indigo-100 text-sm">Complete your order of ${orderData.price}</p>
      </div>

      {/* Payment Methods */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Choose Payment Method</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod(PAYMENT_METHODS.CREDIT_CARD)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                paymentMethod === PAYMENT_METHODS.CREDIT_CARD 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <CreditCard size={24} />
              <span className="text-xs font-bold">Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod(PAYMENT_METHODS.WALLET)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                paymentMethod === PAYMENT_METHODS.WALLET 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <Wallet size={24} />
              <span className="text-xs font-bold">Wallet</span>
            </button>
            <button
              onClick={() => setPaymentMethod(PAYMENT_METHODS.COD)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                paymentMethod === PAYMENT_METHODS.COD 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <Banknote size={24} />
              <span className="text-xs font-bold">COD</span>
            </button>
          </div>
        </div>

        {/* Payment Method Details */}
        {paymentMethod === PAYMENT_METHODS.CREDIT_CARD && (
          <div className="space-y-3 mb-6 animate-in fade-in">
            <input 
              type="text" 
              placeholder="4532 1234 5678 9012" 
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="12/25" 
                className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              <input 
                type="text" 
                placeholder="123" 
                className="w-24 p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>
        )}

        {paymentMethod === PAYMENT_METHODS.WALLET && (
          <div className="bg-slate-50 p-4 rounded-xl text-center mb-6 animate-in fade-in">
            <p className="text-sm text-slate-600 mb-2">Available Balance</p>
            <p className="text-2xl font-bold text-slate-800">$250.00</p>
            <p className="text-xs text-emerald-600 mt-1">✓ Sufficient balance</p>
          </div>
        )}

        {paymentMethod === PAYMENT_METHODS.COD && (
          <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 mb-6 animate-in fade-in">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Cash on Delivery</p>
              <p>Please have exact change ready: <strong>${orderData.price}</strong></p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in fade-in">
            <XCircle className="text-red-600 shrink-0" size={20} />
            <p className="text-sm text-red-800">Payment failed. Please try again.</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-slate-50 p-4 rounded-xl mb-6">
          <h4 className="font-medium text-slate-800 mb-2">Order Summary</h4>
          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Service:</span>
              <span>{orderData.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span>Weight:</span>
              <span>{orderData.weight} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span>{orderData.estimatedDelivery}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
              <span>Total:</span>
              <span>${orderData.price}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              `Pay $${orderData.price}`
            )}
          </button>
        </div>

        {/* Demo Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            🎭 <strong>Demo Mode:</strong> This is a dummy payment. No real money will be charged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DummyPaymentPage;