import { Prisma } from '@prisma/client';
import * as UserService from '../services/userService.js';
import { emitUserUpdate } from '../services/socketService.js';

export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await UserService.getUserById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await UserService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

export const upsertUser = async (req, res, next) => {
    try {
        const { id, email } = req.body;
        if (!id || !email) return res.status(400).json({ error: 'Missing required fields' });
        
        // Security check: Only the user themselves can upsert their record (usually on login)
        if (req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });

        const user = await UserService.upsertUser(id, email);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Dynamically get legitimate fields defined in the Prisma schema
        const validFields = Object.keys(Prisma.UserScalarFieldEnum);
        
        // Immutable fields to ignore from client-provided updates
        const immutableFields = ['id', 'email', 'createdAt', 'updatedAt', 'edit_count', 'last_edit_at', 'edit_request_status', 'is_profile_verified', 'pending_profile_updates', 'admin_suggestion'];
        
        const sanitizedUpdates = {};
        for (const key of Object.keys(updates)) {
            if (validFields.includes(key) && !immutableFields.includes(key)) {
                sanitizedUpdates[key] = updates[key];
            }
        }
        
        // Fetch current user and requester
        let currentUser = await UserService.getUserById(id);
        if (!currentUser) {
            currentUser = await UserService.upsertUser(id, req.user?.email || 'user@skct.edu.in');
        }

        let requester = await UserService.getUserById(req.user.id);
        if (!requester) {
            requester = currentUser;
        }
        const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
        const isRequesterAdmin = ADMIN_EMAILS.includes((req.user?.email || requester?.email || '').toLowerCase().trim()) || req.user?.id === 'admin-user-001';
        
        // Security check
        if (req.user.id !== id && !isRequesterAdmin) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Lock & Limit enforcement for regular student profile updates
        const isSelfProfileEdit = req.user.id === id && !isRequesterAdmin;
        const isChangingAccountDetails = Object.keys(updates).some(k => 
            ['name', 'mobile_number', 'register_no', 'year', 'department', 'classroom_no'].includes(k)
        );

        if (isSelfProfileEdit) {
            if (isChangingAccountDetails) {
                let prevPending = {};
                if (currentUser.pending_profile_updates) {
                    try {
                        prevPending = typeof currentUser.pending_profile_updates === 'string'
                            ? JSON.parse(currentUser.pending_profile_updates)
                            : currentUser.pending_profile_updates;
                    } catch (e) {}
                }

                const pendingProfile = {
                    name: updates.name !== undefined ? updates.name : (prevPending.name || currentUser.name || ''),
                    mobile_number: updates.mobile_number !== undefined ? updates.mobile_number : (prevPending.mobile_number || currentUser.mobile_number || ''),
                    register_no: updates.register_no !== undefined ? updates.register_no : (prevPending.register_no || currentUser.register_no || ''),
                    year: updates.year !== undefined ? updates.year : (prevPending.year || currentUser.year || ''),
                    department: updates.department !== undefined ? updates.department : (prevPending.department || currentUser.department || ''),
                    classroom_no: updates.classroom_no !== undefined ? updates.classroom_no : (prevPending.classroom_no || currentUser.classroom_no || ''),
                };

                sanitizedUpdates.pending_profile_updates = JSON.stringify(pendingProfile);

                // Strip the 6 fields from sanitizedUpdates so they aren't written to the verified User table directly before admin approval
                delete sanitizedUpdates.name;
                delete sanitizedUpdates.mobile_number;
                delete sanitizedUpdates.register_no;
                delete sanitizedUpdates.year;
                delete sanitizedUpdates.department;
                delete sanitizedUpdates.classroom_no;

                sanitizedUpdates.is_profile_verified = false;
                sanitizedUpdates.edit_request_status = 'PENDING';
                sanitizedUpdates.last_edit_at = new Date();
            }
        }
        
        const user = await UserService.updateUser(id, sanitizedUpdates);
        emitUserUpdate(user);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const requestEditAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });
        
        const currentUser = await UserService.getUserById(id);
        if (!currentUser) return res.status(404).json({ error: 'User not found' });
        
        if (currentUser.edit_count < 3) {
            return res.status(400).json({ error: 'You still have available edits' });
        }

        const user = await UserService.updateUser(id, { edit_request_status: 'PENDING' });
        emitUserUpdate(user);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const approveEditAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const requester = await UserService.getUserById(req.user.id);
        const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
        const isRequesterAdmin = ADMIN_EMAILS.includes((req.user?.email || requester?.email || '').toLowerCase().trim()) || req.user?.id === 'admin-user-001';
        if (!isRequesterAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });
        
        const targetUser = await UserService.getUserById(id);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const updates = {
            edit_request_status: 'APPROVED',
            edit_count: 0,
            is_profile_verified: true,
            admin_suggestion: null,
            pending_profile_updates: null
        };

        if (targetUser.pending_profile_updates) {
            try {
                const pending = typeof targetUser.pending_profile_updates === 'string'
                    ? JSON.parse(targetUser.pending_profile_updates)
                    : targetUser.pending_profile_updates;
                if (pending.name !== undefined) updates.name = pending.name;
                if (pending.mobile_number !== undefined) updates.mobile_number = pending.mobile_number;
                if (pending.register_no !== undefined) updates.register_no = pending.register_no;
                if (pending.year !== undefined) updates.year = pending.year;
                if (pending.department !== undefined) updates.department = pending.department;
                if (pending.classroom_no !== undefined) updates.classroom_no = pending.classroom_no;
            } catch (err) {
                console.error("Failed to parse pending_profile_updates on approval", err);
            }
        }
        
        const user = await UserService.updateUser(id, updates);
        emitUserUpdate(user);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const rejectEditAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { suggestion } = req.body;
        
        const requester = await UserService.getUserById(req.user.id);
        const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
        const isRequesterAdmin = ADMIN_EMAILS.includes((req.user?.email || requester?.email || '').toLowerCase().trim()) || req.user?.id === 'admin-user-001';
        if (!isRequesterAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });
        
        const user = await UserService.updateUser(id, {
            edit_request_status: 'REJECTED',
            admin_suggestion: suggestion || 'Please correct your details.'
        });
        emitUserUpdate(user);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};
