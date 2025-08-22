// __tests__/api/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock all external modules at the top of the file. This is crucial for Jest's hoisting mechanism.
jest.mock('../../src/db/initSupabase', () => {
    const mockSupabase = {
        from: jest.fn(() => mockSupabase),
        select: jest.fn(() => mockSupabase),
        eq: jest.fn(() => mockSupabase),
        insert: jest.fn(() => mockSupabase),
        single: jest.fn(() => mockSupabase),
    };
    return mockSupabase;
});

jest.mock('bcryptjs', () => ({
    ...jest.requireActual('bcryptjs'),
    hash: jest.fn(() => Promise.resolve('hashedpassword123')),
    compare: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'),
    sign: jest.fn(() => 'mocked-jwt-token'),
}));

// Main test suite for Auth API Endpoints
describe('Auth API Endpoints', () => {
    // Clear all mocks after each test to ensure a clean state
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test cases for user registration
    describe('POST /api/v1/auth/register', () => {
        const newUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        };

        it('should successfully register a new user and return 201 Created', async () => {
            const supabase = require('../../src/db/initSupabase');
            
            // Mock Supabase to simulate a user not being found
            supabase.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: null })
                    })
                }),
                // Mock Supabase to simulate a successful insert
                insert: jest.fn().mockResolvedValue({ data: [newUser], error: null }),
            }));

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.message).toEqual('Registered OK!');
        });
        
        it('should return 400 Bad Request if a required field is missing', async () => {
            const incompleteUser = { username: 'testuser', email: 'test@example.com' };
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(incompleteUser);

            expect(response.status).toBe(400);
            expect(response.body.message).toEqual('Username, email, and password are required.');
        });
        
        it('should return 400 Bad Request for an invalid email format', async () => {
            const invalidEmailUser = { username: 'testuser', email: 'invalid-email', password: 'password123' };
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidEmailUser);

            expect(response.status).toBe(400);
            expect(response.body.message).toEqual('Invalid email format.');
        });
        
        it('should return 400 Bad Request if the password is too short', async () => {
            const insecurePasswordUser = { username: 'testuser', email: 'test@example.com', password: '123' };
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(insecurePasswordUser);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toEqual('Password must be at least 6 characters long.');
        });
        
        it('should return 409 Conflict if the email already exists', async () => {
            const supabase = require('../../src/db/initSupabase');

            // Mock Supabase to simulate finding an existing user
            supabase.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'existing-user-id' }, error: null })
                    })
                }),
            }));
            
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(newUser);
            
            expect(response.status).toBe(409);
            expect(response.body.message).toEqual('Email already registered');
        });
    });

    // Test cases for user login
    describe('POST /api/v1/auth/login', () => {
        const testUser = {
            id: '12345',
            username: 'testuser',
            email: 'test@example.com',
            password_hash: '$2a$10$hashedpassword',
        };

        it('should successfully log in a user and return a token', async () => {
            const supabase = require('../../src/db/initSupabase');
            const bcrypt = require('bcryptjs');
            
            // Mock Supabase to simulate finding a user
            supabase.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: testUser, error: null })
                    })
                })
            }));
            
            // Mock bcrypt to simulate a successful password comparison
            bcrypt.compare.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toEqual('Login successful!');
            expect(response.body.metadata.token).toBeDefined();
        });

        it('should return 401 Unauthorized for an incorrect password', async () => {
            const supabase = require('../../src/db/initSupabase');
            const bcrypt = require('bcryptjs');

            // Mock Supabase to simulate finding a user
            supabase.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: testUser, error: null })
                    })
                })
            }));
            
            // Mock bcrypt to simulate a failed password comparison
            bcrypt.compare.mockResolvedValue(false);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.message).toEqual('Invalid credentials');
        });
        
        it('should return 401 Unauthorized if the email does not exist', async () => {
            const supabase = require('../../src/db/initSupabase');

            // Mock Supabase to simulate not finding a user
            supabase.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
                    })
                })
            }));

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect(response.status).toBe(401);
            expect(response.body.message).toEqual('Invalid credentials');
        });
        
        it('should return 400 Bad Request if a required login field is missing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(400);
            expect(response.body.message).toEqual('Email and password are required.');
        });
    });
});