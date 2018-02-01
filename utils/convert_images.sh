#!/bin/bash
for file in *.jpg; do convert $file -sampling-factor 4:2:0 -strip -quality 85 -interlace JPEG -colorspace sRGB -resize 256x256^ thumbs/$file; done
