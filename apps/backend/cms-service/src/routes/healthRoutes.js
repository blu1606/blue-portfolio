// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();

const { healthController } = require('../container');

// System health and monitoring routes
router.get('/health', healthController.healthCheck.bind(healthController));
router.get('/metrics', healthController.getMetrics.bind(healthController));

module.exports = router;
