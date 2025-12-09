import React, { useState, useEffect } from 'react';
import { databaseDemo } from '../utils/databaseDemo';
import { firebaseService } from '../services/firebaseService';
import { Shipment, User } from '../types';

export const DatabaseTestView: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shipmentsData, usersData] = await Promise.all([
        firebaseService.getAllShipments(),
        firebaseService.getAllUsers()
      ]);
      setShipments(shipmentsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    try {
      setLoading(true);
      setMessage('Seeding database...');
      await databaseDemo.seedAll();
      setMessage('Database seeded successfully!');
      await loadData();
    } catch (error) {
      console.error('Error seeding database:', error);
      setMessage('Error seeding database');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setLoading(true);
      const name = prompt('Enter user name:');
      const email = prompt('Enter user email:');
      if (name && email) {
        await databaseDemo.addUser(name, email);
        setMessage(`User ${name} added successfully!`);
        await loadData();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage('Error adding user');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShipment = async () => {
    try {
      if (users.length === 0) {
        setMessage('Please add users first');
        return;
      }
      setLoading(true);
      const customerId = users[0].id; // Use first user as customer
      await databaseDemo.addShipment(customerId);
      setMessage('Shipment added successfully!');
      await loadData();
    } catch (error) {
      console.error('Error adding shipment:', error);
      setMessage('Error adding shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId: string) => {
    try {
      setLoading(true);
      const status = prompt('Enter new status (PLACED, PICKED, IN_TRANSIT, DELIVERED):');
      if (status) {
        await databaseDemo.updateShipmentStatus(shipmentId, status);
        setMessage('Shipment status updated!');
        await loadData();
      }
    } catch (error) {
      console.error('Error updating shipment:', error);
      setMessage('Error updating shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Firebase Database Test</h1>
      
      {/* Action Buttons */}
      <div className="mb-6 space-x-4">
        <button
          onClick={handleSeedDatabase}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Seed Database
        </button>
        <button
          onClick={handleAddUser}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Add User
        </button>
        <button
          onClick={handleAddShipment}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Add Shipment
        </button>
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Refresh Data
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
          {message}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          Loading...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Users ({users.length})</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            {users.length === 0 ? (
              <div className="p-4 text-gray-500">No users found</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="p-4 border-b last:border-b-0">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      Role: {user.role} | Status: {user.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Shipments Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Shipments ({shipments.length})</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            {shipments.length === 0 ? (
              <div className="p-4 text-gray-500">No shipments found</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{shipment.trackingId}</div>
                        <div className="text-sm text-gray-600">{shipment.recipientName}</div>
                        <div className="text-xs text-gray-500">
                          Status: {shipment.currentStatus} | ${shipment.price}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateShipmentStatus(shipment.id)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Operations Log */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Available Operations</h3>
        <div className="bg-gray-100 p-4 rounded text-sm">
          <p><strong>Seed Database:</strong> Adds sample users, vehicles, hubs, shipments, and rider tasks</p>
          <p><strong>Add User:</strong> Creates a new user with name and email</p>
          <p><strong>Add Shipment:</strong> Creates a new shipment for the first user</p>
          <p><strong>Update Status:</strong> Changes the status of a shipment</p>
          <p><strong>Refresh Data:</strong> Reloads all data from Firebase</p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTestView;