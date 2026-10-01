import prisma from '../config/prisma.js';
import { supabase } from '../config/supabase.js';

export const createOrder = async (orderData) => {
    try {
        const newOrder = await prisma.order.create({
            data: {
                order_id: orderData.orderId,
                buyer_id: orderData.buyerId,
                seller_id: orderData.sellerId,
                product_id: orderData.productId,
                product_name: orderData.productName,
                product_image: orderData.productImage,
                quantity: Number(orderData.quantity) || 1,
                subtotal: Number(orderData.subtotal) || 0,
                platform_fee: Number(orderData.platformFee) || 0,
                delivery_fee: Number(orderData.deliveryFee) || 0,
                gst: Number(orderData.gst) || 0,
                grand_total: Number(orderData.grandTotal) || 0,
                payment_id: orderData.paymentId || null,
                status: orderData.status || 'Processing',
                order_status: orderData.orderStatus || 'Pending',
                payment_status: orderData.paymentStatus || 'Paid',
                delivery_address: orderData.deliveryAddress || ''
            }
        });
        return newOrder;
    } catch (error) {
        console.error('Error creating order in DB:', error);
        try {
            const { data } = await supabase.from('Order').insert([orderData]).select();
            return data?.[0] || orderData;
        } catch (e) {
            return orderData;
        }
    }
};

export const getBuyerOrders = async (userId) => {
    try {
        const orders = await prisma.order.findMany({
            where: { buyer_id: userId },
            orderBy: { createdAt: 'desc' }
        });
        if (orders && orders.length > 0) return orders;

        // Try Supabase "Order" table
        const { data, error } = await supabase
            .from('Order')
            .select('*')
            .eq('buyer_id', userId)
            .order('createdAt', { ascending: false });

        if (!error && data) return data;
        return orders || [];
    } catch (error) {
        console.error('Error fetching buyer orders:', error);
        try {
            const { data } = await supabase.from('Order').select('*').eq('buyer_id', userId);
            return data || [];
        } catch (e) {
            return [];
        }
    }
};

export const getSellerOrders = async (userId) => {
    try {
        const orders = await prisma.order.findMany({
            where: { seller_id: userId },
            orderBy: { createdAt: 'desc' }
        });
        if (orders && orders.length > 0) return orders;

        // Try Supabase "Order" table
        const { data, error } = await supabase
            .from('Order')
            .select('*')
            .eq('seller_id', userId)
            .order('createdAt', { ascending: false });

        if (!error && data) return data;
        return orders || [];
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        try {
            const { data } = await supabase.from('Order').select('*').eq('seller_id', userId);
            return data || [];
        } catch (e) {
            return [];
        }
    }
};

export const getOrderById = async (orderId) => {
    try {
        let order = await prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) {
            order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { id: orderId },
                        { order_id: orderId }
                    ]
                }
            });
        }
        if (!order) {
            const { data } = await supabase.from('Order').select('*').or(`id.eq.${orderId},order_id.eq.${orderId}`).maybeSingle();
            order = data;
        }
        return order;
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        try {
            const { data } = await supabase.from('Order').select('*').or(`id.eq.${orderId},order_id.eq.${orderId}`).maybeSingle();
            return data;
        } catch (e) {
            return null;
        }
    }
};

export const updateOrderStatus = async (orderId, sellerId, newStatus) => {
    try {
        let order = await prisma.order.update({
            where: { id: orderId },
            data: { order_status: newStatus }
        });
        return order;
    } catch (error) {
        console.error('Error updating order status:', error);
        const { data } = await supabase
            .from('Order')
            .update({ order_status: newStatus })
            .eq('id', orderId)
            .select();
        return data?.[0] || null;
    }
};

export const cancelOrder = async (orderId, buyerId) => {
    try {
        const order = await getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.buyer_id !== buyerId) throw new Error('Unauthorized');
        if (order.order_status !== 'Pending' && order.order_status !== 'Confirmed') {
            throw new Error(`Cannot cancel order in ${order.order_status} state`);
        }
        return await updateOrderStatus(orderId, order.seller_id, 'Cancelled');
    } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
    }
};
