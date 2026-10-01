import * as UserService from '../services/userService.js';

export const verifiedProfileMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        let dbUser = await UserService.getUserById(req.user.id);
        if (!dbUser) {
            try {
                dbUser = await UserService.upsertUser(req.user.id, req.user.email || 'user@skct.edu.in');
            } catch (e) {}
        }
        
        // Admins bypass
        const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
        const isAdmin = dbUser?.is_admin || dbUser?.role === 'Admin' || ADMIN_EMAILS.includes(req.user?.email) || req.user?.id?.includes('admin');
        if (isAdmin) {
            return next();
        }

        if (dbUser && !dbUser.is_profile_verified && !dbUser.pending_profile_updates) {
            return res.status(403).json({ error: 'Profile not verified. Access restricted until approved by admin.' });
        }

        next();
    } catch (err) {
        console.error('Verified Profile Middleware Exception:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
