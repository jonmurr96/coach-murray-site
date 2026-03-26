#!/bin/bash
# Decode base64 files into the coach-murray-site repo
cd /Users/owner/Downloads/coach-murray-site
mkdir -p assets

# Decode the 3 base64 files
base64 -d /tmp/css_b64.txt > assets/index-BAVvPVXt.css
base64 -d /tmp/js_b64.txt > assets/index-Dwy-5pog.js  
base64 -d /tmp/img_b64.txt > profile.jpg

echo "Files installed:"
ls -la assets/ profile.jpg

# Git commit and push
git add -A
git commit -m "Fix HTML and add site assets with Stripe links"
git push

echo ""
echo "Push complete! Now deploying to Netlify..."
