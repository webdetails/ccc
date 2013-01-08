#!/bin/sh

FILENAMEDEFD="dist/ccc/def.js"
FILENAMED="dist/ccc/pvc-d2.0.js"
FILENAMER="dist/ccc/pvc-r2.0.js"

rm -rf dist/ccc;
mkdir -p dist/ccc;
cp src/lib/* dist/ccc
cp src/cdf/* dist/ccc
mv dist/ccc/protovis-d3.3.js dist/ccc/protovis.js

TODAY=$(date "+//VERSION TRUNK-%Y%m%d")

# Def lib
echo $TODAY > $FILENAMEDEFD
echo "" >> $FILENAMEDEFD
cat build/def.begin.js >> $FILENAMEDEFD
cat src/def/def.js >> $FILENAMEDEFD
cat build/def.end.js >> $FILENAMEDEFD

echo $TODAY > $FILENAMED
echo "" >> $FILENAMED
sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs cat >> $FILENAMED

# Compile debug file
cat $FILENAMED | java -jar build/google-compiler/compiler-20100201.jar --charset UTF-8 --warning_level=QUIET > $FILENAMER