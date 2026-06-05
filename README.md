# Nihongo Study App

Static web app hiển thị dữ liệu từ `data/database/quizlet_db.json` mà không cần backend.

## Tính năng
- Chọn nhóm từ header
- Hiển thị danh sách bài học theo số lượng từ, từ nhỏ đến lớn
- Xem chi tiết Kanji và định nghĩa từng bài học
- Học flashcard offline với lật thẻ và đánh dấu trạng thái
- Làm bài quiz 4 lựa chọn lấy từ cùng nhóm
- Lưu trữ cục bộ kết quả quiz và tiến trình học
- Offline-ready với Service Worker và IndexedDB / localStorage

## Triển khai
- Upload toàn bộ thư mục `staticweb` lên GitHub Pages hoặc hosting tĩnh
- Mở `index.html` trong trình duyệt hoặc sử dụng `python -m http.server` để phát triển

## Chạy thử
1. Mở terminal
2. `cd copy_quizlet/staticweb`
3. `python -m http.server 8085`
4. Truy cập `http://127.0.0.1:8085`
