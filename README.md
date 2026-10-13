# SpamLens LSTM Spam Checker

Ứng dụng web phân loại tin nhắn SMS thành `SPAM` hoặc `NORMAL` bằng mô hình LSTM đã huấn luyện trên SMS Spam Collection Dataset.

## Chức năng

- Dự đoán nhãn Spam hoặc Normal.
- Hiển thị xác suất của hai lớp.
- Cho phép thay đổi ngưỡng quyết định.
- Hiển thị mức rủi ro, thời gian xử lý và thống kê văn bản.
- Hiển thị Accuracy, Precision, Recall, F1-score và ROC-AUC.
- Hiển thị phân bố dataset và kiến trúc các layer của model.

## Kết quả trên tập test

| Độ đo | Kết quả |
|---|---:|
| Accuracy | 97.42% |
| Precision | 85.45% |
| Recall | 95.92% |
| F1-score | 90.38% |
| ROC-AUC | 98.42% |

## Yêu cầu

- Windows 10 hoặc Windows 11.
- Python 3.11 được khuyến nghị.
- Kết nối Internet trong lần cài thư viện đầu tiên.
- Khoảng 2 GB dung lượng trống cho TensorFlow và môi trường Python.

Không cần GPU để chạy web. Model suy luận bình thường bằng CPU.

## Cách chạy nhanh trên Windows

### Bước 1 Clone repository

Mở Command Prompt hoặc PowerShell:

```powershell
git clone https://github.com/Monika22nd/Spam-checker.git
cd Spam-checker
```

Nếu không dùng Git, chọn `Code` trên GitHub, tải file ZIP rồi giải nén.

### Bước 2 Cài môi trường

Nhấp đúp `setup_windows.bat`, hoặc chạy:

```cmd
setup_windows.bat
```

Script sẽ tạo thư mục `.venv` và cài các thư viện trong `requirements.txt`.

### Bước 3 Chạy web

Nhấp đúp `run_web.bat`, hoặc chạy:

```cmd
run_web.bat
```

Sau vài giây, trình duyệt tự mở:

```text
http://127.0.0.1:8000
```

Giữ cửa sổ terminal mở trong khi demo. Nhấn `Ctrl + C` để dừng server.

## Chạy thủ công bằng Command Prompt

```cmd
cd đường-dẫn-đến\Spam-checker
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## Chạy thủ công bằng PowerShell

```powershell
cd đường-dẫn-đến\Spam-checker
$env:PYTHONUTF8="1"
$env:PYTHONIOENCODING="utf-8"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## API

- Giao diện web: `GET /`
- Kiểm tra server: `GET /api/health`
- Thông tin model và dataset: `GET /api/dashboard`
- Dự đoán: `POST /api/predict`
- Tài liệu API tự động: `GET /docs`

Ví dụ request:

```json
{
  "message": "Congratulations! You won a free prize. Click now.",
  "threshold": 0.5
}
```

## Cấu trúc dự án

```text
Spam-checker/
├── main.py
├── requirements.txt
├── setup_windows.bat
├── run_web.bat
├── artifacts/
│   ├── spam_lstm.keras
│   ├── spam_cleaned.csv
│   └── test_metrics.json
└── static/
    ├── index.html
    ├── styles.css
    └── app.js
```

`PYTHONUTF8=1` cần được đặt trước khi khởi động Python trên Windows để TensorFlow đọc đúng vocabulary Unicode bên trong model.
