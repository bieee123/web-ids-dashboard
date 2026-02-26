---

# 📌 PROJECT OVERVIEW

## Web IDS (Intrusion Detection System) Dashboard

---

# 1️⃣ KONSEP PROJECT

Project ini adalah:

> Web-based Intrusion Detection System (IDS)
> Menggunakan Machine Learning untuk mendeteksi apakah traffic network adalah NORMAL atau ATTACK.

Sistem terdiri dari:

* Frontend (React + Vite + TypeScript)
* Backend (FastAPI)
* Machine Learning Model (scikit-learn)
* Database (SQLAlchemy + SQLite/PostgreSQL)

---

# 2️⃣ TUJUAN SISTEM

User dapat:

1. Input parameter network traffic
2. Klik "Test Detect"
3. Backend memproses data menggunakan ML model
4. Sistem mengembalikan:

   * prediction (0/1)
   * result (NORMAL / ATTACK)
   * attack_type
   * confidence
5. Data disimpan ke database (detection_log)

---

# 3️⃣ ARSITEKTUR SISTEM

## 🖥 FRONTEND (Port 5173)

* Framework: React + Vite
* File penting:

  * `DetectForm.tsx`
  * `idsService.ts`

Flow:

User → Form → axios POST → [http://127.0.0.1:8000/detect](http://127.0.0.1:8000/detect)

---

## ⚙ BACKEND (Port 8000)

Framework: FastAPI

File penting:

* `main.py`
* `routes/detect.py`
* `schemas/ids_schema.py`
* `models/detection_log.py`
* `database/db.py`

---

# 4️⃣ FLOW REQUEST

### STEP 1 – Frontend kirim request

```
POST http://127.0.0.1:8000/detect
Content-Type: application/json
```

Body JSON harus mengikuti schema `IDSInput`.

---

### STEP 2 – FastAPI menerima request

```python
@router.post("/detect")
def detect(data: IDSInput):
```

FastAPI otomatis:

* Validasi JSON sesuai Pydantic model
* Jika tidak sesuai → 422

---

### STEP 3 – Data diproses

Flow di backend:

1. Convert input ke dict
2. Convert ke pandas DataFrame
3. One-hot encoding
4. Align kolom dengan `model.feature_names_in_`
5. `model.predict()`
6. `model.predict_proba()`
7. Save ke database
8. Return response JSON

---

# 5️⃣ MACHINE LEARNING FLOW

Model:

* Sudah dilatih sebelumnya
* Memiliki:

  * `model.feature_names_in_`
  * `model.classes_`
  * `predict()`
  * `predict_proba()`

Preprocessing:

```python
df = pd.get_dummies(df)
df = df.reindex(columns=model_features, fill_value=0)
```

Ini untuk memastikan fitur sesuai dengan saat training.

---

# 6️⃣ DATABASE FLOW

Menggunakan SQLAlchemy.

Setiap prediksi akan disimpan:

```python
log_entry = DetectionLog(
    duration=data.duration,
    protocol=data.protocol_type,
    service=data.service,
    flag=data.flag,
    result=result,
    attack_type=attack_type,
    confidence=confidence
)
```

---

# 7️⃣ MASALAH YANG TERJADI

### ERROR:

```
422 Unprocessable Entity
```

Artinya:

FastAPI menolak request sebelum masuk ke logic karena JSON tidak sesuai dengan schema `IDSInput`.

Kemungkinan penyebab:

* Frontend tidak mengirim semua field
* Nama field tidak sama
* Tipe data tidak sesuai
* Content-Type salah

---

# 8️⃣ SCHEMA IDSInput

Schema memiliki ±41 fitur network (dataset KDD99 style):

Contoh:

```
duration
protocol_type
service
flag
src_bytes
dst_bytes
...
dst_host_srv_rerror_rate
```

Semua sudah diberi default value supaya tidak wajib dikirim.

---

# 9️⃣ HAL YANG HARUS DIANALISIS AI

AI perlu memeriksa:

### A. Apakah frontend mengirim JSON sesuai schema?

* Apakah field name cocok?
* Apakah tipe data cocok?
* Apakah axios mengirim Content-Type application/json?

### B. Apakah model.feature_names_in_ cocok dengan schema?

Mismatch bisa menyebabkan error 400 di backend.

### C. Apakah one-hot encoding menyebabkan kolom mismatch?

---

# 🔟 DEBUG STRATEGY YANG HARUS DILAKUKAN AI

1. Cek request payload dari frontend
2. Cek Network tab di browser
3. Cek schema Pydantic
4. Test endpoint via Swagger `/docs`
5. Logging request body sebelum validation
6. Print `model.feature_names_in_`

---

# 1️⃣1️⃣ SYSTEM CONSTRAINTS

* Development environment
* CORS allow all origins
* Localhost only
* Model harus sudah load saat startup
* Database auto create on startup

---

# 1️⃣2️⃣ EXPECTED OUTPUT FORMAT

Backend harus mengembalikan:

```json
{
  "prediction": 1,
  "result": "ATTACK",
  "attack_type": "neptune",
  "confidence": 0.97
}
```

---

# 1️⃣3️⃣ POTENSIAL IMPROVEMENTS

AI bisa bantu:

* Refactor schema jadi lebih modular
* Tambah validation constraint
* Tambah error logging detail
* Improve frontend form auto-generate
* Tambah feature scaling pipeline
* Bungkus preprocessing ke sklearn Pipeline
* Tambah monitoring dashboard

---

# 1️⃣4️⃣ RINGKASAN SATU PARAGRAF (Untuk AI)

Project ini adalah web-based ML Intrusion Detection System menggunakan React frontend dan FastAPI backend. Frontend mengirim JSON berisi 41 fitur network ke endpoint `/detect`. Backend memvalidasi menggunakan Pydantic schema `IDSInput`, melakukan preprocessing (one-hot encoding + feature alignment), menjalankan model scikit-learn untuk prediksi, menyimpan hasil ke database via SQLAlchemy, dan mengembalikan hasil ke frontend. Saat ini terjadi error 422 karena mismatch antara request body frontend dan schema backend.

---
