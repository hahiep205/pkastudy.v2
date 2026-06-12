# ĐỒ ÁN CƠ SỞ - NHÓM 6

## Đề tài: Xây dựng website học từ vựng kết hợp ôn luyện TOEIC bằng React.js và MySQL

## Thành viên nhóm

| Họ và tên         | MSSV     |
| ----------------- | -------- |
| Hà Văn Hiệp       | 23010104 |
| Tạ Thu Hương Linh | 23010686 |
| Vương Huy Huy     | 23010714 |

---

## Công nghệ sử dụng

### Frontend

* React.js
* Vite

### Backend

* Express.js
* Node.js

### Database

* MySQL 8+

---

## Yêu cầu hệ thống

* Node.js 18 trở lên
* npm
* MySQL 8+

---

## Cài đặt dự án

### 1. Clone repository

```bash
git clone <repository-url>
cd pkastudy
```

### 2. Cài đặt dependencies

#### Frontend

```bash
npm install
```

#### Backend

```bash
cd server
npm install
```

---

## Cấu hình môi trường

### Frontend (`.env`)

Tạo file `.env` trong thư mục gốc:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### Backend (`server/.env`)

Tạo file `.env` trong thư mục `server`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=pkastudy
```

> Nếu MySQL có mật khẩu, hãy cập nhật giá trị `DB_PASS` cho phù hợp.

---

## Tạo Database

### Tạo database

```sql
CREATE DATABASE pkastudy;
```

### Import schema

```bash
mysql -u root pkastudy < server/sql/create-tables.sql
```

Hoặc sử dụng phpMyAdmin để import file:

```text
server/sql/create-tables.sql
```

---

## Seed dữ liệu mẫu

Di chuyển vào thư mục backend:

```bash
cd server
npm run seed:external-data
```

### Tài khoản mặc định

| Loại tài khoản | Username | Password |
| -------------- | -------- | -------- |
| Admin          | admin    | admin    |
| User           | user     | user     |

Tài khoản `user/user` đã có dữ liệu mẫu để kiểm thử:

* Học từ vựng
* Flashcard
* Quiz
* Listening
* Typing
* Match
* Flappy Bird
* TOEIC Practice
* Hệ thống SRS

---

## Chạy dự án

### Chạy Backend

```bash
cd server
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:4000
```

### Chạy Frontend

```bash
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

---

## Quy trình khởi động đầy đủ

1. Khởi động MySQL.
2. Tạo database `pkastudy`.
3. Import file `server/sql/create-tables.sql`.
4. Chạy `npm install` trong thư mục gốc.
5. Chạy `npm install` trong thư mục `server`.
6. Chạy:

```bash
npm run seed:external-data
```

7. Khởi động backend:

```bash
cd server
npm run dev
```

8. Khởi động frontend:

```bash
npm run dev
```

---

## Cấu trúc thư mục

```text
pkastudy/
│
├── src/                    # Frontend React
├── public/
├── server/
│   ├── sql/
│   │   └── create-tables.sql
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

## Lưu ý

* Nếu sử dụng XAMPP với tài khoản `root` không có mật khẩu, hãy để:

```env
DB_PASS=
```

* Nếu frontend không kết nối được backend, hãy kiểm tra:

```env
VITE_API_BASE_URL
```

* Đảm bảo MySQL đang hoạt động trước khi chạy backend.

* Không sử dụng:

```bash
npm run db:init
```

vì script này không tồn tại trong dự án.

---

