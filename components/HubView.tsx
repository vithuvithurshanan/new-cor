import React, { useState, useEffect } from 'react';
import { Hub, StorageRack, HubManifest } from '../types';
import { suggestStorageLocation, optimizeHubRouting } from '../services/geminiService';
import { mockDataService } from '../services/mockDataService';
import { Scan, Truck, Box, Layers, ArrowRightLeft, AlertCircle, Map as MapIcon, BarChart3, PackagePlus, Loader2, Sparkles } from 'lucide-react';

// --- MOCK DATA (Racks and Manifests still mocked locally for now as they are specific to this view) ---
const MOCK_RACKS: StorageRack[] = [
  { id: 'R1', zone: 'A', type: 'GENERAL', capacity: 100, occupied: 85 },
  { id: 'R2', zone: 'A', type: 'GENERAL', capacity: 100, occupied: 45 },
  { id: 'R3', zone: 'B', type: 'HEAVY', capacity: 50, occupied: 12 },
  { id: 'R4', zone: 'C', type: 'FRAGILE', capacity: 50, occupied: 38 },
];

const MOCK_MANIFESTS: HubManifest[] = [
  { id: 'MAN-2023-001', destinationHub: 'HUB-NORTH', driverId: 'DRV-88', packageCount: 145, status: 'DISPATCHED', generatedAt: '2023-12-01 08:30' },
  { id: 'MAN-2023-002', destinationHub: 'HUB-SOUTH', driverId: 'DRV-92', packageCount: 210, status: 'PREPARING', generatedAt: '2023-12-01 10:15' },
];

type HubTab = 'DASHBOARD' | 'INBOUND' | 'OUTBOUND' | 'INVENTORY' | 'NETWORK';

interface HubViewProps {
  initialTab?: HubTab;
}

