import express from 'express';
import serviceRouter from './routes/services.js';
import userRouter from './routes/users.js';
import orderRouter from './routes/orders.js';
import cors from 'cors';
import dotenv from 'dotenv';
import './db/conn.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({
    origin: ['*'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use('/api/user', userRouter);
app.use('/api/service', serviceRouter);
app.use('/api/order', orderRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server Running on port: ${process.env.PORT}`);
});
