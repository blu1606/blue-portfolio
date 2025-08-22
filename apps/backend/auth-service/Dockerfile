# Giai đoạn 1: Build ứng dụng
FROM node:lts-alpine AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

COPY package*.json ./
# Cập nhật npm lên bản mới nhất để giảm lỗ hổng
RUN npm install -g npm@latest \
	&& npm install --omit=dev \
	&& npm cache clean --force

COPY . .

# Giai đoạn 2: Tạo image production
FROM node:lts-alpine

# Thiết lập thư mục làm việc
WORKDIR /app


# Chỉ copy những file cần thiết từ giai đoạn builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js

# Expose cổng mà ứng dụng lắng nghe
EXPOSE 3000


# Tạo user không phải root để chạy app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Khởi động ứng dụng
CMD ["node", "server.js"]