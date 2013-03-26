#!/bin/sh

# Generate JSDocs
# Invoke XSLT: pvc.options.xml -> pvc.options.xml.js
java  -jar doc/lib/saxon9he.jar -xsl:doc/gen/com2jsdoc.xsl -s:doc/model/pvc.options.xml -o:doc/model/pvc.options.xml.js relativePath=../model/

rm -rf dist/jsdoc;

JSDOCDIR="build/jsdoc_toolkit-2.4.0/"
java -jar ${JSDOCDIR}jsrun.jar ${JSDOCDIR}app/run.js --private --verbose --recurse doc/model/ -t=${JSDOCDIR}templates/jsdoc -d=dist/jsdoc

