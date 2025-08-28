// src/middlewares/authorizationMiddleware.js
const { ForbiddenError } = require('../core/error.response');

const authorize = (role) => (req, res, next) => {
    // req.user được thêm vào bởi authenticationMiddleware
    const userRole = req.user && req.user.role;
    if (!userRole || userRole !== role) {
        throw new ForbiddenError('You do not have permission to perform this action.');
    }
    next();
};

module.exports = { authorize };