#!/bin/sh

TODAY=$(date "+TRUNK-%Y%m%d")

rm -rf dist/test/
mkdir dist/test/
mkdir dist/test/cdf/
mkdir dist/test/cdf/lib/
mkdir dist/test/cdf/lib/CCC/

FILENAME="dist/test/cdf/lib/CCC/pvc-d1.0.js"
cat build/license.js > $FILENAME
echo "" >> $FILENAME
sed "s/\${VERSION}/$TODAY/" build/version.js >> $FILENAME
echo "" >> $FILENAME
cat build/pen/pvc.begin.js >> $FILENAME
# 1 - remove \r on windows otherwise files are not found
# 2 - call perl on each to remove license comments starting on first line
# 3 - append to file
sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs -L1 perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAME
cat build/pen/pvc.end.js >> $FILENAME

FILENAME="dist/test/cdf/lib/CCC/def.js"
cat build/license.js > $FILENAME
echo "" >> $FILENAME
sed "s/\${VERSION}/$TODAY/" build/version.js >> $FILENAME
echo "" >> $FILENAME
cat build/pen/def.begin.js >> $FILENAME
# 2 - call perl on each to remove license comments starting on first line
cat src/def/def.js | perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAME
cat build/pen/def.end.js >> $FILENAME

FILENAME="dist/test/cdf/lib/CCC/protovis.js"
cat build/pen/protovis.begin.js >> $FILENAME
cat src/lib/protovis-d3.3.js >> $FILENAME
cat build/pen/protovis.end.js >> $FILENAME

FILENAME="dist/test/cdf/lib/CCC/protovis-msie.js"
cat build/pen/protovis-msie.begin.js >> $FILENAME
cat src/lib/protovis-msie.js >> $FILENAME
cat build/pen/define.end.js >> $FILENAME

FILENAME="dist/test/cdf/lib/CCC/tipsy.js"
cat build/license.js > $FILENAME
echo "" >> $FILENAME
sed "s/\${VERSION}/$TODAY/" build/version.js >> $FILENAME
echo "" >> $FILENAME
cat build/pen/tipsy.begin.js >> $FILENAME
# 2 - call perl on each to remove license comments starting on first line
cat src/lib/tipsy.js | perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAME
cat build/pen/tipsy.end.js >> $FILENAME

cp src/lib/tipsy.css dist/test/cdf/lib/CCC/
cp src/cdf/jquery.js dist/test/cdf/

FILENAME="dist/test/cdf/lib/CCC/jquery.tipsy.js"
cat build/pen/jquery.tipsy.begin.js >> $FILENAME
cat src/lib/jquery.tipsy.js >> $FILENAME
cat build/pen/jquery.tipsy.end.js >> $FILENAME