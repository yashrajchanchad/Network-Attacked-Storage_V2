const Role = require('../models/Role.model');

// Create new role
exports.createRole = async (req, res, next) => {
    try {
        const { role, permissions } = req.body;

        if(!role || !permissions){
            res.status(400).json({
                message: 'Please input the data!'
            });
        }
        
        const newRole = new Role({
            role, permissions
        });
        await newRole.save();
    
        newRole && res.status(200).json({
            success: true,
            message: 'New role created!'
        });
    } catch (err) {
        console.log(err);
        res.status(500).json(err); 
    }
}

// Get role details
exports.getRoleDetails = async (req, res, next) => {
    try {
        const roleId = req.params.id;
        const role = await Role.findOne({ _id: roleId });
        role && res.status(200).json({
            success: true,
            role
        });
    } catch (err) {
        console.log(err);
        // next(err);
    }
}

// Delete role
exports.deleteRole = async (req, res, next) => {
    try {
        const roleId = req.params.id;
        const role = await Role.findOneAndDelete({ _id: roleId });

        role && res.status(200).json({
            success: true,
            message: `Role ${role} deleted!`
        });
    } catch (err) {
        console.log(err);
        // next(err);
    }
}