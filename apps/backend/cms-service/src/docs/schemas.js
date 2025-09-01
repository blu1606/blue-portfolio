// src/docs/schemas.js
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 *   
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 *         metadata:
 *           type: object
 *           description: Response data
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *     
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message"
 *         code:
 *           type: string
 *           example: "ERROR_CODE"
 *         details:
 *           type: object
 *           description: Additional error details
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *     
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Post UUID
 *         title:
 *           type: string
 *           description: Post title
 *         content:
 *           type: string
 *           description: Post content (HTML)
 *         summary:
 *           type: string
 *           description: Post summary/excerpt
 *         slug:
 *           type: string
 *           description: URL-friendly post identifier
 *         thumbnail:
 *           type: string
 *           format: uri
 *           description: Post thumbnail image URL
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: Additional post images
 *         category:
 *           type: string
 *           description: Post category
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           description: Post publication status
 *         featured:
 *           type: boolean
 *           description: Whether post is featured
 *         reading_time:
 *           type: integer
 *           description: Estimated reading time in minutes
 *         view_count:
 *           type: integer
 *           description: Number of views
 *         like_count:
 *           type: integer
 *           description: Number of likes
 *         share_count:
 *           type: integer
 *           description: Number of shares
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *           description: Associated tags
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         published_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     
 *     PostCreate:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: Post title
 *         content:
 *           type: string
 *           minLength: 1
 *           description: Post content (HTML)
 *         summary:
 *           type: string
 *           maxLength: 500
 *           description: Post summary/excerpt
 *         category:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Post category
 *         status:
 *           type: string
 *           enum: [draft, published]
 *           default: draft
 *           description: Post publication status
 *         featured:
 *           type: boolean
 *           default: false
 *           description: Whether post is featured
 *         tag_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Associated tag IDs
 *         published_at:
 *           type: string
 *           format: date-time
 *           description: Publication date (for scheduled posts)
 *     
 *     PostUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: Post title
 *         content:
 *           type: string
 *           minLength: 1
 *           description: Post content (HTML)
 *         summary:
 *           type: string
 *           maxLength: 500
 *           description: Post summary/excerpt
 *         category:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Post category
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           description: Post publication status
 *         featured:
 *           type: boolean
 *           description: Whether post is featured
 *         tag_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Associated tag IDs
 *         published_at:
 *           type: string
 *           format: date-time
 *           description: Publication date
 *     
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Feedback UUID
 *         name:
 *           type: string
 *           description: User name
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         company:
 *           type: string
 *           description: User company
 *         position:
 *           type: string
 *           description: User position/role
 *         feedback:
 *           type: string
 *           description: Feedback content
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating (1-5 stars)
 *         avatar_url:
 *           type: string
 *           format: uri
 *           description: User avatar URL
 *         image_urls:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: Additional feedback images
 *         is_anonymous:
 *           type: boolean
 *           description: Whether feedback is anonymous
 *         is_approved:
 *           type: boolean
 *           description: Whether feedback is approved
 *         user_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Associated user ID (if authenticated)
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     FeedbackCreate:
 *       type: object
 *       required:
 *         - feedback
 *         - rating
 *       properties:
 *         feedback:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           description: Feedback content
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating (1-5 stars)
 *         company:
 *           type: string
 *           maxLength: 255
 *           description: User company
 *         position:
 *           type: string
 *           maxLength: 255
 *           description: User position/role
 *     
 *     AnonymousFeedbackCreate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - feedback
 *         - rating
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: User name
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: User email
 *         company:
 *           type: string
 *           maxLength: 255
 *           description: User company
 *         position:
 *           type: string
 *           maxLength: 255
 *           description: User position/role
 *         feedback:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           description: Feedback content
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating (1-5 stars)
 *     
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Comment UUID
 *         content:
 *           type: string
 *           description: Comment content
 *         author_name:
 *           type: string
 *           description: Comment author name
 *         author_email:
 *           type: string
 *           format: email
 *           description: Comment author email
 *         post_id:
 *           type: string
 *           format: uuid
 *           description: Associated post ID
 *         is_approved:
 *           type: boolean
 *           description: Whether comment is approved
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     CommentCreate:
 *       type: object
 *       required:
 *         - content
 *         - author_name
 *         - author_email
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: Comment content
 *         author_name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Comment author name
 *         author_email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: Comment author email
 *     
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Tag UUID
 *         name:
 *           type: string
 *           description: Tag name
 *         slug:
 *           type: string
 *           description: URL-friendly tag identifier
 *         description:
 *           type: string
 *           description: Tag description
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           description: Tag color (hex format)
 *         is_active:
 *           type: boolean
 *           description: Whether tag is active
 *         post_count:
 *           type: integer
 *           description: Number of associated posts
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     TagCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Tag name
 *         description:
 *           type: string
 *           maxLength: 255
 *           description: Tag description
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           default: '#3b82f6'
 *           description: Tag color (hex format)
 *     
 *     TagUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Tag name
 *         description:
 *           type: string
 *           maxLength: 255
 *           description: Tag description
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           description: Tag color (hex format)
 *         is_active:
 *           type: boolean
 *           description: Whether tag is active
 */
