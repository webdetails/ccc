#!/bin/sh

FILENAMED="dist/ccc/pvc-d2.0.js"
FILENAMER="dist/ccc/pvc-r2.0.js"

# Generate Summary Pages
rm dist/summary/*.html;
OUTBASEURL="file:/C:/webdetails/pentaho/ccc/dist/summary/"
# Invoke XSLT
java  -jar doc/lib/saxon9he.jar -xsl:doc/gen/summary/com2html-summary.xsl -s:doc/model/pvc.options.xml relativePath=../../model/ helpBaseUrl=../jsdoc/symbols/ outBaseUrl=${OUTBASEURL}

# Generate JSDocs
# Invoke XSLT
java  -jar doc/lib/saxon9he.jar -xsl:doc/gen/com2jsdoc.xsl -s:doc/model/pvc.options.xml -o:doc/model/pvc.options.xml.js relativePath=../model/

JSDOCDIR="build/jsdoc_toolkit-2.4.0/"
java -jar ${JSDOCDIR}jsrun.jar ${JSDOCDIR}app/run.js --private --verbose --recurse doc/model/ -t=${JSDOCDIR}templates/jsdoc -d=dist/jsdoc