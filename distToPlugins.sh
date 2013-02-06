#!/bin/sh

CDF=../cdf/
CGG=../cgg/

CCC_JS=dist/ccc/

CDF_JS=${CDF}bi-platform-v2-plugin/cdf/js/lib/CCC/
CGG_JS=${CGG}resources/libs/

# CDF
cp -f ${CCC_JS}def.js ${CDF_JS}def-2.0.js
cp -f ${CCC_JS}pvc-d2.0.js ${CDF_JS}
cp -f ${CCC_JS}tipsy.* ${CDF_JS}
cp -f ${CCC_JS}jquery.tipsy.js ${CDF_JS}
cp -f ${CCC_JS}protovis.js ${CDF_JS}
cp -f ${CCC_JS}protovis-msie.js ${CDF_JS}

# CGG
cp -f ${CCC_JS}def.js ${CGG_JS}
cp -f ${CCC_JS}pvc-d2.0.js ${CGG_JS}
cp -f ${CCC_JS}tipsy.js ${CGG_JS}
cp -f ${CCC_JS}protovis.js ${CGG_JS}
