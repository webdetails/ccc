#!/bin/sh

echo "Be sure to have ran generatePvcBundle and generateJsDocs before"

# delete site dist directory
SITE=dist/site/
SITECTOOLS=${SITE}ctools/
SITECHARTS=${SITECTOOLS}charts/
SITECHARTSLIB=${SITECHARTS}lib/
SITECHARTSJSDOCS=${SITECHARTS}jsdoc/
CODEMIRROR=${SITECHARTSLIB}codemirror/

rm -rf ${SITE};
#rm -rf ${SITECHARTS}*.html;

# Ensure site dist directory struture
mkdir -p ${SITE};
mkdir -p ${SITECTOOLS};
mkdir -p ${SITECHARTS};
mkdir -p ${SITECHARTSLIB};
mkdir -p ${SITECHARTSJSDOCS};
mkdir -p ${CODEMIRROR};

# Copy site root image
cp -rf --no-preserve=ownership site/root/* ${SITE};

# CCC & dependencies
cp -f dist/ccc/* ${SITECHARTSLIB}
rm -rf ${SITECHARTSLIB}pvc-d2.0.js # uses release version
rm -rf ${SITECHARTSLIB}protovis-r3.3.js # uses debug version

cp -f examples/data/q01-01.js ${SITECHARTSLIB}
cp -f examples/data/bp.js     ${SITECHARTSLIB}
cp -f examples/lib/codemirror/codemirror.*  ${CODEMIRROR}
cp -f examples/lib/codemirror/javascript.js ${CODEMIRROR}

# Copy JsDocs
cp -rf dist/jsdoc/* ${SITECHARTSJSDOCS};

# I - Generate Summary Resource Pages
rm dist/summary/*.html;

# -- Invoke XSLT
java -jar doc/lib/saxon9he.jar -xsl:doc/gen/summary/com2html-summary.xsl -s:doc/model/pvc.options.xml helpBaseUrl=jsdoc/symbols/ outBaseUrl=dist/summary/

# II - generate templates from templates.xml
# -- Invoke XSLT
java -jar doc/lib/saxon9he.jar -xsl:site/gen/genTemplates.xsl -s:site/gen/templates.xml outBaseUrl=site/templates/ summaryResourceBaseUrl=../../dist/summary/

# III - generate one output file per template
for file in site/templates/*; do perl ./site/_generate.pl $file site/resources > ${SITECHARTS}$(basename $file); done;
