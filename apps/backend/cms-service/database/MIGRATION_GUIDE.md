# 🚀 HƯỚNG DẪN CHẠY MIGRATION SUPABASE

## 📋 Các bước thực hiện:

### Bước 1: Mở Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project: `smhucdcmnjugharzyelp`
3. Đi đến **SQL Editor** (biểu tượng </> ở sidebar)

### Bước 2: Chạy Migration (3 phần)

#### 🔧 **Part 1 - Thêm columns mới**
1. Tạo **New Query** trong SQL Editor
2. Copy nội dung từ file `manual_migration_part1.sql`
3. Paste vào SQL Editor
4. Click **Run** (hoặc Ctrl+Enter)
5. Kiểm tra kết quả: **Success. No rows returned**

#### 🔧 **Part 2 - Tạo tables và indexes**
1. Tạo **New Query** khác
2. Copy nội dung từ file `manual_migration_part2.sql`
3. Paste vào SQL Editor
4. Click **Run**
5. Kiểm tra kết quả thành công

#### 🔧 **Part 3 - Functions và RLS policies**
1. Tạo **New Query** thứ ba
2. Copy nội dung từ file `manual_migration_part3.sql`
3. Paste vào SQL Editor
4. Click **Run**
5. Xem thông báo: `SUCCESS: All new columns added to feedbacks table`

### Bước 3: Kiểm tra kết quả

#### ✅ **Kiểm tra cấu trúc bảng:**
```sql
-- Chạy query này để kiểm tra columns mới
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'feedbacks' 
ORDER BY ordinal_position;
```

#### ✅ **Kiểm tra bảng mới:**
```sql
-- Kiểm tra bảng media
SELECT COUNT(*) FROM media;

-- Kiểm tra bảng analytics  
SELECT COUNT(*) FROM analytics;
```

#### ✅ **Kiểm tra functions:**
```sql
-- Test function rate limiting
SELECT get_feedback_count_by_ip('192.168.1.1'::inet, 24);
```

### Bước 4: Test API

#### 🧪 **Test Anonymous Feedback:**
```bash
curl -X POST https://smhucdcmnjugharzyelp.supabase.co/rest/v1/feedbacks \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "author_name": "Test User",
    "content": "This is a test feedback with sufficient length",
    "is_anonymous": true,
    "is_approved": false
  }'
```

## 🎯 Kết quả mong đợi:

### ✅ **Columns mới trong bảng feedbacks:**
- `author_name` VARCHAR(100)
- `author_email` VARCHAR(254) 
- `author_avatar_url` TEXT
- `rating` INTEGER (1-5)
- `images` JSON
- `is_anonymous` BOOLEAN
- `ip_address` INET
- `user_agent` TEXT
- `approved_at` TIMESTAMP
- `approved_by` UUID

### ✅ **Bảng mới:**
- `media` - Quản lý file uploads
- `analytics` - Tracking events

### ✅ **Functions mới:**
- `get_feedback_count_by_ip()` - Rate limiting
- `check_duplicate_feedback_by_ip()` - Spam protection

### ✅ **Views mới:**
- `approved_feedbacks` - Public feedback view

### ✅ **RLS Policies:**
- Anonymous users có thể insert feedback
- Public có thể đọc approved feedback
- Users có thể xem feedback của mình

## 🚨 Troubleshooting:

### **Lỗi "relation does not exist":**
- Có thể bảng `feedbacks` chưa tồn tại
- Chạy schema tạo bảng trước

### **Lỗi "permission denied":**
- Kiểm tra quyền admin trong Supabase
- Sử dụng Service Key thay vì Anon Key

### **Lỗi constraint violation:**
- Kiểm tra data hiện tại trong bảng
- Update data trước khi add constraint

## 📞 Support:

Nếu gặp lỗi, check:
1. **Supabase Logs** trong Dashboard
2. **Table Editor** để xem structure
3. **SQL Editor History** để xem queries đã chạy
