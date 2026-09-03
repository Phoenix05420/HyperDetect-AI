import numpy as np
import os

def generate():
    os.makedirs("../uploads", exist_ok=True)
    cube = np.random.randn(128, 128, 50)
    # Add anomalies
    cube[10:15, 10:15, :] += 5
    cube[100:105, 50:55, :] += 5
    np.save("../uploads/demo_cube.npy", cube)
    print("Demo data generated.")

if __name__ == '__main__':
    generate()
