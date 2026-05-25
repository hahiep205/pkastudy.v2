# pkastudy

Project học từ vựng và luyện TOEIC.

- Frontend: React + Vite
- Backend: Express
- Database: MySQL / MariaDB

## Yêu cầu

- Node.js 18+
- npm
- MySQL hoặc MariaDB

## 1. Cài dependencies

Frontend:

```powershell
cd C:\path\to\pkastudy
npm install
```

Backend:

```powershell
cd C:\path\to\pkastudy\server
npm install
```

## 2. Cấu hình môi trường

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Backend `server/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=pkastudy
```

Nếu MySQL có mật khẩu thì sửa `DB_PASS` cho đúng.

## 3. Tạo database và import schema

Tạo database `pkastudy`, sau đó import file:

- [server/sql/create-tables.sql](C:/Users/hahie/OneDrive/Desktop/pkastudy/pkastudy/server/sql/create-tables.sql)

Ví dụ với MySQL CLI:

```powershell
mysql -u root pkastudy < C:\path\to\pkastudy\server\sql\create-tables.sql
```

Nếu dùng XAMPP, có thể import file này bằng `phpMyAdmin`.

## 4. Seed dữ liệu

Chạy trong thư mục `server`:

```powershell
cd C:\path\to\pkastudy\server
node scripts/seed-external-data.js
```

Hoặc:

```powershell
npm run seed:external-data
```

## 5. Chạy backend

```powershell
cd C:\path\to\pkastudy\server
npm run dev
```

Backend chạy tại:

- `http://localhost:4000`

## 6. Chạy frontend

```powershell
cd C:\path\to\pkastudy
npm run dev
```

Frontend chạy tại:

- `http://localhost:5173`

## 7. Thứ tự chạy đầy đủ

1. Start MySQL
2. Tạo database `pkastudy`
3. Import `server/sql/create-tables.sql`
4. Chạy `node scripts/seed-external-data.js`
5. Chạy backend: `npm run dev`
6. Chạy frontend: `npm run dev`

## Lưu ý

- Không dùng `npm run db:init` vì `server/scripts/init-db.js` hiện không tồn tại.
- Nếu dùng XAMPP và `root` không có mật khẩu, để `DB_PASS=` trống.
- Nếu frontend không gọi được backend, kiểm tra lại `VITE_API_BASE_URL`.
