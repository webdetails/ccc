#!/bin/sh

CGG=../cgg/

echo "Make sure you have ran 'ant assemble'!"

# CDF - Already pulls latest CCC

# CGG
IN_JS=bin/stage/ccc/amd/
OUT_JS=${CGG}resources/libs/ccc/2.0/

cp -f ${IN_JS}def.js ${OUT_JS}
cp -f ${IN_JS}pvc.js ${OUT_JS}
cp -f ${IN_JS}protovis.js ${OUT_JS}
