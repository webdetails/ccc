#!/bin/sh

FILENAMED="dist/ccc/pvc-d1.0.js"
FILENAMER="dist/ccc/pvc-r1.0.js"

rm -rf dist/ccc;
mkdir -p dist/ccc/lib;
cp src/lib/* dist/ccc/lib
cp src/cdf/* dist/ccc/lib

TODAY=$(date "+//VERSION TRUNK-%Y%m%d\n")
echo $TODAY > $FILENAMED

cat build/def.begin.js >> $FILENAMED
cat src/def/def.js >> $FILENAMED
cat build/def.end.js >> $FILENAMED

echo "" >> $FILENAMED

sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs cat >> $FILENAMED

cat $FILENAMED | java -jar build/google-compiler/compiler-20100201.jar --charset UTF-8 --warning_level=QUIET > $FILENAMER