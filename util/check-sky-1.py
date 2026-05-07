#!/usr/bin/env python3

import os
import re
from pathlib import Path

# Configuration
SOURCE_FILE = "/mnt/d/Code/JS/weather-air/src/WeatherWatch.jsx"
IMAGES_DIR = Path("/mnt/d/Code/JS/weather-air/public/images/sky")

def extract_image_names(source_file):
    """Extract image filenames from the source file."""
    images = []
    
    # Pattern to match image paths - handles quotes and template literals
    pattern = r'image:\s*[\'"]?(?:.*?/)?([^/\'"]+\.(?:jpg|png|gif|jpeg|webp))'
    
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                matches = re.findall(pattern, line, re.IGNORECASE)
                for match in matches:
                    filename = match.strip()
                    images.append({
                        'filename': filename,
                        'base_name': Path(filename).stem,  # Name without extension
                        'extension': Path(filename).suffix.lower(),
                        'line_number': line_num,
                        'original_line': line.strip()
                    })
    except FileNotFoundError:
        print(f"Error: Source file '{source_file}' not found!")
        return []
    
    return images

def check_missing_images(images, images_dir):
    """Check which images are missing, allowing for extension differences."""
    missing = []
    existing = []
    
    # Get all files in directory with their base names
    dir_files = {}
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.webp']:
        for file_path in images_dir.glob(ext):
            dir_files[file_path.stem.lower()] = file_path
    
    for img in images:
        base_name_lower = img['base_name'].lower()
        requested_ext = img['extension']
        
        # Check if file exists with exact name
        exact_path = images_dir / img['filename']
        if exact_path.exists():
            img['actual_path'] = exact_path
            img['match_type'] = 'exact'
            existing.append(img)
        # Check if file exists with different extension
        elif base_name_lower in dir_files:
            actual_file = dir_files[base_name_lower]
            img['actual_path'] = actual_file
            img['match_type'] = f'extension_mismatch (found {actual_file.suffix})'
            existing.append(img)
        else:
            missing.append(img)
    
    return existing, missing

def main():
    print(f"Checking images from: {SOURCE_FILE}")
    print(f"Looking in directory: {IMAGES_DIR}")
    print("=" * 70)
    print()
    
    # Extract image names
    images = extract_image_names(SOURCE_FILE)
    
    if not images:
        print("No images found in the source file!")
        return
    
    # Remove duplicates (keep first occurrence)
    seen = set()
    unique_images = []
    for img in images:
        if img['filename'] not in seen:
            seen.add(img['filename'])
            unique_images.append(img)
    
    # Check which are missing
    existing, missing = check_missing_images(unique_images, IMAGES_DIR)
    
    # Display results
    print(f"📊 Found {len(unique_images)} unique image references:")
    print()
    
    for img in existing:
        if img['match_type'] == 'exact':
            print(f"  ✅ EXISTS:  {img['filename']} (line {img['line_number']})")
        else:
            print(f"  ⚠️  FOUND:   {img['filename']} → actually exists as {img['actual_path'].name} (line {img['line_number']})")
    
    for img in missing:
        print(f"  ❌ MISSING: {img['filename']} (line {img['line_number']})")
        print(f"      → Would be: {IMAGES_DIR / img['filename']}")
    
    print()
    print("=" * 70)
    print(f"SUMMARY:")
    print(f"  Total unique images: {len(unique_images)}")
    print(f"  Existing (exact match): {sum(1 for i in existing if i['match_type'] == 'exact')}")
    print(f"  Existing (different extension): {sum(1 for i in existing if i['match_type'] != 'exact')}")
    print(f"  Truly missing:  {len(missing)}")
    
    if missing:
        print()
        print("🔧 TRULY MISSING files (not found with any extension):")
        for img in missing:
            print(f"  - {img['filename']}")
        
        print()
        print("💡 SUGGESTIONS:")
        print("  Either:")
        print("    1. Add these files to the directory with the requested extensions")
        print("    2. OR update the source file to use the correct extensions")
        
        # Show what files actually exist
        print()
        print("📂 Files actually in the directory:")
        all_files = sorted(IMAGES_DIR.glob("*.*"))
        if all_files:
            for f in all_files:
                if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                    print(f"  • {f.name}")
        else:
            print("  (No image files found in directory)")

if __name__ == "__main__":
    main()
