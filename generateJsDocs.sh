#!/bin/sh

# Generate JSDocs
# Invoke XSLT: pvc.options.xml -> pvc.options.xml.js
if [ ! -f "lib/Saxon-HE-9.4.jar" ]; then
    echo "Please run ant resolve first to download Saxon utility"
    exit
fi

java  -jar lib/Saxon-HE-9.4.jar -xsl:doc/gen/com2jsdoc.xsl -s:doc/model/pvc.options.xml -o:doc/model/pvc.options.xml.js relativePath=../model/

rm -rf dist/jsdoc;


if [ ! -f "lib/jsdoc-2.4Custom.zip" ]; then
    echo "Please run ant resolve first to download jsdoc utility"
else
    if [ ! -d "lib/jsdoc-2.4Custom.zip" ]; then
        unzip -oq lib/jsdoc-2.4Custom.zip -d build
    fi
    JSDOCDIR="build/jsdoc_toolkit-2.4.0/"
    java -jar ${JSDOCDIR}jsrun.jar ${JSDOCDIR}app/run.js --private --verbose --recurse doc/model/ -t=${JSDOCDIR}templates/jsdoc -d=dist/jsdoc
fi

