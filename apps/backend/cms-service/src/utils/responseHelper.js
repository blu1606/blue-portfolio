// src/utils/responseHelper.js
const { SuccessResponse } = require('common/core/success.response');

const ResponseHelper = {
    /**
     * Send paginated response
     */
    paginatedResponse: (res, message, data, total, limit, offset, extra = {}) => {
        // normalize numbers
        const limitNum = Number(limit) || 0;
        const offsetNum = Number(offset) || 0;

        const metadata = {
            posts: data,
            total: Number(total) || 0,
            limit: limitNum,
            offset: offsetNum,
            hasMore: (offsetNum + limitNum) < Number(total)
        };

        // Merge any extra metadata (e.g., query)
        Object.assign(metadata, extra);

        return new SuccessResponse({
            message,
            metadata
        }).send(res);
    },

    /**
     * Handle errors consistently
     */
    handleError: (res, error) => {
        // Handle known error types with statusCode
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        
        // Default to 500 for unknown errors
        console.error('Unhandled error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    },

    /**
     * Success response
     */
    successResponse: (res, message, data = null) => {
        return new SuccessResponse({
            message,
            metadata: data
        }).send(res);
    }
};

module.exports = ResponseHelper;