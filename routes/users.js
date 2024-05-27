import express from "express";
import { register, login, getAllUsers, getUser, updateUser, verifyEmail, rateAndReviewUser, viewTestimonials } from '../controllers/users.js';
import auth from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/verify-email', verifyEmail);
userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUser);
userRouter.put('/:id', updateUser);
userRouter.post('/update', updateUser);
userRouter.put('/rate-review/:id', rateAndReviewUser);
userRouter.get('/testimonials/:id', viewTestimonials);

export default userRouter;
