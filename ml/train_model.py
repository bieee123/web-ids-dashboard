# ===============================
# NSL-KDD - IDS Model Training
# ===============================

import pandas as pd


# ===============================
# 1. DEFINE COLUMN NAMES
# ===============================
column_names = [
    "duration","protocol_type","service","flag","src_bytes","dst_bytes",
    "land","wrong_fragment","urgent","hot","num_failed_logins",
    "logged_in","num_compromised","root_shell","su_attempted","num_root",
    "num_file_creations","num_shells","num_access_files","num_outbound_cmds",
    "is_host_login","is_guest_login","count","srv_count","serror_rate",
    "srv_serror_rate","rerror_rate","srv_rerror_rate","same_srv_rate",
    "diff_srv_rate","srv_diff_host_rate","dst_host_count","dst_host_srv_count",
    "dst_host_same_srv_rate","dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate","dst_host_srv_diff_host_rate",
    "dst_host_serror_rate","dst_host_srv_serror_rate",
    "dst_host_rerror_rate","dst_host_srv_rerror_rate",
    "label","difficulty"
]


# ===============================
# 2. LOAD DATASET
# ===============================
train_data = pd.read_csv("dataset/train.csv", names=column_names)
test_data = pd.read_csv("dataset/test.csv", names=column_names)


# ===============================
# 3. DROP UNUSED COLUMN
# ===============================
train_data.drop("difficulty", axis=1, inplace=True)
test_data.drop("difficulty", axis=1, inplace=True)


# ===============================
# 4. BASIC INFO CHECK
# ===============================
print("Train shape:", train_data.shape)
print("Test shape:", test_data.shape)

print("\nFirst 5 rows:")
print(train_data.head())

print("\nColumns:")
print(train_data.columns)


# ===============================
# 5. SPLIT FEATURES & LABEL
# ===============================
X_train = train_data.drop("label", axis=1)
y_train = train_data["label"]

X_test = test_data.drop("label", axis=1)
y_test = test_data["label"]

print("\nFeatures shape:", X_train.shape)
print("Label shape:", y_train.shape)


# ===============================
# 6. ONE HOT ENCODING
# ===============================

X_train = pd.get_dummies(X_train)
X_test = pd.get_dummies(X_test)

# Align test with train (important!)
X_test = X_test.reindex(columns=X_train.columns, fill_value=0)

print("\nAfter Encoding:")
print("X_train shape:", X_train.shape)
print("X_test shape:", X_test.shape)


# ===============================
# 7. CONVERT LABEL TO BINARY
# ===============================

y_train = y_train.apply(lambda x: 0 if x == "normal" else 1)
y_test = y_test.apply(lambda x: 0 if x == "normal" else 1)

print("\nLabel distribution (Train):")
print(y_train.value_counts())


# ===============================
# 8. TRAIN RANDOM FOREST MODEL
# ===============================

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

print("\nTraining model...")
model.fit(X_train, y_train)

print("Training completed.")


# ===============================
# 9. EVALUATE MODEL
# ===============================

y_pred = model.predict(X_test)

print("\n===============================")
print("MODEL EVALUATION")
print("===============================")

print("\nAccuracy:", accuracy_score(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))


# ===============================
# 11. SAVE MODEL
# ===============================

import joblib
import os

print("\nSaving model...")

# Buat folder jika belum ada
os.makedirs("model", exist_ok=True)

joblib.dump(model, "model/ids_model.pkl")

print("Model saved successfully at model/ids_model.pkl")

