import * as OrderService from '../services/orderService.js';
import * as ChatService from '../services/chatService.js';
import * as MessageService from '../services/messageService.js';
import { emitNewChat, emitNewMessage, emitComponentUpdate } from '../services/socketService.js';
import prisma from '../config/prisma.js';



export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await OrderService.getBuyerOrders(userId);
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching my orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getSellerOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await OrderService.getSellerOrders(userId);
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const order = await OrderService.getOrderById(id);
        
        // Ensure user is either buyer or seller of this order
        if (order.buyer_id !== userId && order.seller_id !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not have access to this order' });
        }
        
        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const sellerId = req.user.id;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const updatedOrder = await OrderService.updateOrderStatus(id, sellerId, status);
        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        if (error.message.includes('not found or unauthorized')) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const buyerId = req.user.id;
        
        const cancelledOrder = await OrderService.cancelOrder(id, buyerId);
        res.status(200).json({ success: true, order: cancelledOrder });
    } catch (error) {
        console.error('Error cancelling order:', error);
        if (error.message.includes('Cannot cancel')) {
            return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('not found or unauthorized')) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createCodOrder = async (req, res) => {
    try {
        const {
            productId,
            productName,
            productImage,
            sellerId: providedSellerId,
            quantity = 1,
            price,
            subtotal,
            platformFee = 20,
            deliveryFee = 0,
            gst = 0,
            deliveryAddress
        } = req.body;

        const buyerId = req.user.id;

        // Resolve sellerId if missing from body
        let resolvedSellerId = providedSellerId;
        if (!resolvedSellerId && productId) {
            try {
                const component = await prisma.component.findUnique({ where: { id: productId } });
                if (component?.seller_id) {
                    resolvedSellerId = component.seller_id;
                }
            } catch (e) {}
        }
        if (!resolvedSellerId) {
            resolvedSellerId = buyerId;
        }

        const codOrderId = `COD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const grandTotal = Number(price) || (Number(subtotal) + Number(platformFee) + Number(deliveryFee));

        const orderData = {
            orderId: codOrderId,
            buyerId,
            sellerId: resolvedSellerId,
            productId,
            productName,
            productImage,
            quantity: Number(quantity) || 1,
            price: grandTotal,
            subtotal: Number(subtotal) || 0,
            platformFee: Number(platformFee) || 0,
            deliveryFee: Number(deliveryFee) || 0,
            gst: Number(gst) || 0,
            grandTotal: grandTotal,
            paymentId: `COD_PAY_${Date.now()}`,
            status: 'Placed',
            orderStatus: 'Pending',
            paymentStatus: 'Cash on Delivery',
            deliveryAddress: deliveryAddress || 'Campus Meetup',
            createdAt: new Date().toISOString()
        };

        const newOrder = await OrderService.createOrder(orderData);

        // Automate chat message to the seller in their inbox with product details
        let chat = null;
        let automatedMessage = null;
        try {
            chat = await ChatService.getOrCreateChat(buyerId, resolvedSellerId, productId);
            const orderPayload = {
                type: 'ORDER_CONFIRMATION',
                orderId: codOrderId,
                productId,
                productName,
                productImage: productImage || null,
                quantity: Number(quantity) || 1,
                grandTotal,
                paymentMethod: 'Cash on Delivery',
                deliveryAddress: deliveryAddress || 'Campus Meetup',
                note: `I have placed a Cash on Delivery order for ${quantity}x "${productName}" (₹${grandTotal}). Let's coordinate here for the on-campus handover!`
            };
            const messageText = JSON.stringify(orderPayload);
            automatedMessage = await MessageService.createMessage(chat.id, buyerId, resolvedSellerId, messageText);
            emitNewChat(chat, buyerId, resolvedSellerId);
            emitNewMessage(automatedMessage, resolvedSellerId);
        } catch (chatError) {
            console.error('Failed to automate message to seller:', chatError);
        }

        res.status(201).json({
            success: true,
            order: newOrder,
            chatId: chat?.id,
            message: 'Order placed successfully via Cash on Delivery'
        });
    } catch (error) {
        console.error('Error creating COD order:', error);
        res.status(500).json({ error: 'Failed to place COD order' });
    }
};

