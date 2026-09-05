import os
import zipfile
import glob
import numpy as np
import spectral
import spectral.io.envi as envi
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Allow non-lowercase ENVI header params
spectral.settings.envi_support_nonlowercase_params = True

# Paths
DATA_DIR = r"C:\Users\blue0\Downloads\14113193"
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/
EXTRACT_DIR = os.path.join(BASE_DIR, "data", "extracted_trees")
MODEL_DIR = os.path.join(BASE_DIR, "app", "models")

# All 9 tree species from the dataset
DATASETS = [
    {"zip": "AtlasCedarLeafCDY_hdr_raw.zip",               "label": "Atlas Cedar",       "class_id": 0},
    {"zip": "BurOakLeafCdy_Sny_exp_VNIR_hdr_raw.zip",      "label": "Bur Oak",           "class_id": 1},
    {"zip": "CamperDownElmLeafSny_exp_VNIR_hdr_raw.zip",   "label": "Camperdown Elm",    "class_id": 2},
    {"zip": "DawnRedwoodLeafCldy_exp_VNIR_hdr_raw.zip",     "label": "Dawn Redwood",      "class_id": 3},
    {"zip": "EuroWeepingLeafCldy_exp_VNIR_hdr_raw.zip",     "label": "Euro Weeping",      "class_id": 4},
    {"zip": "JapanesePagadaLeafCldy_exp_VNIR.hdr_raw.zip",  "label": "Japanese Pagoda",   "class_id": 5},
    {"zip": "OvercupOakLeafCdy_exp_VNIR_hdr_raw.zip",       "label": "Overcup Oak",       "class_id": 6},
    {"zip": "PassionPlantGHLarge_exp_VNIR_hdr_raw.zip",     "label": "Passion Plant",     "class_id": 7},
    {"zip": "SycamoreMaplerLeafSny_exp_VNIR_hdr_raw.zip",   "label": "Sycamore Maple",    "class_id": 8},
]


def extract_dataset(zip_name):
    """Extract the outer zip, then extract any inner .raw.zip files."""
    zip_path = os.path.join(DATA_DIR, zip_name)
    folder_name = zip_name.replace(".zip", "").replace(".", "_")
    extract_path = os.path.join(EXTRACT_DIR, folder_name)

    if not os.path.exists(zip_path):
        print(f"  WARNING: {zip_name} not found in {DATA_DIR}, skipping.")
        return None

    if not os.path.exists(extract_path):
        print(f"  Extracting outer zip: {zip_name}...")
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_path)

    # Extract any inner .raw.zip files
    inner_zips = glob.glob(os.path.join(extract_path, "**", "*.raw.zip"), recursive=True)
    for iz in inner_zips:
        raw_file = iz.replace(".zip", "")
        if not os.path.exists(raw_file):
            print(f"  Extracting inner zip: {os.path.basename(iz)}...")
            with zipfile.ZipFile(iz, "r") as zf:
                zf.extractall(os.path.dirname(iz))

    return extract_path


def load_hyperspectral_data(extract_path):
    """Find .hdr files and load the first one that has a matching .raw."""
    hdr_files = glob.glob(os.path.join(extract_path, "**", "*.hdr"), recursive=True)
    if not hdr_files:
        raise FileNotFoundError(f"No .hdr file found in {extract_path}")

    for hdr_file in hdr_files:
        raw_file = hdr_file.replace(".hdr", ".raw")
        if os.path.exists(raw_file):
            print(f"  Loading: {os.path.basename(hdr_file)}")
            img = envi.open(hdr_file, raw_file)
            data = img.load()
            return np.array(data)

    raise FileNotFoundError(
        f"No matching .hdr/.raw pair found in {extract_path}."
    )


def build_dataset(samples_per_class=5000):
    X = []
    y = []
    loaded_labels = []

    for ds in DATASETS:
        print(f"\n--- Processing: {ds['label']} ---")
        extract_path = extract_dataset(ds["zip"])
        if extract_path is None:
            continue

        try:
            cube = load_hyperspectral_data(extract_path)
            print(f"  Cube shape: {cube.shape}  (rows x cols x bands)")

            rows, cols, bands = cube.shape
            pixels = cube.reshape((rows * cols, bands)).astype(np.float32)

            # Filter out background pixels
            pixel_norms = np.linalg.norm(pixels, axis=1)
            valid_mask = pixel_norms > 1e-3
            valid_pixels = pixels[valid_mask]

            print(f"  Valid foreground pixels: {valid_pixels.shape[0]}")

            if valid_pixels.shape[0] < 100:
                print(f"  Too few pixels, skipping.")
                continue

            # Sample a subset for balanced training
            if valid_pixels.shape[0] > samples_per_class:
                indices = np.random.choice(
                    valid_pixels.shape[0], samples_per_class, replace=False
                )
                sampled = valid_pixels[indices]
            else:
                sampled = valid_pixels

            X.append(sampled)
            y.extend([ds["class_id"]] * sampled.shape[0])
            loaded_labels.append(ds)

        except Exception as e:
            print(f"  ERROR: {e}")

    if not X:
        raise ValueError("No data could be loaded from any dataset!")

    X = np.vstack(X)
    y = np.array(y)
    return X, y, loaded_labels


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)
    print("=" * 60)
    print("HyperDetect AI — Multi-Species Tree Classifier Training")
    print("=" * 60)

    X, y, loaded_labels = build_dataset()

    # Build label map from actually loaded classes
    label_map = {ds["class_id"]: ds["label"] for ds in loaded_labels}

    print(f"\n--- Dataset Summary ---")
    print(f"  Total pixels: {X.shape[0]}")
    print(f"  Spectral bands: {X.shape[1]}")
    print(f"  Classes loaded: {len(label_map)}")
    unique, counts = np.unique(y, return_counts=True)
    for u, c in zip(unique, counts):
        print(f"  Class {u} ({label_map.get(u, '?')}): {c} samples")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n--- Training Random Forest (200 trees) ---")
    clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    print(f"\n--- Evaluation ---")
    preds = clf.predict(X_test)
    target_names = [label_map[u] for u in sorted(label_map.keys()) if u in unique]
    print(classification_report(y_test, preds, target_names=target_names))

    accuracy = np.mean(preds == y_test)

    # Save model + metadata
    model_path = os.path.join(MODEL_DIR, "tree_species_rf.joblib")
    joblib.dump(
        {
            "model": clf,
            "label_map": label_map,
            "n_bands": X.shape[1],
            "n_classes": len(label_map),
            "accuracy": float(accuracy),
        },
        model_path,
    )
    print(f"\nModel saved to: {model_path}")
    print(f"Overall accuracy: {accuracy:.2%}")
    print("=" * 60)
    print("Done!")


if __name__ == "__main__":
    train()
