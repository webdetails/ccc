#!/bin/sh

rm dist/summary/*.html;

# -- Invoke XSLT
java -jar doc/lib/saxon9he.jar -xsl:doc/gen/summary/com2html-summary.xsl -s:doc/model/pvc.options.xml helpBaseUrl=jsdoc/symbols/ outBaseUrl=dist/summary/
