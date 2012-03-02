#!/bin/sh

FILENAME="pvc-d1.0.js"
TODAY=$(date "+//VERSION TRUNK-%Y%m%d\n")
echo $TODAY > $FILENAME

sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs cat >> $FILENAME