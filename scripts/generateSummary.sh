#!/bin/sh

# Run script from base dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";cd $DIR; cd ..

rm target/summary/*.html;

# -- Invoke XSLT
java -jar target/Saxon-HE-9.4.jar -xsl:doc/gen/summary/com2html-summary.xsl -s:doc/model/pvc.options.xml helpBaseUrl=jsdoc/symbols/ outBaseUrl=target/summary/
