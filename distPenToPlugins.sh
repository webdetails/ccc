#!/bin/sh

CDF=../cdf/
CGG=../cgg/

CCC_CDF_JS=dist/pen/
CCC_CGG_JS=dist/ccc/

CDF_JS=${CDF}bi-platform-v2-plugin/cdf/js/lib/CCC/
CGG_JS=${CGG}resources/libs/lib/CCC/2.0/

echo "Make sure you have ran generatePvcBundle and generatePenBundle!"

# CDF
cp -f ${CCC_CDF_JS}def.js ${CDF_JS}
cp -f ${CCC_CDF_JS}pvc-d2.0.js ${CDF_JS}
cp -f ${CCC_CDF_JS}tipsy.* ${CDF_JS}
cp -f ${CCC_CDF_JS}jquery.tipsy.js ${CDF_JS}
cp -f ${CCC_CDF_JS}protovis.js ${CDF_JS}
cp -f ${CCC_CDF_JS}protovis-msie.js ${CDF_JS}

# CGG
cp -f ${CCC_CGG_JS}def.js ${CGG_JS}
cp -f ${CCC_CGG_JS}pvc-d2.0.js ${CGG_JS}
cp -f ${CCC_CGG_JS}protovis.js ${CGG_JS}
