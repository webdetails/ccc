#!/bin/sh

FILENAME="pvc-d1.0.js"
TODAY=$(date "+//VERSION TRUNK-%Y%m%d\n")
echo $TODAY > $FILENAME

cat build/def.begin.js >> $FILENAME
cat src/def/def.js >> $FILENAME
cat build/def.end.js >> $FILENAME

echo "" >> $FILENAME

sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs cat >> $FILENAME