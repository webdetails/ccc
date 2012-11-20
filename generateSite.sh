#!/bin/sh

# delete dist directory
#rm -rf site/dist/lib;
rm -rf site/dist/*.html;

# create dist directory struture
mkdir -p site/dist/lib/;
mkdir -p site/dist/lib/codemirror;

# copy all dependencies

cp -f dist/ccc/pvc-r1.0.js site/dist/lib
cp -f dist/ccc/lib/* site/dist/lib
cp -f src/data/q01-01.js site/dist/lib
cp -f src/data/bp.js site/dist/lib
cp -f examples/lib/codemirror/codemirror.* site/dist/lib/codemirror
cp -f examples/lib/codemirror/javascript.js site/dist/lib/codemirror

# I - generate templates 
# Invoke XSLT
java -jar doc/lib/saxon9he.jar -xsl:site/gen/genTemplates.xsl -s:site/gen/templates.xml outBaseUrl=site/templates/

# II - generate one output files per template
for file in site/templates/*; do perl ./site/_generate.pl $file site/resources > site/dist/$(basename $file); done;