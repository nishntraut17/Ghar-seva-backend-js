import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import Order from '../models/orders.js';
import { sendVerificationMail } from '../util/sendVerificationMail.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password -emailToken -isVerified -role -testimonials -services");
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const register = async (req, res) => {
    try {
        const { name, email, role, mobile, address, city, password, profileImage } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ message: "User already exists with this email" });
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const emailToken = crypto.randomBytes(64).toString('hex');
            const newUser = new User({
                name,
                role,
                email,
                mobile,
                address,
                city,
                profileImage,
                password: hashedPassword,
                emailToken
            });
            await newUser.save();
            sendVerificationMail(newUser);
            res.status(201).json({ message: "User registered successfully. Please verify your email to login" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(400).send("Incorrect credentials");
            return;
        }

        const verifyPass = await bcrypt.compare(req.body.password, user.password);
        if (!verifyPass) {
            res.status(400).send("Incorrect credentials");
            return;
        }

        if (user.isVerified === false) {
            res.status(400).send("Email not verified");
            return;
        }

        const token = jwt.sign(
            {
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role,
                isVerified: user.isVerified,
                mobile: user.mobile,
                city: user.city,
                address: user.address
            },
            process.env.JWT_TOKEN || "",
            {
                expiresIn: "2 days",
            }
        );
        res.status(201).send({ msg: "User logged in successfully", token });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};


export const verifyEmail = async (req, res) => {
    try {
        const emailToken = req.body.emailToken || null;
        if (!emailToken) {
            res.status(404).send("Email Token not found...");
            return;
        }

        const user = await User.findOne({ emailToken });

        if (user) {
            user.emailToken = undefined;
            user.isVerified = true;

            await user.save();

            const token = jwt.sign(
                { _id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, role: user.role, isVerified: user?.isVerified, mobile: user.mobile, city: user.city, address: user.address },
                process.env.JWT_TOKEN,
                { expiresIn: "2 days" }
            );

            res.status(200).send(token);

        } else {
            res.status(404).send("Email verification failed, invalid token !");
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateUser = async (req, res) => {
    try {
        const { email, name, profileImage, mobile, address, city, password } = req.body;
        const user = await User.findOne({ _id: req.params.id });

        if (!user) {
            res.status(404).send("No such user exists");
            return;
        }

        user.email = email;
        user.name = name;
        user.profileImage = profileImage;
        user.mobile = mobile;
        user.address = address;
        user.city = city;
        user.password = await bcrypt.hash(password, 10);

        await user.save();
        const token = jwt.sign(
            { _id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, role: user.role, isVerified: user?.isVerified, mobile: user.mobile, city: user.city, address: user.address },
            process.env.JWT_TOKEN,
            { expiresIn: "2 days" }
        );

        res.status(201).send(token);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate({
                path: 'services',
                select: ['name', 'image']
            })
            .populate({
                path: 'testimonials',
                populate: {
                    path: 'customer',
                    select: ['name', 'profileImage']
                }
            })
            .select('-password -emailToken -isVerified -role');

        if (!user) {
            res.status(404).json({ error: "User not found!" });
            return;
        }

        res.send(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const rateAndReviewUser = async (req, res) => {
    try {
        const { review, rating, user } = req.body;

        const serviceProvider = await User.findById(req.params.id);

        if (!serviceProvider) {
            res.status(404).json({ error: "User not found." });
            return;
        }

        if (!review) {
            res.status(400).json({ error: "Review is required." });
            return;
        }

        if (!rating) {
            res.status(400).json({ error: "Rating is required." });
            return;
        }

        serviceProvider.testimonials ??= []; // Add this line to ensure 'serviceProvider.testimonials' is not undefined

        serviceProvider.testimonials.push({
            customer: user,
            rating: rating,
            review: review,
            order: req.body.order,
        });
        await serviceProvider.save();

        const order = await Order.findById(req.body.order);
        if (order) {
            order.disableReview = true;
            await order.save();
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "nishantraut90@gmail.com",
                pass: process.env.EMAIL_PASS || "", // Assuming EMAIL_PASS is defined in environment variables
            },
        });

        const customer = await User.findById(user);

        const mailOptions = {
            from: '"Gharseva Admin" <nishantraut90@gmail.com>',
            to: serviceProvider.email,
            subject: "New Testimonial 😄",
            html: `<p>Hello ${serviceProvider.name},</p> <br/>
            <span>You have got a new testimonial for your work by customer: ${customer?.name}</span> <br/>
            <span>Please Login to your account and go to Profile section to view the details.</span>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Sent to all Service Providers");
            }
        });

        res.status(201).json({ message: "Rating and Review added successfully." });

    } catch (error) {
        console.log(error);
        res.send(error);
    }
};

export const viewTestimonials = async (req, res) => {
    try {
        const serviceProvider = await User.findById(req.params.id)
            .populate({
                path: 'testimonials',
                populate: {
                    path: 'customer',
                    select: ['name', 'profileImage']
                }
            })
            .select('testimonials');

        if (!serviceProvider) {
            res.status(404).json({ error: "User not found." });
            return;
        }

        res.send(serviceProvider.testimonials);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
};