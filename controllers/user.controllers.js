const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User.model');
const Role = require('../models/Role.model');

// Create new user
exports.createUser = async (req, res, next) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all required fields.' });
    }
    try {
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create new user
        const newUser = new User({
            username,
            email: req.body.email || '',
            password: hashedPassword,
            role: role || 'user',
        });
        await newUser.save();

        res.status(201).json({ success: true, message: 'User registered successfully.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
}

// Delete user
exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.body.userId;

        const deletedUser = await User.findOneAndDelete({ _id: userId });
        console.log(deletedUser);

        deletedUser && res.status(200).json({
            success: true,
            message: `User ${deletedUser.username} deleted!`
        });
        
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Edit user
exports.editUser = async (req, res, next) => {
    try {
        const userId = req.body.userId;

        const user = await User.findOneAndUpdate({ _id: userId }, req.body, { new: true });
        console.log(user);

        user && res.status(200).json({
            success: true,
            message: `User ${user.username} updated!`
        });
        
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// User login included admin.
exports.login = async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all required fields.' });
    }
    try {
        const user = await User.find({
            $or: [{ email: username }, { username }]
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const payload = {
            user: {
                id: user._id,
                role: user[0].role,
            },
        };
        jwt.sign(
            payload,
            'jwt_secret',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({ token, role: user[0].role, success: true });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
}

// Get all users
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'roles',
                    localField: 'role',
                    foreignField: 'role',
                    as: 'role'
                },
            },
            {
                $unwind: '$role',
            },
            {
                $project: {
                    username: 1,
                    email: 1,
                    roleId: '$role._id',
                    role: '$role.role'
                }
            }
        ]);
        users && res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        console.log(err);
        // next(err);
    }
}

// Get user details
exports.getUserDetails = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await User.findOne({ _id: userId });
        user && res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        console.log(err);
        // next(err);
    }
}

// Get all roles
exports.getAllRoles = async (req, res, next) => {
    try {
        const roles = await Role.find();
        roles && res.status(200).json({
            success: true,
            roles
        });
    } catch (err) {
        console.log(err);
        // next(err);
    }
}

// Get admin dashboard details
exports.dashboardDetails = async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        const roleCount = await Role.countDocuments();

        (userCount && roleCount) && res.status(200).json({
            success: true,
            userCount,
            roleCount
        });
    } catch (err) {
        console.log(err);
        // next(err);
    }
}

// Reset admin's password
exports.resetAdminPassword = async (req, res, next) => {
    try {
        const { password, confirmPassword } = req.body;
        const adminId = '66d54be92e4f7a6afea2b4bb';

        if(password !== confirmPassword){
            res.status(400).json({
                message: "Password and Confirm-Password doesn't match"
            });
            next();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const changePassword = await User.findByIdAndUpdate(
            { _id: adminId },
            {
                password: hashedPassword
            },
            { new: true }
        );

        changePassword && res.status(200).json({
            success: true,
            message: 'Password changed successfully.'
        });
    } catch (err) {
        console.log(err);
        // next(err);
        // res.status(500).json(err);
    }
}