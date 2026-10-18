import * as ComponentService from '../services/componentService.js';
import { emitComponentUpdate } from '../services/socketService.js';

export const getComponents = async (req, res, next) => {
    try {
        const filters = req.query;
        const components = await ComponentService.getAllComponents(filters);
        res.status(200).json(components);
    } catch (error) {
        next(error);
    }
};

export const getComponentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const component = await ComponentService.getComponentById(id);
        if (!component) return res.status(404).json({ error: 'Component not found' });
        res.status(200).json(component);
    } catch (error) {
        next(error);
    }
};

export const createComponent = async (req, res, next) => {
    try {
        const sellerId = req.user.id;
        const data = { ...req.body, seller_id: sellerId };
        
        if (data.images && data.images.length > 0 && !data.image_url) {
            data.image_url = data.images[0];
        }
        
        const component = await ComponentService.createComponent(data);
        res.status(201).json(component);
    } catch (error) {
        next(error);
    }
};

export const updateComponent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // In a real app, verify sellerId === component.seller_id
        const component = await ComponentService.updateComponent(id, updates);
        emitComponentUpdate(component);
        res.status(200).json(component);
    } catch (error) {
        next(error);
    }
};

export const deleteComponent = async (req, res, next) => {
    try {
        const { id } = req.params;
        await ComponentService.deleteComponent(id);
        emitComponentUpdate({ id, status: 'REMOVED' }); // emit a stub to inform frontend
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const getComponentBids = async (req, res, next) => {
    try {
        const bids = await ComponentService.getComponentBids(req.params.id);
        res.status(200).json(bids);
    } catch (error) {
        next(error);
    }
};

export const placeBid = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const bid = await ComponentService.placeBid(req.params.id, req.user.id, amount);
        res.status(201).json(bid);
    } catch (error) {
        res.status(400).json({ error: error.message || 'Failed to place bid' });
    }
};

