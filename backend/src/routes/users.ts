import express, { Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Get current user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: data });
    } catch (error: any) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.patch('/profile', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { name, phone, avatar_url } = req.body;

        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ user: data });
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users (admin only)
router.get('/', requireRole('ADMIN', 'HUB_MANAGER'), async (req: AuthRequest, res: Response) => {
    try {
        const { role, status } = req.query;

        let query = supabase.from('users').select('*');

        if (role) {
            query = query.eq('role', role);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ users: data });
    } catch (error: any) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user by ID (admin only)
router.get('/:id', requireRole('ADMIN', 'HUB_MANAGER'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: data });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user (admin only)
router.patch('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('users')
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

        res.json({ user: data });
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
