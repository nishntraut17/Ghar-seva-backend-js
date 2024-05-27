import express from 'express';
import auth from "../middleware/auth.js";
import { createOrder, getServiceProviderOrder, getUserOrder, cancelOrder, serviceProviderAccepts, completeOrder, getAllOrdersByGroupId, totalEarnings } from '../controllers/orders.js';

const orderRouter = express.Router();

orderRouter.post('/', auth, (req, res) => createOrder(req, res));
orderRouter.get('/', auth, (req, res) => getServiceProviderOrder(req, res));
orderRouter.get('/user/:id', auth, (req, res) => getAllOrdersByGroupId(req, res));
orderRouter.get('/user', auth, (req, res) => getUserOrder(req, res));
orderRouter.put('/cancel/:id', auth, (req, res) => cancelOrder(req, res));
orderRouter.put('/service-provider-accept/:id', auth, (req, res) => serviceProviderAccepts(req, res));
orderRouter.put('/complete/:id', auth, (req, res) => completeOrder(req, res));
orderRouter.get('/total-earning/:id', auth, (req, res) => totalEarnings(req, res));

export default orderRouter;
