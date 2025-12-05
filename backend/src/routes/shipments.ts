import express, { Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Get all shipments (filtered by user role)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        let query = supabase.from('shipments').select('*');

        // Filter based on role
        if (user.role === 'CUSTOMER') {
            query = query.eq('customer_id', user.id);
        } else if (user.role === 'RIDER') {
            query = query.eq('rider_id', user.id);
        }
        // ADMIN and HUB_MANAGER can see all shipments

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ shipments: data });
    } catch (error: any) {
        console.error('Get shipments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single shipment
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Check access permissions
        if (user.role === 'CUSTOMER' && data.customer_id !== user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (user.role === 'RIDER' && data.rider_id !== user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ shipment: data });
    } catch (error: any) {
        console.error('Get shipment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new shipment
router.post('/', requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const {
            recipient_name,
            pickup_address,
            dropoff_address,
            weight,
            description,
            service_type,
            payment_method,
            price,
            distance_miles,
            estimated_delivery
        } = req.body;

        // Generate tracking ID
        const tracking_id = `COS${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const { data, error } = await supabase
            .from('shipments')
            .insert({
                tracking_id,
                customer_id: user.id,
                recipient_name,
                pickup_address,
                dropoff_address,
                weight,
                description: description || '',
                service_type,
                status: 'PENDING',
                payment_method,
                payment_status: payment_method === 'COD' ? 'PENDING' : 'PAID',
                price,
                distance_miles,
                estimated_delivery
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ shipment: data });
    } catch (error: any) {
        console.error('Create shipment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update shipment
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;
        const updates = req.body;

        // Get existing shipment
        const { data: existing, error: fetchError } = await supabase
            .from('shipments')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Check permissions
        if (user.role === 'CUSTOMER' && existing.customer_id !== user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update shipment
        const { data, error } = await supabase
            .from('shipments')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ shipment: data });
    } catch (error: any) {
        console.error('Update shipment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete/Cancel shipment
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // Get existing shipment
        const { data: existing, error: fetchError } = await supabase
            .from('shipments')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Check permissions
        if (user.role === 'CUSTOMER' && existing.customer_id !== user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Cancel instead of delete
        const { data, error } = await supabase
            .from('shipments')
            .update({
                status: 'CANCELLED',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ shipment: data, message: 'Shipment cancelled successfully' });
    } catch (error: any) {
        console.error('Cancel shipment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
