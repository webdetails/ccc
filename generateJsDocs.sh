#!/bin/sh

# Generate JSDocs
# Invoke XSLT: pvc.options.xml -> pvc.options.xml.js
java  -jar lib/Saxon-HE-9.4.jar -xsl:doc/gen/com2jsdoc.xsl -s:doc/model/pvc.options.xml -o:doc/model/pvc.options.xml.js relativePath=../model/

rm -rf dist/jsdoc;

wget https://jsdoc-toolkit.googlecode.com/files/jsdoc_toolkit-2.4.0.zip -O jsdoc_toolkit-2.4.0.zip;
if [ ! -d "build/jsdoc_toolkit-2.4.0" ]; then
    unzip jsdoc_toolkit-2.4.0.zip -d build
fi
JSDOCDIR="build/jsdoc_toolkit-2.4.0/jsdoc-toolkit/"
java -jar ${JSDOCDIR}jsrun.jar ${JSDOCDIR}app/run.js --private --verbose --recurse doc/model/ -t=${JSDOCDIR}templates/jsdoc -d=dist/jsdoc

