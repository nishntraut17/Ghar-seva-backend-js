import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
        res.sendStatus(401).send("Unauthorized");
        return;
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
            console.error("JWT verification error:", err);
            res.status(401).send("Unauthorized");
            return;
        }

        req.user = decoded;
        next();
    });
};

export default auth;
