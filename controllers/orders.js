import nodemailer from 'nodemailer';
import OrderModel from '../models/orders.js';
import UserModel from '../models/users.js';
import ServiceModel from '../models/services.js';
import stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const generateUniqueId = () => {
    return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

export const createOrder = async (req, res) => {
    try {
        console.log(req.body);
        const service = await ServiceModel.findById(req.body.service);

        // Check if service exists
        const groupId = generateUniqueId();

        if (!service) {
            res.status(404).send('Service not found');
            return;
        }

        const orders = await Promise.all(req.body.cityServiceProviders.map(async (providerId) => {
            const order = new OrderModel({ ...req.body, serviceProvider: providerId, user: req.user._id, groupId: groupId });
            await order.save();

            const serviceProvider = await UserModel.findById(providerId);

            // Check if serviceProvider is null and skip to the next iteration
            if (!serviceProvider) {
                console.log("No service provider found for ID:", providerId);
                return null;
            }

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "nishantraut90@gmail.com",
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: '"Gharseva Admin" <nishantraut90@gmail.com>',
                to: serviceProvider.email,
                subject: "New Order",
                html: `<p>Hello ${serviceProvider.name},</p> <br/>
                <span>There is a new order for ${service.name}</span> <br/>
                <span>Please Login to your account and go to order -> new order section to view more details.</span>`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Email Sent to service provider:", serviceProvider.email);
                }
            });

            return order;
        }));

        // Filter out any null values from the orders array
        const validOrders = orders.filter(order => order !== null);

        res.send(validOrders);
    } catch (error) {
        console.error(error);
        res.send(error);
    }
}


export const getServiceProviderOrder = async (req, res) => {
    try {
        const user = req.user._id;
        const orders = await OrderModel.find({ serviceProvider: user })
            .populate('user', ['name', 'email', 'profileImage'])
            .populate('service', ['name', 'subServices']);
        res.send(orders);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

export const getAllOrdersByGroupId = async (req, res) => {
    try {
        const groupId = req.params.id;
        const orders = await OrderModel.find({ groupId: groupId })
            .populate('serviceProvider', ['name', 'email', 'profileImage'])
            .populate('service', ['name', 'subServices']);
        res.send(orders);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

export const cancelOrder = async (req, res) => {
    try {
        console.log("Order cancellation in progress");
        const order = await OrderModel.findById(req.params.id);
        const updatedOrder = await OrderModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.send(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

export const completeOrder = async (req, res) => {
    try {
        const fees = req.body.fees;
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const order = await OrderModel.findById(req.params.id);

        if (!order) {
            res.status(404).json({ error: "No such order found." });
            return;
        }

        const lineItems = {
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Order 1",
                },
                unit_amount: fees * 100,
            },
            quantity: 1,
        };

        console.log("Updating current order to 'completed'...");
        const updatedOrder = await OrderModel.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });

        if (!updatedOrder) {
            res.status(404).json({ error: "No such order found." });
            return;
        }

        console.log("Finding other orders with the same groupId...");
        const otherOrders = await OrderModel.find({ groupId: updatedOrder.groupId });

        console.log("Updating status of other orders in the same group to 'cancelled'...");
        await Promise.all(otherOrders.map(async (otherOrder) => {
            if (otherOrder._id.toString() !== req.params.id) {
                otherOrder.status = 'cancelled';
                await otherOrder.save();
            }
        }));

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [lineItems], // Wrap the lineItems object in an array
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/order/success`,
            cancel_url: `${process.env.CLIENT_URL}/order/cancel`,
        });
        console.log(session);

        res.json({ url: session.url });
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).json({ error: error.message });
    }
};


export const getUserOrder = async (req, res) => {
    try {
        const user = req.user;
        const orders = await OrderModel.find({ user: user })
            .populate('serviceProvider', ['name', 'email', 'profileImage'])
            .populate('service', ['name']);

        const groupedOrders = orders.reduce((acc, order) => {
            if (!acc[order.groupId]) {
                acc[order.groupId] = [];
            }
            acc[order.groupId].push(order);
            return acc;
        }, {});

        res.send(groupedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

export const serviceProviderAccepts = async (req, res) => {
    try {
        const updatedOrder = await OrderModel.findByIdAndUpdate(req.params.id, { status: req.body.status, fees: req.body.fees }, { new: true });
        res.send(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

export const totalEarnings = async (req, res) => {
    try {
        const orders = await OrderModel.find({ serviceProvider: req.params.id, status: 'completed' });
        console.log("Orders:", orders);

        const totalEarnings = orders.reduce((acc, order) => {
            console.log("Accumulated Earnings:", acc);
            console.log("Order Fees:", order.fees);
            return acc + order.fees;
        }, 0);

        console.log("Total Earnings:", totalEarnings);
        res.send({ totalEarnings });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}