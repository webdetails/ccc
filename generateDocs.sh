#!/bin/sh

FILENAMED="dist/ccc/pvc-d1.0.js"
FILENAMER="dist/ccc/pvc-r1.0.js"

rm doc/summary/*.html;

# Generate Summary Pages
# Invoke XSLT
java  -jar doc/lib/saxon9he.jar -xsl:doc/gen/summary/com2html-summary.xsl -s:doc/model/pvc.options.xml relativePath=../../model/ helpBaseUrl=../jsdoc/symbols/

# Generate JSDocs
# Invoke XSLT
java  -jar doc/lib/saxon9he.jar -xsl:doc/gen/com2jsdoc.xsl -s:doc/model/pvc.options.xml -o:doc/model/pvc.options.xml.js relativePath=../model/

JSDOCDIR="build/jsdoc_toolkit-2.4.0/"
java -jar ${JSDOCDIR}jsrun.jar ${JSDOCDIR}app/run.js --private --verbose --recurse doc/model/ -t=${JSDOCDIR}templates/jsdoc -d=doc/jsdoc