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
cat build/license.js > $FILENAMEDEFD
echo "" >> $FILENAMEDEFD
echo $TODAY >> $FILENAMEDEFD
echo "" >> $FILENAMEDEFD
cat build/def.begin.js >> $FILENAMEDEFD
# 2 - call perl on each to remove license comments starting on first line
cat src/def/def.js | perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAMEDEFD
cat build/def.end.js >> $FILENAMEDEFD

cat build/license.js > $FILENAMED
echo "" >> $FILENAMED
echo $TODAY >> $FILENAMED
echo "" >> $FILENAMED
cat build/pvc.begin.js >> $FILENAMED
# 1 - remove \r on windows otherwise files are not found
# 2 - call perl on each to remove license comments starting on first line
# 3 - append to file
sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs -L1 perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAMED
cat build/pvc.end.js >> $FILENAMED

# Compile debug file and create release file
cat build/license.js > $FILENAMER
echo "" >> $FILENAMER
echo $TODAY >> $FILENAMER
echo "" >> $FILENAMER

#QUIET VERBOSE \
#--jscomp_warning
#--jscomp_error accessControls \
#--jscomp_error checkTypes \
#--jscomp_error unknownDefines \
cat $FILENAMED | \
java -jar build/google-compiler/compiler-20130411.jar \
--formatting PRETTY_PRINT \
--debug \
--compilation_level ADVANCED_OPTIMIZATIONS \
--charset UTF-8 \
--warning_level DEFAULT \
--externs $FILENAMEDEFD \
--externs dist/ccc/protovis.js \
--externs build/pvc.externs.js \
--jscomp_off externsValidation \
--jscomp_off checkTypes \
--jscomp_off globalThis \
--generate_exports \
>> $FILENAMER
