exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    jwt.verify(token, 'jwt_secret', (err, decoded) => { // Replace with your secret
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }
        req.user = decoded.user;
        next();
    });
}