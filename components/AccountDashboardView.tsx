import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { PricingConfig } from '../types';
import { optimizePricingRules } from '../services/geminiService';
import { Sparkles, Loader2, DollarSign, CreditCard, Sliders, Activity, FileText, TrendingUp, PieChart as PieChartIcon, Building2 } from 'lucide-react';

const CHART_DATA = [
    { name: 'Mon', shipments: 120, revenue: 2400, profit: 1200, cost: 1200 },
    { name: 'Tue', shipments: 145, revenue: 2900, profit: 1450, cost: 1450 },
    { name: 'Wed', shipments: 180, revenue: 3600, profit: 1800, cost: 1800 },
    { name: 'Thu', shipments: 130, revenue: 2600, profit: 1300, cost: 1300 },
    { name: 'Fri', shipments: 200, revenue: 4000, profit: 2000, cost: 2000 },
    { name: 'Sat', shipments: 90, revenue: 1800, profit: 900, cost: 900 },
    { name: 'Sun', shipments: 50, revenue: 1000, profit: 500, cost: 500 },
];

// Government-friendly data (conservative, official)
const GOVERNMENT_DATA = {
    totalRevenue: 18300,
    taxableRevenue: 16470, // 90% of total
    taxPaid: 3294, // 20% tax
    shipments: 915,
    compliance: 100,
};

// Actual internal data (real numbers)
const ACTUAL_DATA = {
    totalRevenue: 18300,
    actualProfit: 9150, // 50% margin
    operatingCosts: 7320,
    netProfit: 1830,
    profitMargin: 10,
};

const COST_BREAKDOWN = [
    { name: 'Fuel', value: 2500, color: '#6366f1' },
    { name: 'Salaries', value: 3200, color: '#8b5cf6' },
    { name: 'Maintenance', value: 1000, color: '#ec4899' },
    { name: 'Operations', value: 620, color: '#f59e0b' },
];

const INITIAL_PRICING: PricingConfig = {
    baseRate: 10,
    perKm: 0.5,
    perKg: 2,
    serviceMultipliers: { standard: 1, express: 1.5, sameDay: 2.5 },
    peakHourSurcharge: 1.2
};

type AccountTab = 'OVERVIEW' | 'GOVERNMENT' | 'ACTUAL' | 'PRICING';

interface AccountDashboardViewProps {
    initialTab?: AccountTab;
}

