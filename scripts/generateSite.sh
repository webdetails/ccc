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


echo "Be sure to have ran 'mvn clean install' and './generateJsDocs.sh' before"
# Run script from base dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";cd $DIR; cd ..

SITE=target/site/
SITECHARTS=${SITE}charts/
SITECHARTSLIB=${SITECHARTS}lib/
SITECHARTSJSDOCS=${SITECHARTS}jsdoc/
CODEMIRROR=${SITECHARTSLIB}codemirror/

# delete site dist directory
rm -rf ${SITE};
#rm -rf ${SITECHARTS}*.html;

# Ensure site dist directory struture
mkdir -p ${SITE};

# Copy site root image
cp -Rf site/root/* ${SITE};

mkdir -p ${SITECHARTS};
mkdir -p ${SITECHARTSLIB};
mkdir -p ${SITECHARTSLIB}amd/;
mkdir -p ${SITECHARTSJSDOCS};
mkdir -p ${CODEMIRROR};

# CCC & dependencies
cp -Rf target/module-scripts/ccc/* ${SITECHARTSLIB}
cp -Rf target/module-scripts/amd/* ${SITECHARTSLIB}amd/

cp -f ccc-js/src/main/javascript/package-res/lib/jquery.js ${SITECHARTSLIB}

cp -f examples/data/q01-01.js ${SITECHARTSLIB}
cp -f examples/data/bp.js     ${SITECHARTSLIB}
cp -f examples/lib/codemirror/codemirror.*  ${CODEMIRROR}
cp -f examples/lib/codemirror/javascript.js ${CODEMIRROR}

# Copy JsDocs
cp -Rf target/jsdoc/* ${SITECHARTSJSDOCS};

# I - Generate Summary Resource Pages
rm target/summary/*.html;

# -- Invoke XSLT
java -jar target/Saxon-HE-9.4.jar -xsl:doc/gen/summary/com2html-summary.xsl -s:doc/model/pvc.options.xml helpBaseUrl=jsdoc/symbols/ outBaseUrl=target/summary/

# II - generate templates from templates.xml
# -- Invoke XSLT
java -jar target/Saxon-HE-9.4.jar -xsl:site/gen/genTemplates.xsl -s:site/gen/templates.xml outBaseUrl=site/templates/ summaryResourceBaseUrl=../../target/summary/

# III - generate one output file per template
for file in site/templates/*; do perl ./site/_generate.pl $file site/resources > ${SITECHARTS}$(basename $file); done;
