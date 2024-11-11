#!/bin/sh
# ******************************************************************************
#
# Pentaho
#
# Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
#
# Use of this software is governed by the Business Source License included
# in the LICENSE.TXT file.
#
# Change Date: 2028-08-13
# ******************************************************************************

# Generate JSDocs
# Invoke XSLT: pvc.options.xml -> pvc.options.xml.js

# Run script from base dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";cd $DIR; cd ..

if [ ! -f "target/Saxon-HE-9.4.jar" ]; then
    echo "Please run mvn clean install first to download Saxon utility"
    exit
fi

java  -jar target/Saxon-HE-9.4.jar -xsl:doc/gen/com2jsdoc.xsl -s:doc/model/pvc.options.xml -o:doc/model/pvc.options.xml.js relativePath=../model/

rm -rf target/jsdoc;


if [ ! -f "target/jsdoc-2.4Custom.zip" ]; then
    echo "Please run mvn clean install first to download jsdoc utility"
else
    if [ ! -d "target/jsdoc-2.4Custom.zip" ]; then
        unzip -oq target/jsdoc-2.4Custom.zip -d target
    fi
    JSDOCDIR="target/jsdoc_toolkit-2.4.0/"
    java -jar ${JSDOCDIR}jsrun.jar ${JSDOCDIR}app/run.js --private --verbose --recurse doc/model/ -t=${JSDOCDIR}templates/jsdoc -d=target/jsdoc
fi