export const respondToOrder = async (req, res) => {
    try {
        const { orderId, productId, chatId, action } = req.body;
        const sellerId = req.user.id;

        if (!action || (action !== 'sell' && action !== 'ignore' && action !== 'cancel')) {
            return res.status(400).json({ error: 'Valid action (sell, ignore, or cancel) is required' });
        }

        // Fetch order if orderId provided
        let order = null;
        if (orderId) {
            try {
                order = await prisma.order.findFirst({
                    where: {
                        OR: [
                            { order_id: orderId },
                            { id: orderId }
                        ]
                    }
                });
            } catch (e) {}
        }

        // Fetch component to get title / confirm seller
        let component = null;
        let targetProductId = productId || order?.product_id;
        let buyerId = order?.buyer_id;
        let targetChatId = chatId;

        // If buyerId or targetProductId is missing, resolve from chatId
        if (targetChatId && (!buyerId || !targetProductId)) {
            try {
                const chat = await prisma.chat.findUnique({ where: { id: targetChatId } });
                if (chat) {
                    if (!buyerId) {
                        buyerId = chat.buyer_id === sellerId ? chat.seller_id : chat.buyer_id;
                    }
                    if (!targetProductId && chat.component_id) {
                        targetProductId = chat.component_id;
                    }
                }
            } catch (e) {}
        }

        if (targetProductId) {
            try {
                component = await prisma.component.findUnique({ where: { id: targetProductId } });
            } catch (e) {}
        }

        const productName = component?.title || order?.product_name || 'Component';

        // Resolve chat if not provided
        if (!targetChatId && buyerId && targetProductId) {
            const chat = await ChatService.getOrCreateChat(buyerId, sellerId, targetProductId);
            targetChatId = chat.id;
        }

        let automatedMessage = null;
        let updatedOrder = null;

        if (action === 'sell') {
            // Mark component as SOLD so it will not be listed for others
            if (targetProductId) {
                try {
                    const updatedComp = await prisma.component.update({
                        where: { id: targetProductId },
                        data: { status: 'SOLD' }
                    });
                    emitComponentUpdate(updatedComp);
                } catch (e) {
                    console.error('Error updating component to SOLD:', e);
                }
            }

            // Update order status
            if (order) {
                try {
                    updatedOrder = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            order_status: 'Accepted',
                            status: 'Accepted'
                        }
                    });
                } catch (e) {}
            }

            // Send automated confirmation message from seller
            if (targetChatId) {
                const messageText = `🎉 Deal Confirmed! I have accepted your order and marked "${productName}" as Sold.\n\nLet's meet at the designated spot for the handover!`;
                try {
                    automatedMessage = await MessageService.createMessage(targetChatId, sellerId, buyerId || sellerId, messageText);
                    if (buyerId) {
                        emitNewMessage(automatedMessage, buyerId);
                    }
                } catch (e) {
                    console.error('Error sending seller acceptance message:', e);
                }
            }

            return res.status(200).json({
                success: true,
                action: 'sell',
                orderStatus: 'Accepted',
                productStatus: 'SOLD',
                message: automatedMessage
            });

        } else if (action === 'ignore') {
            // Update order status to Declined / Cancelled
            if (order) {
                try {
                    updatedOrder = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            order_status: 'Declined',
                            status: 'Cancelled'
                        }
                    });
                } catch (e) {}
            }

            // Send automated apology message from seller
            if (targetChatId) {
                const messageText = `🙏 Hi, sorry! I won't be able to fulfill this order for "${productName}" right now as it is currently unavailable. Apologies for the inconvenience!`;
                try {
                    automatedMessage = await MessageService.createMessage(targetChatId, sellerId, buyerId || sellerId, messageText);
                    if (buyerId) {
                        emitNewMessage(automatedMessage, buyerId);
                    }
                } catch (e) {
                    console.error('Error sending seller decline message:', e);
                }
            }

            return res.status(200).json({
                success: true,
                action: 'ignore',
                orderStatus: 'Declined',
                message: automatedMessage
            });
        } else if (action === 'cancel') {
            // Revert component status back to ACTIVE so it is listed again for others
            if (targetProductId) {
                try {
                    const updatedComp = await prisma.component.update({
                        where: { id: targetProductId },
                        data: { status: 'ACTIVE' }
                    });
                    emitComponentUpdate(updatedComp);
                } catch (e) {
                    console.error('Error updating component to ACTIVE:', e);
                }
            }

            // Update order status to Cancelled
            if (order) {
                try {
                    updatedOrder = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            order_status: 'Cancelled',
                            status: 'Cancelled'
                        }
                    });
                } catch (e) {}
            }

            // Send automated cancellation message from seller
            if (targetChatId) {
                const messageText = `⚠️ Sale Cancelled: I have cancelled this sale and relisted "${productName}". The item is now available again.`;
                try {
                    automatedMessage = await MessageService.createMessage(targetChatId, sellerId, buyerId || sellerId, messageText);
                    if (buyerId) {
                        emitNewMessage(automatedMessage, buyerId);
                    }
                } catch (e) {
                    console.error('Error sending seller cancellation message:', e);
                }
            }

            return res.status(200).json({
                success: true,
                action: 'cancel',
                orderStatus: 'Cancelled',
                productStatus: 'ACTIVE',
                message: automatedMessage
            });
        }
    } catch (error) {
        console.error('Error responding to order:', error);
        res.status(500).json({ error: 'Failed to process order action' });
    }
};


