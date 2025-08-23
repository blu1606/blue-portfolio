const request = require('supertest');
const app = require('../../src/app');

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


// Main test suite for Auth API Endpoints
describe('Register API Endpoint', () => {
    // Clear all mocks after each test to ensure a clean state
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test cases for user registration
    describe('POST /api/v1/auth/register', () => {
        const newUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'StrongSecure789!',
        };

        it('should successfully register a new user and return 201 Created', async () => {
            const supabase = require('../../src/db/initSupabase');
            
            // Mock Supabase to simulate a user not being found, then successful insert
            supabase.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: null, error: null })
                            })
                        }),
                        // Mock Supabase to simulate a successful insert with chaining
                        insert: jest.fn().mockReturnValue({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ 
                                    data: { id: '123', ...newUser }, 
                                    error: null 
                                })
                            })
                        }),
                    };
                }
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: null, error: null })
                        })
                    }),
                };
            });

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.message).toEqual('Registration successful!');
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
            const invalidEmailUser = { username: 'testuser', email: 'invalid-email', password: 'StrongSecure789!' };
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidEmailUser);

            expect(response.status).toBe(400);
            expect(response.body.message).toEqual('Invalid email format');
        });
        
        it('should return 400 Bad Request if the password is too short', async () => {
            const insecurePasswordUser = { username: 'testuser', email: 'test@example.com', password: '123' };
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(insecurePasswordUser);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toEqual('Password validation failed: Password must be at least 12 characters long. Password must contain at least one uppercase letter. Password must contain at least one lowercase letter. Password must contain at least one special character.');
        });
        
        it('should return 409 Conflict if the email already exists', async () => {
            const supabase = require('../../src/db/initSupabase');

            // Mock Supabase to simulate finding an existing user
            supabase.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ 
                                    data: { id: 'existing-user-id', email: 'test@example.com' }, 
                                    error: null 
                                })
                            })
                        }),
                    };
                }
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: null, error: null })
                        })
                    }),
                };
            });
            
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(newUser);
            
            expect(response.status).toBe(409);
            expect(response.body.message).toEqual('Email already registered');
        });
    });
});