export const AccountDashboardView: React.FC<AccountDashboardViewProps> = ({ initialTab = 'OVERVIEW' }) => {
    const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
    const [loadingAi, setLoadingAi] = useState(false);

    // Sync activeTab with initialTab prop when it changes (navigation from main sidebar)
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // -- PRICING STATES --
    const [pricing, setPricing] = useState<PricingConfig>(INITIAL_PRICING);
    const [pricingSuggestion, setPricingSuggestion] = useState<string | null>(null);

    const handleOptimizePricing = async () => {
        setLoadingAi(true);
        const suggestion = await optimizePricingRules(pricing);
        setPricingSuggestion(suggestion);
        setLoadingAi(false);
    };

    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
                <p className="text-slate-500">Quick summary of key financial metrics.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign className="text-emerald-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Revenue</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">${ACTUAL_DATA.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Revenue</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Profit</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">${ACTUAL_DATA.netProfit.toLocaleString()}</p>
                    <p className="text-sm text-slate-500 mt-1">Net Profit</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Activity className="text-purple-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Margin</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{ACTUAL_DATA.profitMargin}%</p>
                    <p className="text-sm text-slate-500 mt-1">Profit Margin</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <FileText className="text-amber-600" size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Shipments</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{GOVERNMENT_DATA.shipments}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Shipments</p>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-6">Revenue Trend (7 Days)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={CHART_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Revenue" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderGovernmentReports = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Government Reports</h2>
                    <p className="text-slate-500">Official compliance reports for regulatory purposes.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                        Export PDF
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md">
                        Print Report
                    </button>
                </div>
            </div>

            {/* Official Compliance Badge */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building2 className="text-emerald-600" size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-900">Compliance Status: Active</p>
                        <p className="text-sm text-emerald-700">All regulatory requirements met • Last audit: Dec 2024</p>
                    </div>
                </div>
            </div>

            {/* Government Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-sm text-slate-500 mb-2">Total Revenue (Official)</p>
                    <p className="text-3xl font-bold text-slate-800">${GOVERNMENT_DATA.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">As per tax filings</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-sm text-slate-500 mb-2">Taxable Revenue</p>
                    <p className="text-3xl font-bold text-slate-800">${GOVERNMENT_DATA.taxableRevenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">After deductions</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-sm text-slate-500 mb-2">Tax Paid</p>
                    <p className="text-3xl font-bold text-slate-800">${GOVERNMENT_DATA.taxPaid.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">20% tax rate</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-sm text-slate-500 mb-2">Compliance Score</p>
                    <p className="text-3xl font-bold text-emerald-600">{GOVERNMENT_DATA.compliance}%</p>
                    <p className="text-xs text-slate-400 mt-1">Fully compliant</p>
                </div>
            </div>

            {/* Official Revenue Chart */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Official Revenue Statement</h3>
                <p className="text-sm text-slate-500 mb-6">As reported to regulatory authorities</p>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CHART_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} name="Official Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Compliance Documents */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Compliance Documents</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <FileText className="text-indigo-600" size={20} />
                            <div>
                                <p className="font-medium text-slate-800">Tax Return - Q4 2024</p>
                                <p className="text-xs text-slate-500">Filed on Dec 1, 2024</p>
                            </div>
                        </div>
                        <button className="text-indigo-600 text-sm font-medium">Download</button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <FileText className="text-indigo-600" size={20} />
                            <div>
                                <p className="font-medium text-slate-800">Regulatory Compliance Report</p>
                                <p className="text-xs text-slate-500">Generated on Dec 7, 2024</p>
                            </div>
                        </div>
                        <button className="text-indigo-600 text-sm font-medium">Download</button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <FileText className="text-indigo-600" size={20} />
                            <div>
                                <p className="font-medium text-slate-800">Audit Certificate</p>
                                <p className="text-xs text-slate-500">Valid until Dec 2025</p>
                            </div>
                        </div>
                        <button className="text-indigo-600 text-sm font-medium">Download</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderActualReports = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Actual Reports</h2>
                    <p className="text-slate-500">Real internal business analytics and financial data.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md">
                    Export Analytics
                </button>
            </div>

            {/* Internal Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-2xl text-white shadow-xl">
                    <p className="text-emerald-100 text-sm mb-2">Actual Profit</p>
                    <p className="text-4xl font-bold">${ACTUAL_DATA.actualProfit.toLocaleString()}</p>
                    <p className="text-emerald-200 text-xs mt-1">50% margin</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-xl">
                    <p className="text-blue-100 text-sm mb-2">Operating Costs</p>
                    <p className="text-4xl font-bold">${ACTUAL_DATA.operatingCosts.toLocaleString()}</p>
                    <p className="text-blue-200 text-xs mt-1">40% of revenue</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-2xl text-white shadow-xl">
                    <p className="text-purple-100 text-sm mb-2">Net Profit</p>
                    <p className="text-4xl font-bold">${ACTUAL_DATA.netProfit.toLocaleString()}</p>
                    <p className="text-purple-200 text-xs mt-1">{ACTUAL_DATA.profitMargin}% net margin</p>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-6 rounded-2xl text-white shadow-xl">
                    <p className="text-amber-100 text-sm mb-2">Total Revenue</p>
                    <p className="text-4xl font-bold">${ACTUAL_DATA.totalRevenue.toLocaleString()}</p>
                    <p className="text-amber-200 text-xs mt-1">7-day total</p>
                </div>
            </div>

            {/* Revenue vs Profit Chart */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Revenue vs Profit Analysis</h3>
                <p className="text-sm text-slate-500 mb-6">Internal performance metrics</p>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CHART_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} name="Revenue" />
                            <Bar dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} name="Profit" />
                            <Bar dataKey="cost" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Cost" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-lg">
                    <h3 className="font-bold text-slate-800 mb-4">Cost Breakdown</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={COST_BREAKDOWN}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {COST_BREAKDOWN.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-lg">
                    <h3 className="font-bold text-slate-800 mb-4">Detailed Cost Analysis</h3>
                    <div className="space-y-3">
                        {COST_BREAKDOWN.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="font-medium text-slate-800">{item.name}</span>
                                </div>
                                <span className="font-bold text-slate-800">${item.value.toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 mt-4">
                            <span className="font-bold text-indigo-900">Total Operating Costs</span>
                            <span className="font-bold text-indigo-900">${ACTUAL_DATA.operatingCosts.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <p className="text-sm text-slate-600 mb-1">Average Order Value</p>
                        <p className="text-2xl font-bold text-slate-800">$20.00</p>
                        <p className="text-xs text-emerald-600 mt-1">↑ 12% from last week</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                        <p className="text-sm text-slate-600 mb-1">Customer Acquisition Cost</p>
                        <p className="text-2xl font-bold text-slate-800">$8.50</p>
                        <p className="text-xs text-emerald-600 mt-1">↓ 5% from last week</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                        <p className="text-sm text-slate-600 mb-1">Return on Investment</p>
                        <p className="text-2xl font-bold text-slate-800">235%</p>
                        <p className="text-xs text-emerald-600 mt-1">↑ 18% from last week</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPricingEngine = () => (
        <div className="max-w-4xl space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Smart Pricing Engine</h2>
                    <p className="text-slate-500">Configure base rates and surcharges.</p>
                </div>
                <button
                    onClick={handleOptimizePricing}
                    disabled={loadingAi}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
                >
                    {loadingAi ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    AI Optimize
                </button>
            </div>

            {pricingSuggestion && (
                <div className="bg-violet-50/90 backdrop-blur-md border border-violet-100 p-6 rounded-2xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4">
                    <div className="p-2 bg-violet-100 rounded-full text-violet-600"><Sparkles size={20} /></div>
                    <div>
                        <h4 className="font-bold text-violet-900 mb-1">Recommendation</h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{pricingSuggestion}</p>
                    </div>
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-white/60 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <DollarSign size={16} /> Base Configuration
                    </label>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 font-medium">Base Rate ($)</label>
                            <input type="number" value={pricing.baseRate} onChange={e => setPricing({ ...pricing, baseRate: Number(e.target.value) })} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-medium">Per Km Rate ($)</label>
                            <input type="number" value={pricing.perKm} onChange={e => setPricing({ ...pricing, perKm: Number(e.target.value) })} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-medium">Per Kg Rate ($)</label>
                            <input type="number" value={pricing.perKg} onChange={e => setPricing({ ...pricing, perKg: Number(e.target.value) })} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Sliders size={16} /> Multipliers
                    </label>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 font-medium">Express Service (x)</label>
                            <input type="number" step="0.1" value={pricing.serviceMultipliers.express} onChange={e => setPricing({ ...pricing, serviceMultipliers: { ...pricing.serviceMultipliers, express: Number(e.target.value) } })} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-medium">Same Day Service (x)</label>
                            <input type="number" step="0.1" value={pricing.serviceMultipliers.sameDay} onChange={e => setPricing({ ...pricing, serviceMultipliers: { ...pricing.serviceMultipliers, sameDay: Number(e.target.value) } })} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-medium">Peak Hour Surcharge (x)</label>
                            <input type="number" step="0.1" value={pricing.peakHourSurcharge} onChange={e => setPricing({ ...pricing, peakHourSurcharge: Number(e.target.value) })} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'OVERVIEW': return renderOverview();
            case 'GOVERNMENT': return renderGovernmentReports();
            case 'ACTUAL': return renderActualReports();
            case 'PRICING': return renderPricingEngine();
            default: return renderOverview();
        }
    };

    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Main Content - Full Width now */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
                {renderContent()}
            </div>
        </div>
    );
};
