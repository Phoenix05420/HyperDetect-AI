import numpy as np
import cv2
import matplotlib.pyplot as plt
import io
import base64

def cube_to_rgb_preview(cube: np.ndarray, wavelengths: np.ndarray = None) -> np.ndarray:
    """
    Generate an RGB visualization matrix (H, W, 3) uint8 from a hyperspectral cube.
    Selects Red (~650nm), Green (~550nm), Blue (~470nm) bands or evenly spaced bands.
    """
    H, W, B = cube.shape
    if B == 3:
        rgb = cube.copy()
    elif wavelengths is not None and len(wavelengths) == B:
        r_idx = np.argmin(np.abs(wavelengths - 650.0))
        g_idx = np.argmin(np.abs(wavelengths - 550.0))
        b_idx = np.argmin(np.abs(wavelengths - 470.0))
        rgb = cube[:, :, [r_idx, g_idx, b_idx]]
    else:
        r_idx = int(B * 0.7)
        g_idx = int(B * 0.5)
        b_idx = int(B * 0.2)
        rgb = cube[:, :, [r_idx, g_idx, b_idx]]

    # Percentile stretch [2%, 98%] for high visual dynamic range
    p2, p98 = np.percentile(rgb, (2, 98))
    if p98 > p2:
        rgb = np.clip((rgb - p2) / (p98 - p2), 0, 1)
    else:
        rgb = np.clip(rgb, 0, 1)

    return (rgb * 255).astype(np.uint8)


def heatmap_to_png_base64(score_map: np.ndarray, cmap_name: str = 'jet') -> str:
    """
    Convert an anomaly score map (H, W) float into a base64 encoded PNG data URI.
    """
    norm = np.clip(score_map, 0, 1)
    cmap = plt.get_cmap(cmap_name)
    colored = (cmap(norm)[:, :, :3] * 255).astype(np.uint8)
    
    # Encode to PNG
    is_success, buffer = cv2.imencode(".png", cv2.cvtColor(colored, cv2.COLOR_RGB2BGR))
    if not is_success:
        return ""
    
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"