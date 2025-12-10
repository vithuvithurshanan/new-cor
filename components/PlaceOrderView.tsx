import React, { useState, useEffect } from 'react';
import { Package, Truck, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Info, CreditCard, Wallet, Banknote, Loader2, CheckCircle, User as UserIcon, MapPin, XCircle, Navigation } from 'lucide-react';
import { getPackagingAdvice } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { PaymentMethod, ShipmentStatus, User, PAYMENT_METHODS, PAYMENT_STATUS } from '../types';
import { Address, validateAddress, validateStreet, validateCity, validateState, validateZipCode, US_STATES, formatAddress } from '../utils/addressValidation';
import { geocodeAddress, Coordinates } from '../utils/geocoding';
import { calculateRouteDistance, formatDistance, RouteDistance } from '../utils/distanceCalculation';

export const PlaceOrderView: React.FC<{ currentUser?: User | null }> = ({ currentUser }) => {
  const IS_DEV = import.meta.env.DEV || import.meta.env.VITE_ALLOW_EMPTY_ORDER === 'true';
  const [formData, setFormData] = useState({
    recipientName: '',
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    dropoffAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    weight: 1,
    description: '',
    serviceType: 'STANDARD' // 'STANDARD' | 'EXPRESS' | 'SAME_DAY'
  });

  // Address validation states
  const [pickupErrors, setPickupErrors] = useState<{ street?: string; city?: string; state?: string; zipCode?: string }>({});
  const [dropoffErrors, setDropoffErrors] = useState<{ street?: string; city?: string; state?: string; zipCode?: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  // Distance calculation states
  const [distanceInfo, setDistanceInfo] = useState<RouteDistance | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [quote, setQuote] = useState({ price: 0, eta: '', basePrice: 0, distancePrice: 0 });

  // Payment States
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CREDIT_CARD);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdShipmentId, setCreatedShipmentId] = useState('');

  // Price Calculation with Distance
  useEffect(() => {
    const basePrice = 10;
    const weightPrice = formData.weight * 2;
    const distancePrice = distanceInfo ? distanceInfo.totalMiles * 2 : 0; // $2 per mile
    const multiplier = formData.serviceType === 'SAME_DAY' ? 2.5 : formData.serviceType === 'EXPRESS' ? 1.5 : 1;

    const finalPrice = (basePrice + weightPrice + distancePrice) * multiplier;

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

    setQuote({
      price: Math.round(finalPrice),
      eta,
      basePrice: Math.round((basePrice + weightPrice) * multiplier),
      distancePrice: Math.round(distancePrice * multiplier)
    });
  }, [formData, distanceInfo]);

  // Calculate distance when both addresses are valid
  useEffect(() => {
    const calculateDistance = async () => {
      // Check if both addresses are valid
      const pickupValidation = validateAddress(formData.pickupAddress);
      const dropoffValidation = validateAddress(formData.dropoffAddress);

      if (!pickupValidation.isValid || !dropoffValidation.isValid) {
        // Reset distance if addresses become invalid
        if (distanceInfo) {
          setDistanceInfo(null);
          setDistanceError(null);
        }
        return;
      }

      setCalculatingDistance(true);
      setDistanceError(null);

      try {
        // Geocode both addresses
        const pickupResult = await geocodeAddress(formData.pickupAddress);
        const dropoffResult = await geocodeAddress(formData.dropoffAddress);

        if (!pickupResult.success) {
          setDistanceError(`Pickup address: ${pickupResult.error}`);
          setCalculatingDistance(false);
          return;
        }

        if (!dropoffResult.success) {
          setDistanceError(`Dropoff address: ${dropoffResult.error}`);
          setCalculatingDistance(false);
          return;
        }

        // Calculate route distance
        const route = calculateRouteDistance(
          pickupResult.coordinates!,
          dropoffResult.coordinates!
        );

        setDistanceInfo(route);
        setCalculatingDistance(false);
      } catch (error) {
        setDistanceError('Failed to calculate distance. Using weight-based pricing.');
        setCalculatingDistance(false);
      }
    };

    calculateDistance();
  }, [formData.pickupAddress, formData.dropoffAddress]);

  const handleGetAdvice = async () => {
    if (!formData.description) return;
    setLoadingAdvice(true);
    const advice = await getPackagingAdvice(formData.description);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate both addresses
    const pickupValidation = validateAddress(formData.pickupAddress);
    const dropoffValidation = validateAddress(formData.dropoffAddress);

    // Update error states
    setPickupErrors(pickupValidation.errors);
    setDropoffErrors(dropoffValidation.errors);

    // Mark all fields as touched to show errors
    setTouchedFields({
      'pickup-street': true,
      'pickup-city': true,
      'pickup-state': true,
      'pickup-zip': true,
      'dropoff-street': true,
      'dropoff-city': true,
      'dropoff-state': true,
      'dropoff-zip': true,
    });

    // If in dev/testing mode, allow proceeding to payment even if validation fails
    if (IS_DEV) {
      setShowPayment(true);
      return;
    }

    // Only proceed if both addresses are valid
    if (pickupValidation.isValid && dropoffValidation.isValid) {
      setShowPayment(true);
    } else {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create shipment data for Firebase
      const shipmentData = {
        trackingId: `TRK${Date.now()}`,
        customerId: currentUser?.id || 'guest-user',
        recipientName: formData.recipientName,
        pickupAddress: formData.pickupAddress,
        dropoffAddress: formData.dropoffAddress,
        weight: formData.weight,
        description: formData.description,
        serviceType: formData.serviceType,
        currentStatus: ShipmentStatus.PLACED,
        paymentMethod: paymentMethod,
        paymentStatus: (paymentMethod === PAYMENT_METHODS.COD ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID) as typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS],
        price: quote.price,
        distanceMiles: distanceInfo ? distanceInfo.totalMiles : 0,
        estimatedDelivery: quote.eta,
        events: [
          {
            status: ShipmentStatus.PLACED,
            timestamp: new Date().toISOString(),
            description: 'Order placed successfully',
            location: formData.pickupAddress.city + ', ' + formData.pickupAddress.state
          }
        ]
      };

      // Try to add to Firebase, fallback to API service
      try {
        const { firebaseService } = await import('../services/firebaseService');
        const shipmentId = await firebaseService.addShipment(shipmentData);
        setCreatedShipmentId(shipmentData.trackingId);
        console.log('✅ Order added to Firebase with ID:', shipmentId);
      } catch (firebaseError) {
        console.log('Firebase not available, using API service fallback');
        // Fallback to existing API service
        const newShipment = await apiService.createShipment({
          recipientName: formData.recipientName,
          pickupAddress: formData.pickupAddress,
          dropoffAddress: formData.dropoffAddress,
          weight: formData.weight,
          description: formData.description,
          serviceType: formData.serviceType,
          paymentMethod: paymentMethod,
          paymentStatus: (paymentMethod === PAYMENT_METHODS.COD ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID) as typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS],
          price: quote.price,
          distanceMiles: distanceInfo ? distanceInfo.totalMiles : 0,
          estimatedDelivery: quote.eta
        });
        setCreatedShipmentId(newShipment.trackingId || newShipment.id);
      }

      setIsProcessingPayment(false);
      setPaymentSuccess(true);

      // Show success notification
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Payment Successful! 🎉', {
          body: `Your order ${shipmentData.trackingId} has been placed successfully.`,
          icon: '/favicon.ico'
        });
      }

    } catch (error) {
      console.error("Payment failed", error);
      setIsProcessingPayment(false);
      alert("Payment failed. Please try again.");
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
                <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
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
            <div className="space-y-6">
              {/* Pickup Address */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-600" />
                  Pickup Address
                </label>

                {/* Street */}
                <div>
                  <input
                    type="text"
                    required={!IS_DEV}
                    placeholder="Street Address (e.g., 123 Main Street)"
                    className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['pickup-street'] && pickupErrors.street
                      ? 'border-red-300 focus:ring-red-500'
                      : touchedFields['pickup-street'] && !pickupErrors.street && formData.pickupAddress.street
                        ? 'border-emerald-300 focus:ring-emerald-500'
                        : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    value={formData.pickupAddress.street}
                    onChange={e => {
                      const newPickup = { ...formData.pickupAddress, street: e.target.value };
                      setFormData({ ...formData, pickupAddress: newPickup });
                      if (touchedFields['pickup-street']) {
                        const error = validateStreet(e.target.value);
                        setPickupErrors({ ...pickupErrors, street: error || undefined });
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields({ ...touchedFields, 'pickup-street': true });
                      const error = validateStreet(formData.pickupAddress.street);
                      setPickupErrors({ ...pickupErrors, street: error || undefined });
                    }}
                  />
                  {touchedFields['pickup-street'] && pickupErrors.street && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle size={12} />
                      {pickupErrors.street}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* City */}
                  <div>
                    <input
                      type="text"
                      required={!IS_DEV}
                      placeholder="City"
                      className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['pickup-city'] && pickupErrors.city
                        ? 'border-red-300 focus:ring-red-500'
                        : touchedFields['pickup-city'] && !pickupErrors.city && formData.pickupAddress.city
                          ? 'border-emerald-300 focus:ring-emerald-500'
                          : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      value={formData.pickupAddress.city}
                      onChange={e => {
                        const newPickup = { ...formData.pickupAddress, city: e.target.value };
                        setFormData({ ...formData, pickupAddress: newPickup });
                        if (touchedFields['pickup-city']) {
                          const error = validateCity(e.target.value);
                          setPickupErrors({ ...pickupErrors, city: error || undefined });
                        }
                      }}
                      onBlur={() => {
                        setTouchedFields({ ...touchedFields, 'pickup-city': true });
                        const error = validateCity(formData.pickupAddress.city);
                        setPickupErrors({ ...pickupErrors, city: error || undefined });
                      }}
                    />
                    {touchedFields['pickup-city'] && pickupErrors.city && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <XCircle size={12} />
                        {pickupErrors.city}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <select
                      required={!IS_DEV}
                      className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['pickup-state'] && pickupErrors.state
                        ? 'border-red-300 focus:ring-red-500'
                        : touchedFields['pickup-state'] && !pickupErrors.state && formData.pickupAddress.state
                          ? 'border-emerald-300 focus:ring-emerald-500'
                          : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      value={formData.pickupAddress.state}
                      onChange={e => {
                        const newPickup = { ...formData.pickupAddress, state: e.target.value };
                        setFormData({ ...formData, pickupAddress: newPickup });
                        if (touchedFields['pickup-state']) {
                          const error = validateState(e.target.value);
                          setPickupErrors({ ...pickupErrors, state: error || undefined });
                        }
                      }}
                      onBlur={() => {
                        setTouchedFields({ ...touchedFields, 'pickup-state': true });
                        const error = validateState(formData.pickupAddress.state);
                        setPickupErrors({ ...pickupErrors, state: error || undefined });
                      }}
                    >
                      <option value="">State</option>
                      {US_STATES.map(state => (
                        <option key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </option>
                      ))}
                    </select>
                    {touchedFields['pickup-state'] && pickupErrors.state && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <XCircle size={12} />
                        {pickupErrors.state}
                      </p>
                    )}
                  </div>
                </div>

                {/* ZIP Code */}
                <div>
                  <input
                    type="text"
                    required={!IS_DEV}
                    placeholder="ZIP Code (e.g., 12345 or 12345-6789)"
                    className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['pickup-zip'] && pickupErrors.zipCode
                      ? 'border-red-300 focus:ring-red-500'
                      : touchedFields['pickup-zip'] && !pickupErrors.zipCode && formData.pickupAddress.zipCode
                        ? 'border-emerald-300 focus:ring-emerald-500'
                        : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    value={formData.pickupAddress.zipCode}
                    onChange={e => {
                      const newPickup = { ...formData.pickupAddress, zipCode: e.target.value };
                      setFormData({ ...formData, pickupAddress: newPickup });
                      if (touchedFields['pickup-zip']) {
                        const error = validateZipCode(e.target.value);
                        setPickupErrors({ ...pickupErrors, zipCode: error || undefined });
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields({ ...touchedFields, 'pickup-zip': true });
                      const error = validateZipCode(formData.pickupAddress.zipCode);
                      setPickupErrors({ ...pickupErrors, zipCode: error || undefined });
                    }}
                  />
                  {touchedFields['pickup-zip'] && pickupErrors.zipCode && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle size={12} />
                      {pickupErrors.zipCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Dropoff Address */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-600" />
                  Drop-off Address
                </label>

                {/* Street */}
                <div>
                  <input
                    type="text"
                    required={!IS_DEV}
                    placeholder="Street Address (e.g., 456 Oak Avenue)"
                    className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['dropoff-street'] && dropoffErrors.street
                      ? 'border-red-300 focus:ring-red-500'
                      : touchedFields['dropoff-street'] && !dropoffErrors.street && formData.dropoffAddress.street
                        ? 'border-emerald-300 focus:ring-emerald-500'
                        : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    value={formData.dropoffAddress.street}
                    onChange={e => {
                      const newDropoff = { ...formData.dropoffAddress, street: e.target.value };
                      setFormData({ ...formData, dropoffAddress: newDropoff });
                      if (touchedFields['dropoff-street']) {
                        const error = validateStreet(e.target.value);
                        setDropoffErrors({ ...dropoffErrors, street: error || undefined });
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields({ ...touchedFields, 'dropoff-street': true });
                      const error = validateStreet(formData.dropoffAddress.street);
                      setDropoffErrors({ ...dropoffErrors, street: error || undefined });
                    }}
                  />
                  {touchedFields['dropoff-street'] && dropoffErrors.street && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle size={12} />
                      {dropoffErrors.street}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* City */}
                  <div>
                    <input
                      type="text"
                      required={!IS_DEV}
                      placeholder="City"
                      className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['dropoff-city'] && dropoffErrors.city
                        ? 'border-red-300 focus:ring-red-500'
                        : touchedFields['dropoff-city'] && !dropoffErrors.city && formData.dropoffAddress.city
                          ? 'border-emerald-300 focus:ring-emerald-500'
                          : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      value={formData.dropoffAddress.city}
                      onChange={e => {
                        const newDropoff = { ...formData.dropoffAddress, city: e.target.value };
                        setFormData({ ...formData, dropoffAddress: newDropoff });
                        if (touchedFields['dropoff-city']) {
                          const error = validateCity(e.target.value);
                          setDropoffErrors({ ...dropoffErrors, city: error || undefined });
                        }
                      }}
                      onBlur={() => {
                        setTouchedFields({ ...touchedFields, 'dropoff-city': true });
                        const error = validateCity(formData.dropoffAddress.city);
                        setDropoffErrors({ ...dropoffErrors, city: error || undefined });
                      }}
                    />
                    {touchedFields['dropoff-city'] && dropoffErrors.city && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <XCircle size={12} />
                        {dropoffErrors.city}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <select
                      required={!IS_DEV}
                      className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['dropoff-state'] && dropoffErrors.state
                        ? 'border-red-300 focus:ring-red-500'
                        : touchedFields['dropoff-state'] && !dropoffErrors.state && formData.dropoffAddress.state
                          ? 'border-emerald-300 focus:ring-emerald-500'
                          : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      value={formData.dropoffAddress.state}
                      onChange={e => {
                        const newDropoff = { ...formData.dropoffAddress, state: e.target.value };
                        setFormData({ ...formData, dropoffAddress: newDropoff });
                        if (touchedFields['dropoff-state']) {
                          const error = validateState(e.target.value);
                          setDropoffErrors({ ...dropoffErrors, state: error || undefined });
                        }
                      }}
                      onBlur={() => {
                        setTouchedFields({ ...touchedFields, 'dropoff-state': true });
                        const error = validateState(formData.dropoffAddress.state);
                        setDropoffErrors({ ...dropoffErrors, state: error || undefined });
                      }}
                    >
                      <option value="">State</option>
                      {US_STATES.map(state => (
                        <option key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </option>
                      ))}
                    </select>
                    {touchedFields['dropoff-state'] && dropoffErrors.state && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <XCircle size={12} />
                        {dropoffErrors.state}
                      </p>
                    )}
                  </div>
                </div>

                {/* ZIP Code */}
                <div>
                  <input
                    type="text"
                    required={!IS_DEV}
                    placeholder="ZIP Code (e.g., 12345 or 12345-6789)"
                    className={`w-full p-3 bg-white/60 border rounded-xl focus:ring-2 outline-none transition-all ${touchedFields['dropoff-zip'] && dropoffErrors.zipCode
                      ? 'border-red-300 focus:ring-red-500'
                      : touchedFields['dropoff-zip'] && !dropoffErrors.zipCode && formData.dropoffAddress.zipCode
                        ? 'border-emerald-300 focus:ring-emerald-500'
                        : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    value={formData.dropoffAddress.zipCode}
                    onChange={e => {
                      const newDropoff = { ...formData.dropoffAddress, zipCode: e.target.value };
                      setFormData({ ...formData, dropoffAddress: newDropoff });
                      if (touchedFields['dropoff-zip']) {
                        const error = validateZipCode(e.target.value);
                        setDropoffErrors({ ...dropoffErrors, zipCode: error || undefined });
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields({ ...touchedFields, 'dropoff-zip': true });
                      const error = validateZipCode(formData.dropoffAddress.zipCode);
                      setDropoffErrors({ ...dropoffErrors, zipCode: error || undefined });
                    }}
                  />
                  {touchedFields['dropoff-zip'] && dropoffErrors.zipCode && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle size={12} />
                      {dropoffErrors.zipCode}
                    </p>
                  )}
                </div>
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
                  value={typeof formData.weight === 'number' && !isNaN(formData.weight) ? formData.weight : 0}
                  onChange={e => {
                    const v = e.target.value;
                    const parsed = v === '' ? 0 : parseFloat(v);
                    setFormData({ ...formData, weight: isNaN(parsed) ? 0 : parsed });
                  }}
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
        <div className="bg-white/95 backdrop-blur-xl text-slate-800 p-6 rounded-3xl shadow-2xl sticky top-6 border border-slate-200">
          <h3 className="text-lg font-bold mb-6 border-b border-slate-200 pb-4">Order Summary</h3>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Service</span>
              <span className="font-medium">{formData.serviceType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Weight</span>
              <span className="font-medium">{formData.weight} kg</span>
            </div>

            {/* Distance Information */}
            {calculatingDistance && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Distance</span>
                <span className="font-medium text-blue-600 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Calculating...
                </span>
              </div>
            )}

            {distanceInfo && !calculatingDistance && (
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <Navigation size={14} />
                  <span>Route Distance</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Company → Pickup</span>
                  <span className="font-medium text-slate-700">{formatDistance(distanceInfo.segments.companyToPickup)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Pickup → Dropoff</span>
                  <span className="font-medium text-slate-700">{formatDistance(distanceInfo.segments.pickupToDropoff)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
                  <span className="text-slate-700">Total Distance</span>
                  <span className="text-emerald-600">{formatDistance(distanceInfo.totalMiles)}</span>
                </div>
              </div>
            )}

            {distanceError && (
              <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{distanceError}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Estimated Delivery</span>
              <span className="font-medium text-emerald-600">{quote.eta}</span>
            </div>
          </div>


          <div className="bg-slate-100 rounded-xl p-4 mb-6">
            {distanceInfo && (
              <div className="space-y-2 mb-3 pb-3 border-b border-slate-200">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Base + Weight</span>
                  <span className="text-slate-700">${quote.basePrice}.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Distance ({distanceInfo.totalMiles.toFixed(1)} mi × $2)</span>
                  <span className="text-slate-700">${quote.distancePrice}.00</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500 text-sm">Estimated Total</span>
              <span className="text-2xl font-bold text-slate-800">${quote.price}.00</span>
            </div>
            <div className="text-xs text-slate-500 text-right">Includes taxes & fees</div>
          </div>

          <div className="flex items-start gap-3 text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
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
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.CREDIT_CARD)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === PAYMENT_METHODS.CREDIT_CARD ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700' : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'}`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-bold">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.WALLET)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === PAYMENT_METHODS.WALLET ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700' : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'}`}
                >
                  <Wallet size={24} />
                  <span className="text-xs font-bold">Wallet</span>
                </button>
                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.COD)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === PAYMENT_METHODS.COD ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700' : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'}`}
                >
                  <Banknote size={24} />
                  <span className="text-xs font-bold">COD</span>
                </button>
              </div>

              {paymentMethod === PAYMENT_METHODS.CREDIT_CARD && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <input type="text" placeholder="Card Number" className="w-full p-3 bg-white/60 border border-slate-300 rounded-lg" />
                  <div className="flex gap-3">
                    <input type="text" placeholder="MM/YY" className="flex-1 p-3 bg-white/60 border border-slate-300 rounded-lg" />
                    <input type="text" placeholder="CVC" className="w-24 p-3 bg-white/60 border border-slate-300 rounded-lg" />
                  </div>
                </div>
              )}

              {paymentMethod === PAYMENT_METHODS.WALLET && (
                <div className="bg-slate-50 p-4 rounded-xl text-center animate-in fade-in">
                  <p className="text-sm text-slate-600 mb-2">Available Balance</p>
                  <p className="text-2xl font-bold text-slate-800">$120.50</p>
                </div>
              )}

              {paymentMethod === PAYMENT_METHODS.COD && (
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