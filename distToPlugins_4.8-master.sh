#!/bin/sh

CDF=../cdf/
CGG=../cgg/

echo "Make sure you have ran generatePvcBundle and generateDefBundle!"

IN_JS=dist/ccc/
OUT_JS=${CDF}bi-platform-v2-plugin/cdf/js/lib/CCC/

# CDF ------
cp -f ${IN_JS}def.js ${OUT_JS}def-2.0.js
cp -f ${IN_JS}pvc-d2.0.js ${OUT_JS}
cp -f ${IN_JS}tipsy.* ${OUT_JS}
cp -f ${IN_JS}jquery.tipsy.js ${OUT_JS}
cp -f ${IN_JS}protovis.js ${OUT_JS}
cp -f ${IN_JS}protovis-msie.js ${OUT_JS}

# CGG ------
# For CGG, CCC is published to the "latest" CCC folder: "2.0".
# Specific CCC releases are then copied from this one, by hand,
# and given a label name (like 2.0-13.12.02-dev).
OUT_JS=${CGG}cgg-core/src/pt/webdetails/cgg/resources/ccc/2.0/
IN_JS=dist/define/

cp -f ${IN_JS}def.js ${OUT_JS}
cp -f ${IN_JS}pvc.js ${OUT_JS}
cp -f ${IN_JS}protovis.js ${OUT_JS}
