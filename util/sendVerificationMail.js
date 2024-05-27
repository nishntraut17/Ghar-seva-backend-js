import nodemailer from 'nodemailer';

export const sendVerificationMail = (user) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `Gharseva Admin: ${process.env.EMAIL}`,
        to: user.email,
        subject: "Email Verification",
        html: `<p>Hello ${user.name}, verify your email by clicking this link...</p>
        <a href='${process.env.CLIENT_URL}/verify-email?emailToken=${user.emailToken}'>Verify your email</a>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log(info);
        }
    });
};

export const newTestimonialMail = (serviceProvider, customer) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `Gharseva Admin: ${process.env.EMAIL}`,
        to: serviceProvider.email,
        subject: "New Testimonial 😄",
        html: `<p>Hello ${serviceProvider.name},</p> <br/>
        <span>You have got new testimonial for your work by customer: ${customer.name}</span> <br/>
        <span>Please Login to your account and go to Profile section to view the details.</span>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Email Sent to all Service Providers");
        }
    });
}
