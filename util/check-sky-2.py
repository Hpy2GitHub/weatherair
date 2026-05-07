#!/usr/bin/env python3

import re
import os
from pathlib import Path

# Configuration
JSX_FILE = "/mnt/d/Code/JS/weather-air/src/WeatherWatch.jsx"
OUTPUT_DIR = "/mnt/d/Code/JS/weather-air/public/images/sky"
OUTPUT_HTML = f"{OUTPUT_DIR}/weather_gallery.htm"
IMAGES_BASE_PATH = "/mnt/d/Code/JS/weather-air/public/images/sky"
# Change HTML_IMAGES_PATH to be relative to where the HTML file will be opened from
# If you open the HTML from the same directory as this script, use:
HTML_IMAGES_PATH = IMAGES_BASE_PATH
# Or if you prefer a relative path, make it absolute:
# HTML_IMAGES_PATH = "file:///mnt/d/Code/JS/weather-air/public/images/sky"

def parse_jsx_wmo(jsx_file):
    """Parse the JSX file to extract the WMO object."""
    try:
        with open(jsx_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the WMO object - more flexible pattern
        # Look for "const WMO = {" then capture until the matching "};"
        pattern = r'const\s+WMO\s*=\s*\{'
        start_match = re.search(pattern, content)
        
        if not start_match:
            print("Error: Could not find 'const WMO = {' in file")
            return []
        
        # Find the matching closing brace
        start_pos = start_match.end()
        brace_count = 1
        end_pos = start_pos
        
        for i in range(start_pos, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_pos = i
                    break
        
        if brace_count != 0:
            print("Error: Could not find matching closing brace for WMO object")
            return []
        
        wmo_content = content[start_pos:end_pos]
        
        # Parse individual entries - more flexible pattern
        entries = []
        
        # Pattern for each entry: number: { label: '...', icon: '...', image: `...` }
        # Handle single quotes, double quotes, and template literals
        entry_pattern = r'(\d+):\s*\{\s*label:\s*[\'"]([^\'"]+)[\'"],\s*icon:\s*[\'"]([^\'"]*)[\'"],\s*image:\s*`([^`]+)`\s*\}'
        
        for match in re.finditer(entry_pattern, wmo_content):
            code = int(match.group(1))
            label = match.group(2)
            icon = match.group(3) if match.group(3) else ' '
            image_path = match.group(4)
            # Extract just the filename from the path
            image_file = image_path.split('/')[-1]
            
            entries.append({
                'code': code,
                'label': label,
                'icon': icon,
                'image': image_file,
                'full_path': image_path
            })
        
        # Also try pattern for entries without trailing comma or with different spacing
        if not entries:
            entry_pattern2 = r'(\d+):\s*\{\s*label:\s*[\'"]([^\'"]+)[\'"],\s*icon:\s*[\'"]([^\'"]*)[\'"],\s*image:\s*`([^`]+)`\s*\}'
            for match in re.finditer(entry_pattern2, wmo_content):
                code = int(match.group(1))
                label = match.group(2)
                icon = match.group(3) if match.group(3) else ' '
                image_path = match.group(4)
                image_file = image_path.split('/')[-1]
                
                entries.append({
                    'code': code,
                    'label': label,
                    'icon': icon,
                    'image': image_file,
                    'full_path': image_path
                })
        
        print(f"Found {len(entries)} WMO entries")
        
        # Debug: Print first few entries to verify
        if entries:
            n = min(3, len(entries))  # Fixed: use min to avoid index error
            print("\nFirst 3 entries parsed:")
            for i, entry in enumerate(entries[:n]):
                print(f"  {entry['code']}: {entry['label']} -> {entry['image']}")
        
        return entries
        
    except FileNotFoundError:
        print(f"Error: JSX file '{jsx_file}' not found!")
        return []
    except Exception as e:
        print(f"Error parsing JSX: {e}")
        import traceback
        traceback.print_exc()
        return []

def check_image_exists(image_filename, images_dir):
    """Check if an image exists in the directory."""
    if not image_filename:
        return False, None
    
    images_dir_path = Path(images_dir)
    if not images_dir_path.exists():
        print(f"Warning: Images directory does not exist: {images_dir}")
        return False, None
    
    # Try exact match first
    image_path = images_dir_path / image_filename
    if image_path.exists():
        return True, image_filename
    
    # Try case-insensitive match
    image_filename_lower = image_filename.lower()
    for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        for file_path in images_dir_path.glob(f"*.{ext}"):
            if file_path.name.lower() == image_filename_lower:
                return True, file_path.name
    
    # Try matching just the stem (without extension)
    stem_lower = Path(image_filename).stem.lower()
    for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        for file_path in images_dir_path.glob(f"*.{ext}"):
            if file_path.stem.lower() == stem_lower:
                return True, file_path.name
    
    return False, None

def generate_html(entries, output_file, html_images_path):
    """Generate HTML page with image gallery."""
    
    # Add image existence info
    for entry in entries:
        exists, actual = check_image_exists(entry['image'], IMAGES_BASE_PATH)
        entry['image_exists'] = exists
        entry['actual_image'] = actual if actual else entry['image']
    
    total_images = len(entries)
    existing_count = sum(1 for entry in entries if entry['image_exists'])
    missing_count = total_images - existing_count
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather Images Gallery - Verify WMO vs Images</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.1);
            padding: 25px;
        }}
        
        h1 {{
            color: #1a237e;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 3px solid #4CAF50;
        }}
        
        .subtitle {{
            color: #666;
            margin-bottom: 20px;
            font-style: italic;
        }}
        
        .stats {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .stat-box {{
            background: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }}
        
        .stat-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
        }}
        
        .stat-value {{
            font-size: 28px;
            font-weight: bold;
            color: #4CAF50;
        }}
        
        .gallery {{
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }}
        
        .card {{
            float: left;
            width: 320px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-bottom: 20px;
        }}
        
        .card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }}
        
        .image-container {{
            width: 200px;
            height: 200px;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            border-radius: 50%;
            overflow: hidden;
            position: relative;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }}
        
        .card img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }}
        
        .image-missing {{
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #ffebee;
            color: #c62828;
            font-size: 14px;
            text-align: center;
            padding: 20px;
            border-radius: 50%;
        }}
        
        .card-content {{
            padding: 15px;
            border-top: 1px solid #e0e0e0;
            background: #fafafa;
        }}
        
        .json-data {{
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.5;
            color: #333;
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }}
        
        .json-key {{
            color: #0066cc;
            font-weight: bold;
        }}
        
        .json-number {{
            color: #ff6b6b;
        }}
        
        .json-string {{
            color: #2e7d32;
        }}
        
        .label-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        
        .badge-exists {{
            background: #c8e6c9;
            color: #2e7d32;
        }}
        
        .badge-missing {{
            background: #ffcdd2;
            color: #c62828;
        }}
        
        .badge-mismatch {{
            background: #fff3e0;
            color: #e65100;
        }}
        
        .icon-display {{
            font-size: 32px;
            margin-bottom: 10px;
            text-align: center;
        }}
        
        .label-name {{
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
            color: #1a237e;
            text-align: center;
        }}
        
        .code-display {{
            font-size: 11px;
            color: #999;
            text-align: center;
            margin-bottom: 10px;
        }}
        
        .clearfix::after {{
            content: "";
            clear: both;
            display: table;
        }}
        
        @media (max-width: 700px) {{
            .card {{
                width: calc(50% - 20px);
            }}
        }}
        
        @media (max-width: 500px) {{
            .card {{
                width: 100%;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🏞️ Weather Images Gallery</h1>
        <div class="subtitle">Verifying WMO weather codes against actual image files</div>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-label">Total WMO Codes</div>
                <div class="stat-value">{total_images}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Images Found</div>
                <div class="stat-value" style="color: #2e7d32;">{existing_count}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Images Missing</div>
                <div class="stat-value" style="color: #c62828;">{missing_count}</div>
            </div>
        </div>
        
        <div class="gallery clearfix">
"""
    
    # Generate cards for each entry
    for entry in entries:
        code = entry['code']
        label = entry['label']
        icon = entry['icon'] if entry['icon'] and entry['icon'] != ' ' else '🔲'
        image_file = entry['image']
        image_exists = entry['image_exists']
        actual_image = entry.get('actual_image', image_file)
        
        # Determine badge
        if image_exists:
            if actual_image != image_file:
                badge_class = "badge-mismatch"
                badge_text = f"⚠️ FOUND AS {actual_image}"
            else:
                badge_class = "badge-exists"
                badge_text = "✓ IMAGE FOUND"
        else:
            badge_class = "badge-missing"
            badge_text = "✗ IMAGE MISSING"
        
        # Image source or placeholder
        if image_exists and actual_image:
            # Use relative path for local viewing
            img_src = actual_image
            img_tag = f'<img src="{img_src}" alt="{label}" loading="lazy">'
        else:
            img_tag = f'<div class="image-missing"><div>❌<br>Image Missing<br><span style="font-size:11px">{image_file}</span></div></div>'
        
        # Format JSON-like display
        json_display = f"""{{
  <span class="json-key">"code"</span>: <span class="json-number">{code}</span>,
  <span class="json-key">"label"</span>: <span class="json-string">"{label}"</span>,
  <span class="json-key">"icon"</span>: <span class="json-string">"{icon}"</span>,
  <span class="json-key">"image"</span>: <span class="json-string">"{image_file}"</span>
}}"""
        
        html_content += f"""
            <div class="card">
                <div class="image-container">
                    {img_tag}
                </div>
                <div class="card-content">
                    <div class="label-badge {badge_class}">{badge_text}</div>
                    <div class="icon-display">{icon}</div>
                    <div class="label-name">{label}</div>
                    <div class="code-display">WMO Code: {code}</div>
                    <div class="json-data">
                        {json_display}
                    </div>
                </div>
            </div>
"""
    
    html_content += """
        </div>
    </div>
</body>
</html>
"""
    
    # Write the HTML file
    if os.path.exists(OUTPUT_DIR):
        print(f"found {OUTPUT_DIR}")
    else:
        print(f"not found {OUTPUT_DIR}")
        os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"✅ HTML gallery generated: {output_file}")

def main():
    print(f"Parsing JSX file: {JSX_FILE}")
    entries = parse_jsx_wmo(JSX_FILE)
    
    if not entries:
        print("No entries found. Please check the JSX file format.")
        return
    
    print(f"\nChecking images in: {IMAGES_BASE_PATH}")
    print(f"Directory exists: {Path(IMAGES_BASE_PATH).exists()}")
    
    # List some files in the directory if it exists
    if Path(IMAGES_BASE_PATH).exists():
        files = list(Path(IMAGES_BASE_PATH).glob("*"))[:5]  # Show first 5 files
        print(f"First few files in directory:")
        for f in files:
            print(f"  - {f.name}")
    
    # Show summary of missing vs found
    print("\n" + "="*70)
    print("IMAGE CHECK SUMMARY:")
    print("="*70)
    
    found_count = 0
    missing_count = 0
    mismatch_count = 0
    
    for entry in entries:
        exists, actual = check_image_exists(entry['image'], IMAGES_BASE_PATH)
        if exists:
            if actual != entry['image']:
                status = f"⚠️  FOUND (as {actual})"
                mismatch_count += 1
            else:
                status = "✅ FOUND"
                found_count += 1
        else:
            status = "❌ MISSING"
            missing_count += 1
        
        print(f"{status:25} WMO {entry['code']:3} - {entry['image']:35} ({entry['label']})")
        entry['image_exists'] = exists
        entry['actual_image'] = actual if actual else entry['image']
    
    print("="*70)
    print(f"\nSUMMARY: Found: {found_count} | Mismatch: {mismatch_count} | Missing: {missing_count} | Total: {len(entries)}")
    
    # Generate HTML
    generate_html(entries, OUTPUT_HTML, HTML_IMAGES_PATH)
    
    print(f"\n📁 Open {OUTPUT_HTML} in your browser to view the gallery")
    print(f"📂 Image directory: {IMAGES_BASE_PATH}")
    print(f"\n💡 Tip: If images don't show, check that the HTML file is in the same directory as the images.")
    print(f"   Current image path in HTML: just the filename (e.g., storm-cloud.png)")

if __name__ == "__main__":
    main()
