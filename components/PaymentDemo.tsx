import React, { useState } from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import DummyPaymentPage from './DummyPaymentPage';

export const PaymentDemo: React.FC = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  // Sample order data
  const sampleOrder = {
    recipientName: 'John Doe',
    pickupAddress: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    dropoffAddress: {
      street: '456 Oak Avenue',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201'
    },
    weight: 2.5,
    description: 'Electronics package',
    serviceType: 'STANDARD' as const,
    price: 25,
    distanceMiles: 8.5,
    estimatedDelivery: 'Dec 12, 2024'
  };

  const handlePaymentSuccess = (newTrackingId: string) => {
    setTrackingId(newTrackingId);
    setOrderComplete(true);
    setShowPayment(false);
  };

  const handleStartOver = () => {
    setShowPayment(false);
    setOrderComplete(false);
    setTrackingId('');
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <Package size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Successfully Created!</h2>
          <p className="text-slate-600 mb-6">Your package delivery has been scheduled and added to the database.</p>
          
          <div className="bg-slate-50 p-4 rounded-xl mb-6">
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Tracking ID</p>
            <p className="text-xl font-mono font-bold text-indigo-600">{trackingId}</p>
          </div>

          <div className="text-sm text-slate-500 mb-6 space-y-1">
            <p>✅ Payment processed successfully</p>
            <p>✅ Order added to Firebase database</p>
            <p>✅ Tracking ID generated</p>
            <p>✅ Notification sent</p>
          </div>

          <button
            onClick={handleStartOver}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Create Another Order
          </button>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => setShowPayment(false)}
            className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Order
          </button>
          <DummyPaymentPage
            orderData={sampleOrder}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Package size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Demo</h1>
          <p className="text-slate-600">Test the dummy payment system with Firebase integration</p>
        </div>

        {/* Order Preview */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-slate-800 mb-3">Sample Order</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Recipient:</span>
              <span className="font-medium">{sampleOrder.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span>Service:</span>
              <span className="font-medium">{sampleOrder.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span>Weight:</span>
              <span className="font-medium">{sampleOrder.weight} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Distance:</span>
              <span className="font-medium">{sampleOrder.distanceMiles} miles</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span className="font-medium">{sampleOrder.estimatedDelivery}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
              <span>Total:</span>
              <span>${sampleOrder.price}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-blue-800 mb-2">Demo Features</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Multiple payment methods (Card, Wallet, COD)</li>
            <li>• 2-second processing simulation</li>
            <li>• Firebase database integration</li>
            <li>• Success notifications</li>
            <li>• Tracking ID generation</li>
          </ul>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
        >
          Proceed to Payment
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          This is a demo payment system. No real money will be charged.
        </p>
      </div>
    </div>
  );
};

export default PaymentDemo;