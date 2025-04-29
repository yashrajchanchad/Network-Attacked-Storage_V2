exports.checkRole = (roles) => (req, res, next) => {
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
        return res.status(403).send('Access Denied');
    }
    next();
};