// __tests__/unit/usecases/createPost.test.js
const { createCreatePostUseCase } = require('../../../src/usecases/post/createPost');
const { BadRequestError, ConflictRequestError } = require('common/core/error.response');

describe('CreatePost UseCase', () => {
    let mockPostRepository;
    let mockCloudinaryService;
    let mockMediaRepository;
    let mockCacheService;
    let createPostUseCase;

    beforeEach(() => {
        mockPostRepository = {
            findBySlug: jest.fn(),
            create: jest.fn()
        };

        mockCloudinaryService = {
            uploadFile: jest.fn()
        };

        mockMediaRepository = {
            create: jest.fn()
        };

        mockCacheService = {
            del: jest.fn()
        };

        createPostUseCase = createCreatePostUseCase(
            mockPostRepository,
            mockCloudinaryService,
            mockMediaRepository,
            mockCacheService
        );
    });

    describe('Input Validation', () => {
        it('should throw BadRequestError when title is missing', async () => {
            await expect(createPostUseCase(null, 'content', 'user123'))
                .rejects
                .toThrow(BadRequestError);
        });

        it('should throw BadRequestError when content is missing', async () => {
            await expect(createPostUseCase('title', null, 'user123'))
                .rejects
                .toThrow(BadRequestError);
        });

        it('should throw BadRequestError when authorId is missing', async () => {
            await expect(createPostUseCase('title', 'content', null))
                .rejects
                .toThrow(BadRequestError);
        });

        it('should throw BadRequestError when title is empty string', async () => {
            await expect(createPostUseCase('', 'content', 'user123'))
                .rejects
                .toThrow(BadRequestError);
        });

        it('should throw BadRequestError when content is empty string', async () => {
            await expect(createPostUseCase('title', '', 'user123'))
                .rejects
                .toThrow(BadRequestError);
        });
    });

    describe('Business Logic', () => {
        it('should create post successfully with valid data', async () => {
            const title = 'Test Post Title';
            const content = 'Test post content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123',
                title,
                slug: 'test-post-title',
                content,
                author_id: authorId,
                is_published: false
            });
            mockCacheService.del.mockResolvedValue(1);

            const result = await createPostUseCase(title, content, authorId);

            expect(result).toEqual({
                message: 'Post created successfully',
                post: expect.objectContaining({
                    id: 'post123',
                    title,
                    slug: 'test-post-title',
                    content,
                    author_id: authorId,
                    is_published: false
                })
            });
        });

        it('should throw ConflictRequestError when post with same slug exists', async () => {
            const title = 'Existing Post Title';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue({
                id: 'existing-post',
                slug: 'existing-post-title'
            });

            await expect(createPostUseCase(title, content, authorId))
                .rejects
                .toThrow(ConflictRequestError);

            expect(mockPostRepository.create).not.toHaveBeenCalled();
        });

        it('should generate correct slug from title', async () => {
            const title = 'Test Post With Special Characters!@#';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123',
                slug: 'test-post-with-special-characters'
            });
            mockCacheService.del.mockResolvedValue(1);

            await createPostUseCase(title, content, authorId);

            expect(mockPostRepository.findBySlug).toHaveBeenCalledWith('test-post-with-special-characters');
        });

        it('should set post as draft by default', async () => {
            const title = 'Draft Post';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123',
                is_published: false
            });
            mockCacheService.del.mockResolvedValue(1);

            await createPostUseCase(title, content, authorId);

            expect(mockPostRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    is_published: false
                })
            );
        });

        it('should set correct timestamps', async () => {
            const title = 'Timestamp Test';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123'
            });
            mockCacheService.del.mockResolvedValue(1);

            await createPostUseCase(title, content, authorId);

            expect(mockPostRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
            );
        });
    });

    describe('File Upload Logic', () => {
        it('should handle post creation without files', async () => {
            const title = 'Post Without Files';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123'
            });
            mockCacheService.del.mockResolvedValue(1);

            await createPostUseCase(title, content, authorId, []);

            expect(mockCloudinaryService.uploadFile).not.toHaveBeenCalled();
            expect(mockMediaRepository.create).not.toHaveBeenCalled();
        });

        it('should upload files and create media records when files are provided', async () => {
            const title = 'Post With Files';
            const content = 'Content';
            const authorId = 'user123';
            const files = [
                { buffer: Buffer.from('image1'), mimetype: 'image/jpeg' },
                { buffer: Buffer.from('image2'), mimetype: 'image/png' }
            ];

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123'
            });
            mockCloudinaryService.uploadFile
                .mockResolvedValueOnce({
                    publicId: 'public_id_1',
                    url: 'https://cloudinary.com/image1.jpg'
                })
                .mockResolvedValueOnce({
                    publicId: 'public_id_2',
                    url: 'https://cloudinary.com/image2.png'
                });
            mockMediaRepository.create
                .mockResolvedValueOnce({ id: 'media1' })
                .mockResolvedValueOnce({ id: 'media2' });
            mockCacheService.del.mockResolvedValue(1);

            await createPostUseCase(title, content, authorId, files);

            expect(mockCloudinaryService.uploadFile).toHaveBeenCalledTimes(2);
            expect(mockMediaRepository.create).toHaveBeenCalledTimes(2);
            
            expect(mockMediaRepository.create).toHaveBeenCalledWith({
                post_id: 'post123',
                type: 'image',
                public_id: 'public_id_1',
                url: 'https://cloudinary.com/image1.jpg',
                alt_text: title
            });
        });

        it('should handle video files correctly', async () => {
            const title = 'Post With Video';
            const content = 'Content';
            const authorId = 'user123';
            const files = [
                { buffer: Buffer.from('video'), mimetype: 'video/mp4' }
            ];

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123'
            });
            mockCloudinaryService.uploadFile.mockResolvedValue({
                publicId: 'video_id',
                url: 'https://cloudinary.com/video.mp4'
            });
            mockMediaRepository.create.mockResolvedValue({ id: 'media1' });
            mockCacheService.del.mockResolvedValue(1);

            await createPostUseCase(title, content, authorId, files);

            expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(
                files[0].buffer,
                'video'
            );
            expect(mockMediaRepository.create).toHaveBeenCalledWith({
                post_id: 'post123',
                type: 'video',
                public_id: 'video_id',
                url: 'https://cloudinary.com/video.mp4',
                alt_text: title
            });
        });
    });

    describe('Cache Management', () => {
        it('should invalidate cache after successful post creation', async () => {
            const title = 'Cache Test Post';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123'
            });
            mockCacheService.del.mockResolvedValue(1);

            await createPostUseCase(title, content, authorId);

            expect(mockCacheService.del).toHaveBeenCalledWith('posts:all');
        });

        it('should not invalidate cache when post creation fails', async () => {
            const title = 'Failed Post';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockRejectedValue(new Error('Database error'));

            await expect(createPostUseCase(title, content, authorId))
                .rejects
                .toThrow('Database error');

            expect(mockCacheService.del).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should propagate repository errors', async () => {
            const title = 'Error Test';
            const content = 'Content';
            const authorId = 'user123';

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockRejectedValue(new Error('Database connection failed'));

            await expect(createPostUseCase(title, content, authorId))
                .rejects
                .toThrow('Database connection failed');
        });

        it('should handle cloudinary upload errors', async () => {
            const title = 'Upload Error Test';
            const content = 'Content';
            const authorId = 'user123';
            const files = [
                { buffer: Buffer.from('image'), mimetype: 'image/jpeg' }
            ];

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123'
            });
            mockCloudinaryService.uploadFile.mockRejectedValue(new Error('Upload failed'));

            await expect(createPostUseCase(title, content, authorId, files))
                .rejects
                .toThrow('Upload failed');
        });

        it('should handle media repository errors', async () => {
            const title = 'Media Error Test';
            const content = 'Content';
            const authorId = 'user123';
            const files = [
                { buffer: Buffer.from('image'), mimetype: 'image/jpeg' }
            ];

            mockPostRepository.findBySlug.mockResolvedValue(null);
            mockPostRepository.create.mockResolvedValue({
                id: 'post123'
            });
            mockCloudinaryService.uploadFile.mockResolvedValue({
                publicId: 'public_id',
                url: 'https://cloudinary.com/image.jpg'
            });
            mockMediaRepository.create.mockRejectedValue(new Error('Media creation failed'));

            await expect(createPostUseCase(title, content, authorId, files))
                .rejects
                .toThrow('Media creation failed');
        });
    });
});
