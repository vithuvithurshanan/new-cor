import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// Login with email and password
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        // Get user details
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError) {
            return res.status(500).json({ error: 'Failed to fetch user details' });
        }

        res.json({
            user: userData,
            session: data.session
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send OTP to email
router.post('/send-otp', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'OTP sent successfully' });
    } catch (error: any) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req: Request, res: Response) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({ error: 'Email and token are required' });
        }

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        // Get or create user in users table
        let { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user!.id)
            .single();

        if (userError && userError.code === 'PGRST116') {
            // User doesn't exist, create one
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    id: data.user!.id,
                    email: data.user!.email!,
                    name: data.user!.email!.split('@')[0],
                    phone: '',
                    role: 'CUSTOMER',
                    status: 'ACTIVE'
                })
                .select()
                .single();

            if (createError) {
                return res.status(500).json({ error: 'Failed to create user' });
            }

            userData = newUser;
        }

        res.json({
            user: userData,
            session: data.session
        });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            await supabase.auth.admin.signOut(token);
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }

        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: userData });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
