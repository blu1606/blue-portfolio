// src/docs/routes/feedback.docs.js
/**
 * @swagger
 * /api/v1/feedback:
 *   get:
 *     summary: Get all approved feedback
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Approved feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Feedback'
 *   post:
 *     summary: Create authenticated user feedback
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/FeedbackCreate'
 *               - type: object
 *                 properties:
 *                   avatar:
 *                     type: string
 *                     format: binary
 *                     description: User avatar image
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Additional feedback images (max 4)
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackCreate'
 *     responses:
 *       201:
 *         description: Feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/feedback/anonymous:
 *   post:
 *     summary: Create anonymous feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/AnonymousFeedbackCreate'
 *               - type: object
 *                 properties:
 *                   avatar:
 *                     type: string
 *                     format: binary
 *                     description: User avatar image
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Additional feedback images (max 4)
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnonymousFeedbackCreate'
 *     responses:
 *       201:
 *         description: Anonymous feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded (max 3 per 15 minutes, 5 per day)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/feedback/admin:
 *   get:
 *     summary: Get all feedback for admin (including unapproved)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 * 
 * /api/v1/feedback/{feedbackId}/approve:
 *   post:
 *     summary: Approve feedback (admin only)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feedback UUID
 *     responses:
 *       200:
 *         description: Feedback approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Feedback not found
 */
