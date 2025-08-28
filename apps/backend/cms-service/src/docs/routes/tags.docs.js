// src/docs/routes/tags.docs.js
/**
 * @swagger
 * /api/v1/tags:
 *   get:
 *     summary: Get all active tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
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
 *                         $ref: '#/components/schemas/Tag'
 *   post:
 *     summary: Create a new tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagCreate'
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Validation error or tag already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 * 
 * /api/v1/tags/{tagId}:
 *   get:
 *     summary: Get a tag by ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tag UUID
 *     responses:
 *       200:
 *         description: Tag retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Tag not found
 *   put:
 *     summary: Update a tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tag UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagUpdate'
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Tag not found
 *   delete:
 *     summary: Delete a tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tag UUID
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot delete tag with associated posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Tag not found
 * 
 * /api/v1/tags/search:
 *   get:
 *     summary: Search tags
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for tag name
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                         $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