export const HubView: React.FC<HubViewProps> = ({ initialTab = 'DASHBOARD' }) => {
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [scannedPackage, setScannedPackage] = useState<any>(null);
  const [aiStorageSuggestion, setAiStorageSuggestion] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // -- OUTBOUND STATE --
  const [selectedDestination, setSelectedDestination] = useState('');
  const [routingAdvice, setRoutingAdvice] = useState<string | null>(null);

  // -- MODAL STATES --
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditHubModal, setShowEditHubModal] = useState(false);
  const [showCreateManifestModal, setShowCreateManifestModal] = useState(false);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [editHubForm, setEditHubForm] = useState({ name: '', manager: '', capacity: 0 });

  // Sync activeTab with initialTab prop when it changes (navigation from main sidebar)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const loadHubs = async () => {
      try {
        const { firebaseService } = await import('../services/firebaseService');
        const data = await firebaseService.queryDocuments<Hub>('hubs', []);
        setHubs(data);
      } catch (error) {
        console.error('Firestore error, using mock data:', error);
        const data = await mockDataService.getHubs();
        setHubs(data);
      }
    };
    loadHubs();
  }, []);

  // --- HANDLERS ---
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput) return;

    // Simulate finding a package
    const mockPackage = {
      id: scanInput,
      description: "Glass Vase set with packaging",
      weight: "2.5kg",
      origin: "Local Branch A",
      destination: "City Center"
    };
    setScannedPackage(mockPackage);

    // Get AI Suggestion
    setLoadingAi(true);
    const suggestion = await suggestStorageLocation(mockPackage.description);
    setAiStorageSuggestion(suggestion);
    setLoadingAi(false);
  };

  const handleConfirmStorage = () => {
    if (!scannedPackage || !aiStorageSuggestion) return;
    setShowConfirmModal(true);
  };

  const confirmStorageAction = () => {
    // Update package status and assign to storage
    console.log(`Package ${scannedPackage.id} stored at: ${aiStorageSuggestion}`);
    // Reset form
    setScanInput('');
    setScannedPackage(null);
    setAiStorageSuggestion(null);
    setShowConfirmModal(false);
  };

  const handleEditHub = (hub: Hub) => {
    setSelectedHub(hub);
    setEditHubForm({ name: hub.name, manager: hub.manager, capacity: hub.capacity });
    setShowEditHubModal(true);
  };

  const saveHubChanges = () => {
    if (!selectedHub) return;
    console.log('Saving hub changes:', editHubForm);
    // Update hub in state
    setHubs(hubs.map(h => h.id === selectedHub.id ? { ...h, ...editHubForm } : h));
    setShowEditHubModal(false);
    setSelectedHub(null);
  };

  const handleCreateManifest = () => {
    setShowCreateManifestModal(true);
  };

  const handleOptimizeRoute = async () => {
    if (!selectedDestination) return;
    setLoadingAi(true);
    const advice = await optimizeHubRouting("HUB-CENTRAL", selectedDestination);
    setRoutingAdvice(advice);
    setLoadingAi(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'DASHBOARD': return renderDashboard();
      case 'INBOUND': return renderInbound();
      case 'OUTBOUND': return renderOutbound();
      case 'INVENTORY': return renderInventory();
      case 'NETWORK': return renderNetwork();
      default: return renderDashboard();
    }
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hub Dashboard</h2>
          <p className="text-slate-500">Overview of {hubs[0]?.name || 'Loading...'}</p>
        </div>
        <div className="text-sm bg-indigo-50/80 backdrop-blur-sm text-indigo-700 px-3 py-1 rounded-full font-medium border border-indigo-100">
          Code: {hubs[0]?.code || '...'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Inbound Today" value="1,240" icon={PackagePlus} color="blue" />
        <StatCard title="Outbound Today" value="985" icon={Truck} color="indigo" />
        <StatCard title="Processing" value="255" icon={Layers} color="amber" />
        <StatCard title="Exceptions" value="12" icon={AlertCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4">Throughput Volume</h3>
          <div className="h-48 bg-slate-50/50 rounded-xl flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-300">
            [Chart: Hourly Package Volume In/Out]
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4">Driver Dispatch Status</h3>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100/60 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">D{i}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Route #{100 + i} (North)</p>
                    <p className="text-xs text-slate-500">Loading Dock {i}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Boarding</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInbound = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Inbound Processing</h2>
        <p className="text-slate-500">Scan incoming packages to assign storage and update status.</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60">
        <form onSubmit={handleScan} className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Scan className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 text-lg bg-white/60 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none font-mono"
              placeholder="Scan Barcode ID (e.g. PKG-9921)"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Process
          </button>
        </form>

        {loadingAi && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        )}

        {scannedPackage && !loadingAi && (
          <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="flex items-start gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Box size={32} className="text-indigo-600" />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Package ID</p>
                  <p className="font-mono font-bold text-slate-800">{scannedPackage.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Weight</p>
                  <p className="font-medium text-slate-800">{scannedPackage.weight}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase font-bold">Description</p>
                  <p className="font-medium text-slate-800">{scannedPackage.description}</p>
                </div>
              </div>
            </div>

            {aiStorageSuggestion && (
              <div className="bg-gradient-to-r from-violet-50/90 to-fuchsia-50/90 backdrop-blur-md p-6 rounded-2xl border border-violet-100 flex items-center justify-between shadow-inner">
                <div>
                  <div className="flex items-center gap-2 text-violet-800 font-bold mb-1">
                    <Sparkles size={18} />
                    AI Storage Recommendation
                  </div>
                  <p className="text-slate-700 text-lg">{aiStorageSuggestion}</p>
                </div>
                <button
                  onClick={handleConfirmStorage}
                  className="bg-violet-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-violet-700 shadow-md transition-colors"
                >
                  Confirm & Store
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderOutbound = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Outbound Manifests</h2>
        <button
          onClick={handleCreateManifest}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          + Create Manifest
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {MOCK_MANIFESTS.map(manifest => (
            <div key={manifest.id} className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{manifest.id}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>To: {manifest.destinationHub}</span>
                    <span>•</span>
                    <span>{manifest.packageCount} pkgs</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold
                   ${manifest.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                 `}>
                  {manifest.status}
                </span>
                <p className="text-xs text-slate-400 mt-1">{manifest.generatedAt}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-lg h-fit">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapIcon size={18} /> Route Optimizer
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destination Hub</label>
              <select
                className="w-full p-2 bg-white/60 border border-slate-300 rounded-lg"
                value={selectedDestination}
                onChange={e => setSelectedDestination(e.target.value)}
              >
                <option value="">Select Destination...</option>
                <option value="HUB-NORTH">North Regional</option>
                <option value="HUB-SOUTH">South Regional</option>
                <option value="HUB-WEST">West Local</option>
              </select>
            </div>
            <button
              onClick={handleOptimizeRoute}
              disabled={!selectedDestination || loadingAi}
              className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
            >
              {loadingAi ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Analyze Best Route
            </button>

            {routingAdvice && (
              <div className="p-3 bg-violet-50/80 backdrop-blur-sm text-violet-900 text-sm rounded-lg border border-violet-100">
                {routingAdvice}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Storage Management</h2>
          <p className="text-slate-500">Rack utilization and capacity planning.</p>
        </div>
        <button className="bg-white/70 border border-white/60 px-4 py-2 rounded-lg hover:bg-white flex items-center gap-2 shadow-sm">
          <BarChart3 size={18} /> Utilization Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_RACKS.map(rack => {
          const percentage = (rack.occupied / rack.capacity) * 100;
          let colorClass = 'bg-emerald-500';
          if (percentage > 80) colorClass = 'bg-red-500';
          else if (percentage > 50) colorClass = 'bg-amber-500';

          return (
            <div key={rack.id} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Zone {rack.zone}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Rack {rack.id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600`}>
                  {rack.type}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Occupied</span>
                  <span className="font-bold">{rack.occupied} / {rack.capacity}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${colorClass} transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.1)]`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderNetwork = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Hub Network</h2>
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/50 text-slate-700 font-semibold uppercase text-xs backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">Hub Code</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Manager</th>
              <th className="px-6 py-4">Load</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {hubs.map(hub => (
              <tr key={hub.id} className="hover:bg-white/60 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-slate-800">{hub.code}</td>
                <td className="px-6 py-4">{hub.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold
                    ${hub.type === 'CENTRAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                  `}>
                    {hub.type}
                  </span>
                </td>
                <td className="px-6 py-4">{hub.manager}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${(hub.currentLoad / hub.capacity) * 100}%` }}></div>
                    </div>
                    <span className="text-xs">{Math.round((hub.currentLoad / hub.capacity) * 100)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEditHub(hub)}
                    className="text-indigo-600 hover:underline font-medium text-xs"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Main Content - Full Width now */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Confirm Storage Modal */}
      {showConfirmModal && scannedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Confirm Storage</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm text-slate-600 mb-2">Package ID</p>
                <p className="font-mono font-bold text-slate-900">{scannedPackage.id}</p>
              </div>
              <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 rounded-xl border border-violet-100">
                <p className="text-sm text-violet-700 font-medium mb-1 flex items-center gap-2">
                  <Sparkles size={16} />
                  AI Recommended Location
                </p>
                <p className="text-lg font-bold text-violet-900">{aiStorageSuggestion}</p>
              </div>
              <p className="text-sm text-slate-600">
                Confirm to store this package at the recommended location.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStorageAction}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 shadow-md transition-colors"
              >
                Confirm & Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hub Modal */}
      {showEditHubModal && selectedHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Edit Hub Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hub Name</label>
                <input
                  type="text"
                  value={editHubForm.name}
                  onChange={(e) => setEditHubForm({ ...editHubForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Manager</label>
                <input
                  type="text"
                  value={editHubForm.manager}
                  onChange={(e) => setEditHubForm({ ...editHubForm, manager: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={editHubForm.capacity}
                  onChange={(e) => setEditHubForm({ ...editHubForm, capacity: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>Hub Code:</strong> {selectedHub.code} (Read-only)
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditHubModal(false);
                  setSelectedHub(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveHubChanges}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Manifest Modal */}
      {showCreateManifestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Manifest</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination Hub</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select destination...</option>
                  <option value="HUB-NORTH">North Regional Hub</option>
                  <option value="HUB-SOUTH">South Regional Hub</option>
                  <option value="HUB-WEST">West Local Hub</option>
                  <option value="HUB-EAST">East Regional Hub</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Driver ID</label>
                <input
                  type="text"
                  placeholder="e.g., DRV-123"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Package Count</label>
                <input
                  type="number"
                  placeholder="Number of packages"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Manifest will be generated with a unique ID and timestamp.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateManifestModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Creating manifest...');
                  setShowCreateManifestModal(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors"
              >
                Create Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};