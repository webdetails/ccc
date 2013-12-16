#!/bin/sh

TODAY=$(date "+TRUNK-%Y%m%d")

rm -rf dist/define/
mkdir dist/define/

FILENAME="dist/define/pvc.js"
cat build/license.js > $FILENAME
echo "" >> $FILENAME
sed "s/\${VERSION}/$TODAY/" build/version.js >> $FILENAME
echo "" >> $FILENAME
cat build/define/pvc.begin.js >> $FILENAME
# 1 - remove \r on windows otherwise files are not found
# 2 - call perl on each to remove license comments starting on first line
# 3 - append to file
sed ':a;N;$!ba;s/\n/ /g' pvcBundleFiles.txt | xargs -L1 perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAME
cat build/define/pvc.end.js >> $FILENAME


FILENAME="dist/define/def.js"
cat build/license.js > $FILENAME
echo "" >> $FILENAME
sed "s/\${VERSION}/$TODAY/" build/version.js >> $FILENAME
echo "" >> $FILENAME
cat build/define/def.begin.js >> $FILENAME
# 2 - call perl on each to remove license comments starting on first line
cat src/def/def.js | perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAME
cat build/define/def.end.js >> $FILENAME

FILENAME="dist/define/protovis.js"
cat build/define/protovis.begin.js >> $FILENAME
cat src/lib/protovis-d3.3.js >> $FILENAME
cat build/define/protovis.end.js >> $FILENAME

FILENAME="dist/define/protovis-msie.js"
cat build/define/protovis-msie.begin.js >> $FILENAME
cat src/lib/protovis-msie.js >> $FILENAME
cat build/define/define.end.js >> $FILENAME

FILENAME="dist/define/tipsy.js"
cat build/license.js > $FILENAME
echo "" >> $FILENAME
sed "s/\${VERSION}/$TODAY/" build/version.js >> $FILENAME
echo "" >> $FILENAME
cat build/define/tipsy.begin.js >> $FILENAME
# 2 - call perl on each to remove license comments starting on first line
cat src/lib/tipsy.js | perl -0777 -pe 's/^\/\*.*?\*\///igs' >> $FILENAME
cat build/define/tipsy.end.js >> $FILENAME

cp src/lib/tipsy.css dist/define/

FILENAME="dist/define/jquery.tipsy.js"
cat build/define/jquery.tipsy.begin.js >> $FILENAME
cat src/lib/jquery.tipsy.js >> $FILENAME
cat build/define/jquery.tipsy.end.js >> $FILENAME