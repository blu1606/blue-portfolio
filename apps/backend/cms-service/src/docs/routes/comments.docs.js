// src/docs/routes/comments.docs.js
/**
 * @swagger
 * /api/v1/comments/{postId}:
 *   get:
 *     summary: Get approved comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post UUID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                         $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Post not found
 *   post:
 *     summary: Create a comment on a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreate'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
 *       429:
 *         description: Rate limit exceeded (max 5 comments per minute, 20 per hour)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/comments/admin:
 *   get:
 *     summary: Get all comments for admin (including unapproved)
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All comments retrieved successfully
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
 *                         $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 * 
 * /api/v1/comments/{commentId}/approve:
 *   post:
 *     summary: Approve comment (admin only)
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment UUID
 *     responses:
 *       200:
 *         description: Comment approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Comment not found
 * 
 * /api/v1/comments/{commentId}:
 *   delete:
 *     summary: Delete comment (admin only)
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment UUID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Comment not found
 */
