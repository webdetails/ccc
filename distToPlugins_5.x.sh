#!/bin/sh

CDF=../cdf/
CGG=../cgg/

echo "Make sure you have ran generatePvcBundle and generatePenBundle!"

# CDF
IN_JS=dist/pen/
OUT_JS=${CDF}bi-platform-v2-plugin/cdf/js/lib/CCC/

cp -f ${IN_JS}def.js ${OUT_JS}
cp -f ${IN_JS}pvc-d1.0.js ${OUT_JS}
cp -f ${IN_JS}tipsy.* ${OUT_JS}
cp -f ${IN_JS}jquery.tipsy.js ${OUT_JS}
cp -f ${IN_JS}protovis.js ${OUT_JS}
cp -f ${IN_JS}protovis-msie.js ${OUT_JS}

# CGG
IN_JS=dist/ccc/
OUT_JS=${CGG}resources/libs/lib/CCC/2.0/

cp -f ${IN_JS}def.js ${OUT_JS}
cp -f ${IN_JS}pvc-d2.0.js ${OUT_JS}
cp -f ${IN_JS}protovis.js ${OUT_JS}
