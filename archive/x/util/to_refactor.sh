#!/usr/bin/bash
cd src
find . -name "*.tsx" -exec wc -l {} \; | awk '$1 > 350'
