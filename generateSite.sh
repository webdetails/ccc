#!/bin/sh

echo "Be sure to have ran generatePvcBundle before"

# delete dist directory
#rm -rf dist/site/lib;
rm -rf dist/site/*.html;

# create dist directory struture
mkdir -p dist/site/lib/;
mkdir -p dist/site/lib/codemirror;

# copy all dependencies

cp -f dist/ccc/* dist/site/lib
rm -rf dist/site/lib/pvc-d2.0.js

cp -f src/data/q01-01.js dist/site/lib
cp -f src/data/bp.js dist/site/lib
cp -f examples/lib/codemirror/codemirror.* dist/site/lib/codemirror
cp -f examples/lib/codemirror/javascript.js dist/site/lib/codemirror

# I - generate templates 
# Invoke XSLT
java -jar doc/lib/saxon9he.jar -xsl:site/gen/genTemplates.xsl -s:site/gen/templates.xml outBaseUrl=site/templates/

# II - generate one output files per template
for file in site/templates/*; do perl ./site/_generate.pl $file site/resources > dist/site/$(basename $file); done;