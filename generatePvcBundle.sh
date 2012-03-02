#!/bin/sh


VERSION="pvc-d1.0.js"
echo "//VERSION $@\n" > $VERSION


sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs cat >> $VERSION

