#!/usr/bin/env python3
"""
check_components.py
Compares componentIds used in App.jsx against ids registered in ComponentRegistry.jsx.

Usage:
    python check_components.py
    python check_components.py --app src/App.jsx --registry src/config/ComponentRegistry.jsx
"""

import re
import sys
import argparse

def extract_app_ids(path):
    """Pull every componentId="..." value from App.jsx."""
    with open(path) as f:
        src = f.read()
    return set(re.findall(r'componentId=["\']([^"\']+)["\']', src))

def extract_registry_ids(path):
    """Pull every id: '...' value from ComponentRegistry.jsx."""
    with open(path) as f:
        src = f.read()
    return set(re.findall(r"id:\s*['\"]([^'\"]+)['\"]", src))

def main():
    parser = argparse.ArgumentParser(description="Check componentId consistency.")
    parser.add_argument("--app",      default="src/App.jsx")
    parser.add_argument("--registry", default="src/config/ComponentRegistry.jsx")
    args = parser.parse_args()

    app_ids      = extract_app_ids(args.app)
    registry_ids = extract_registry_ids(args.registry)

    only_in_app      = app_ids - registry_ids   # typo in App.jsx
    only_in_registry = registry_ids - app_ids   # typo in registry, or dead entry

    ok = True

    if only_in_app:
        ok = False
        print("❌ Used in App.jsx but MISSING from registry (typo in App?):")
        for id_ in sorted(only_in_app):
            print(f"   {id_!r}")

    if only_in_registry:
        ok = False
        print("⚠️  In registry but NEVER used in App.jsx (typo in registry, or dead entry?):")
        for id_ in sorted(only_in_registry):
            print(f"   {id_!r}")

    if ok:
        print(f"✅ All {len(app_ids)} component IDs match between App.jsx and registry.")

    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
