import React, { useState } from 'react';
import { Star, X, MessageSquare, ThumbsUp } from 'lucide-react';
import { Shipment } from '../types';

interface RateRiderModalProps {
    isOpen: boolean;
    onClose: () => void;
    shipment: Shipment | null;
    onSubmit: (shipmentId: string, rating: number, feedback: string) => Promise<void>;
}

export const RateRiderModal: React.FC<RateRiderModalProps> = ({ isOpen, onClose, shipment, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !shipment) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        try {
            await onSubmit(shipment.id, rating, feedback);
            onClose();
        } catch (error) {
            console.error('Failed to submit rating:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-800">Rate Your Delivery</h3>
                    <p className="text-slate-500 text-sm mt-1">How was your experience with the rider?</p>
                </div>

                <div className="p-8">
                    {/* Stars */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`${star <= (hoveredRating || rating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300'
                                        } transition-colors duration-200`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Feedback Text Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Additional Feedback (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us more about your experience..."
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-32 text-slate-700"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || submitting}
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
