# Enhanced Database Schema Documentation

## 📋 Overview

This document describes the enhanced database schema for the CMS service, specifically designed for **Supabase PostgreSQL**. The schema supports:

- ✅ **Anonymous feedback** without authentication
- ✅ **Image uploads** for avatars and feedback images
- ✅ **Rate limiting** and spam protection
- ✅ **Advanced analytics** and tracking
- ✅ **Row Level Security (RLS)** for Supabase

## 🗃️ Database Files

### Core Files
1. **`enhanced_schema.sql`** - Complete database schema for new projects
2. **`migration_v2.sql`** - Migration script for existing databases
3. **`supabase_setup.sql`** - Supabase-specific setup commands

## 📊 Database Schema

### 🔧 Main Tables

#### 1. **feedbacks** (Enhanced)
```sql
feedbacks (
    id UUID PRIMARY KEY,
    
    -- User Information
    user_id UUID,              -- NULL for anonymous
    author_name VARCHAR(100),   -- Required for anonymous
    author_email VARCHAR(254),  -- Optional for anonymous
    author_avatar_url TEXT,     -- Uploaded avatar
    
    -- Content
    content TEXT NOT NULL,
    rating INTEGER (1-5),       -- Star rating
    images JSON,                -- Array of image URLs
    
    -- Metadata
    is_approved BOOLEAN,
    is_anonymous BOOLEAN,
    ip_address INET,           -- For rate limiting
    user_agent TEXT,           -- For analytics
    
    -- Timestamps
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID
)
```

#### 2. **media** (New)
```sql
media (
    id UUID PRIMARY KEY,
    filename VARCHAR(500),
    original_name VARCHAR(500),
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    url TEXT,
    cloudinary_public_id VARCHAR(500),
    entity_type VARCHAR(50),    -- 'feedback', 'post', 'avatar'
    entity_id UUID,
    uploaded_by UUID,
    created_at TIMESTAMP
)
```

#### 3. **analytics** (New)
```sql
analytics (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100),    -- 'feedback_submitted', 'post_viewed'
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP
)
```

### 🔍 Views

#### **approved_feedbacks**
Pre-joined view for public feedback display:
```sql
SELECT 
    f.id,
    f.content,
    f.rating,
    f.images,
    f.is_anonymous,
    f.created_at,
    CASE 
        WHEN f.is_anonymous = false THEN u.full_name
        ELSE f.author_name
    END as author_name,
    -- ... avatar and email logic
FROM feedbacks f
LEFT JOIN users u ON f.user_id = u.id
WHERE f.is_approved = true;
```

### 🛡️ Security Features

#### **Row Level Security (RLS)**
- **Public access** to approved feedbacks
- **Anonymous users** can insert feedback
- **Authenticated users** can view their own feedback
- **Media files** are publicly viewable

#### **Rate Limiting Functions**
```sql
-- Check feedback count by IP (24 hours)
get_feedback_count_by_ip(ip_addr INET, time_window_hours INTEGER)

-- Check for duplicate feedback (30 minutes)
check_duplicate_feedback_by_ip(ip_addr INET, time_window_minutes INTEGER)
```

## 🚀 Setup Instructions

### For New Supabase Projects:

1. **Create new Supabase project**
2. **Run setup script:**
   ```sql
   -- In Supabase SQL editor
   \i supabase_setup.sql
   \i enhanced_schema.sql
   ```

### For Existing Projects:

1. **Backup your database**
2. **Run migration:**
   ```sql
   -- In Supabase SQL editor
   \i migration_v2.sql
   ```

## 📋 Migration Checklist

### ✅ Before Migration:
- [ ] **Backup database**
- [ ] **Test migration** on staging environment
- [ ] **Verify user permissions**
- [ ] **Check existing data integrity**

### ✅ After Migration:
- [ ] **Verify new columns** exist
- [ ] **Test RLS policies**
- [ ] **Validate constraints**
- [ ] **Test feedback submission**
- [ ] **Check image upload**

## 🔧 API Integration

### **Anonymous Feedback Endpoint:**
```javascript
POST /api/v1/feedback/anonymous
Content-Type: multipart/form-data

{
  authorName: "John Doe",
  authorEmail: "john@example.com", // optional
  content: "Feedback content...",
  rating: 5, // optional 1-5
  avatar: [file], // optional
  images: [file1, file2] // optional
}
```

### **Database Queries:**

#### Create Anonymous Feedback:
```javascript
const feedbackData = {
    author_name: 'John Doe',
    author_email: 'john@example.com',
    content: 'Great service!',
    rating: 5,
    author_avatar_url: 'https://cloudinary.com/avatar.jpg',
    images: JSON.stringify(['image1.jpg', 'image2.jpg']),
    is_anonymous: true,
    is_approved: false,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...'
};

const { data, error } = await supabase
    .from('feedbacks')
    .insert([feedbackData])
    .select()
    .single();
```

#### Get Approved Feedbacks:
```javascript
const { data, error } = await supabase
    .from('approved_feedbacks')
    .select('*')
    .order('created_at', { ascending: false });
```

## 🎯 Performance Optimizations

### **Indexes Created:**
- `idx_feedbacks_rating` - For rating-based queries
- `idx_feedbacks_is_anonymous` - For filtering anonymous/authenticated
- `idx_feedbacks_ip_address` - For rate limiting queries
- `idx_feedbacks_approved_at` - For approved feedback ordering

### **Query Optimization Tips:**
1. **Use views** for common queries
2. **Leverage indexes** for filtering
3. **Pagination** for large result sets
4. **Cache** frequently accessed data

## 🛠️ Troubleshooting

### **Common Issues:**

#### Migration Fails:
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'feedbacks';

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'feedbacks'::regclass;
```

#### RLS Issues:
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'feedbacks';
```

#### Permission Issues:
```sql
-- Grant necessary permissions
GRANT SELECT, INSERT ON feedbacks TO anon;
GRANT ALL ON feedbacks TO authenticated;
```

## 📈 Monitoring & Analytics

### **Track Feedback Metrics:**
```sql
-- Feedback submission rate
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE is_anonymous = true) as anonymous_count,
    AVG(rating) as avg_rating
FROM feedbacks 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;
```

### **Rate Limiting Analytics:**
```sql
-- Top IPs by feedback count
SELECT 
    ip_address,
    COUNT(*) as feedback_count,
    MIN(created_at) as first_feedback,
    MAX(created_at) as last_feedback
FROM feedbacks 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY feedback_count DESC;
```

## 🔒 Security Considerations

1. **IP-based rate limiting** (3 requests per 15 minutes)
2. **Daily limits** (5 feedback per IP per day)
3. **Content sanitization** on application level
4. **File upload validation** (size, type, malware scanning)
5. **Spam detection** (duplicate content, rapid submissions)

## 📞 Support

For issues or questions:
1. **Check logs** in Supabase dashboard
2. **Review RLS policies** for permission issues
3. **Verify constraints** for data integrity
4. **Test locally** before production deployment
