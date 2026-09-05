"""Quick test for the RGB-to-spectral convert and classify endpoints using urllib (no external dependencies)."""
import urllib.request
import json
import sys
import os
import mimetypes

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://localhost:8000"
IMAGE_PATH = r"C:\Users\blue0\OneDrive\Pictures\HSI_LWIR_stones.png"


def upload_multipart(url, file_path, field_name="file"):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    filename = os.path.basename(file_path)
    mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'
        f"Content-Type: {mime_type}\r\n\r\n"
    ).encode("latin-1") + file_bytes + f"\r\n--{boundary}--\r\n".encode("latin-1")

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def test_convert():
    print("=" * 60)
    print("TEST 1: POST /classify/convert  (RGB -> Spectral Profile)")
    print("=" * 60)
    status, data = upload_multipart(f"{BASE}/classify/convert", IMAGE_PATH)

    print(f"  HTTP Status: {status}")
    print(f"  Success: {data.get('success')}")
    print(f"  Cube shape: {data.get('cube_shape')}")
    print(f"  Conversion method: {data.get('conversion', {}).get('method')}")
    print(f"  Wavelength range: {data.get('conversion', {}).get('wavelength_range_nm')} nm")
    print(f"  Bands count: {data.get('conversion', {}).get('n_bands')}")
    print(f"  Sample profiles count: {len(data.get('sample_profiles', []))}")

    avg = data.get("average_spectrum", {}).get("reflectance", [])
    print(f"  Avg spectrum (first 5 values): {[round(v, 4) for v in avg[:5]]}")
    print(f"  Avg spectrum (last 5 values):  {[round(v, 4) for v in avg[-5:]]}")

    for i, p in enumerate(data.get("sample_profiles", [])[:3]):
        r_vals = p.get("reflectance", [])
        print(f"  Profile {i} at pixel {p.get('pixel')}: peak={round(max(r_vals), 4)}, bands={p.get('n_bands')}")

    print("  PASSED\n")
    return True


def test_classify_image():
    print("=" * 60)
    print("TEST 2: POST /classify/upload  (RGB image -> Classification)")
    print("=" * 60)
    status, data = upload_multipart(f"{BASE}/classify/upload", IMAGE_PATH)

    print(f"  HTTP Status: {status}")
    print(f"  Success: {data.get('success')}")
    print(f"  Converted from RGB: {data.get('converted_from_rgb')}")
    print(f"  Dimensions: {data.get('dimensions')}")

    if data.get("note"):
        print(f"  Note: {data['note'][:80]}...")

    print(f"  Species distribution:")
    for species, info in sorted(data.get("distribution", {}).items(), key=lambda x: -x[1]["percentage"]):
        bar = "#" * int(info["percentage"] / 4)
        print(f"    {species:20s} {info['percentage']:6.2f}%  {bar}")

    print("  PASSED\n")
    return True


if __name__ == "__main__":
    ok1 = test_convert()
    ok2 = test_classify_image()

    print("=" * 60)
    if ok1 and ok2:
        print("ALL TESTS PASSED")
    else:
        print("TESTS FAILED")
        sys.exit(1)
