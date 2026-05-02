"""
normalize-moons.py
------------------
Normalizes a set of moon phase images by:
  1. Auto-detecting and centering the moon in the frame
  2. Cropping to a consistent square
  3. Resizing to a target resolution
  4. (Optional) White-balance normalization to a neutral gray tone

Requirements:
    pip install Pillow numpy scipy

Usage:
    python normalize-moons.py
    python normalize-moons.py --input ./my_moons --output ./out --size 512
    python normalize-moons.py --no-whitebalance
"""

import argparse
import os
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter
from scipy import ndimage


# ── Config ────────────────────────────────────────────────────────────────────

DEFAULT_INPUT_DIR  = "."          # folder containing moon*.jpg
DEFAULT_OUTPUT_DIR = "normalized" # where processed images are saved
DEFAULT_SIZE       = 512          # output image size in pixels (square)
PADDING_FACTOR     = 0.15         # extra breathing room around the moon (0–0.5)
EXTENSIONS         = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


# ── Core functions ────────────────────────────────────────────────────────────

def find_moon_bbox(img_array: np.ndarray, threshold: int = 25):
    """
    Detects the moon by thresholding on brightness.
    Returns (top, left, bottom, right) bounding box of the lit region.
    Raises ValueError if nothing bright enough is found.
    """
    # Convert to grayscale luminance
    if img_array.ndim == 3:
        gray = 0.299 * img_array[:, :, 0] + \
               0.587 * img_array[:, :, 1] + \
               0.114 * img_array[:, :, 2]
    else:
        gray = img_array.astype(float)

    # Binary mask of bright pixels
    mask = gray > threshold

    # Remove isolated noise with morphological closing
    mask = ndimage.binary_closing(mask, structure=np.ones((5, 5)))
    mask = ndimage.binary_fill_holes(mask)

    # Label connected components; keep the largest
    labeled, num_features = ndimage.label(mask)
    if num_features == 0:
        raise ValueError("No bright region found — try lowering --threshold")

    sizes = ndimage.sum(mask, labeled, range(1, num_features + 1))
    largest_label = np.argmax(sizes) + 1
    moon_mask = labeled == largest_label

    rows = np.any(moon_mask, axis=1)
    cols = np.any(moon_mask, axis=0)
    top,    bottom = np.where(rows)[0][[0, -1]]
    left,   right  = np.where(cols)[0][[0, -1]]

    return int(top), int(left), int(bottom), int(right)


def center_and_crop(img: Image.Image, bbox, output_size: int, padding: float):
    """
    Given a bounding box around the moon, pads it into a square,
    adds breathing room, then resizes to output_size × output_size.
    """
    top, left, bottom, right = bbox
    cx = (left + right)  / 2
    cy = (top  + bottom) / 2

    # Half-size of the moon's largest dimension + padding
    half = max(right - left, bottom - top) / 2
    half = half * (1 + padding)

    # Square crop coordinates (clamped to image bounds)
    iw, ih = img.size
    crop_left   = max(0, int(cx - half))
    crop_top    = max(0, int(cy - half))
    crop_right  = min(iw, int(cx + half))
    crop_bottom = min(ih, int(cy + half))

    cropped = img.crop((crop_left, crop_top, crop_right, crop_bottom))

    # If crop hit an edge, pad with black to keep it square
    cw, ch = cropped.size
    if cw != ch:
        side = max(cw, ch)
        padded = Image.new("RGB", (side, side), (0, 0, 0))
        padded.paste(cropped, ((side - cw) // 2, (side - ch) // 2))
        cropped = padded

    return cropped.resize((output_size, output_size), Image.LANCZOS)


def normalize_whitebalance(img: Image.Image) -> Image.Image:
    """
    Shifts the moon's color toward neutral gray using the gray-world assumption
    applied only to the bright (moon) pixels, so the black background is ignored.
    """
    arr = np.array(img).astype(float)
    gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    moon_pixels = gray > 30  # only consider lit pixels

    if moon_pixels.sum() == 0:
        return img

    means = [arr[:, :, c][moon_pixels].mean() for c in range(3)]
    overall_mean = np.mean(means)

    for c in range(3):
        if means[c] > 0:
            arr[:, :, c] = np.clip(arr[:, :, c] * (overall_mean / means[c]), 0, 255)

    return Image.fromarray(arr.astype(np.uint8))


def process_image(input_path: Path, output_path: Path,
                  output_size: int, padding: float,
                  whitebalance: bool, threshold: int):
    img = Image.open(input_path).convert("RGB")
    arr = np.array(img)

    try:
        bbox = find_moon_bbox(arr, threshold=threshold)
    except ValueError as e:
        print(f"  ⚠️  Skipped {input_path.name}: {e}")
        return False

    result = center_and_crop(img, bbox, output_size, padding)

    if whitebalance:
        result = normalize_whitebalance(result)

    result.save(output_path, quality=95)
    return True


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Normalize moon phase images.")
    parser.add_argument("--input",          default=DEFAULT_INPUT_DIR,
                        help="Input folder containing moon images")
    parser.add_argument("--output",         default=DEFAULT_OUTPUT_DIR,
                        help="Output folder for normalized images")
    parser.add_argument("--size",           type=int, default=DEFAULT_SIZE,
                        help="Output image size in pixels (square, default 512)")
    parser.add_argument("--padding",        type=float, default=PADDING_FACTOR,
                        help="Padding around moon as fraction of its size (default 0.15)")
    parser.add_argument("--threshold",      type=int, default=25,
                        help="Brightness threshold to detect moon (0–255, default 25)")
    parser.add_argument("--no-whitebalance", dest="whitebalance",
                        action="store_false", default=True,
                        help="Skip white-balance normalization")
    args = parser.parse_args()

    input_dir  = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(
        p for p in input_dir.iterdir()
        if p.suffix.lower() in EXTENSIONS
    )

    if not files:
        print(f"No image files found in '{input_dir}'")
        return

    print(f"Processing {len(files)} image(s) → '{output_dir}' @ {args.size}px\n")
    ok = 0
    for path in files:
        out_path = output_dir / path.name
        print(f"  {path.name} … ", end="", flush=True)
        success = process_image(
            path, out_path,
            output_size=args.size,
            padding=args.padding,
            whitebalance=args.whitebalance,
            threshold=args.threshold,
        )
        if success:
            print("✓")
            ok += 1

    print(f"\nDone — {ok}/{len(files)} images normalized → '{output_dir}/'")


if __name__ == "__main__":
    main()
