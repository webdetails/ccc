#!/bin/sh

# delete dist directory
rm -rf dist;

# create dist directory struture
mkdir -p dist/templates/lib/;
mkdir -p dist/templates/lib/codemirror;

# copy all dependencies

cp ../src/lib/* dist/templates/lib
cp ../src/cdf/* dist/templates/lib
cp ../src/data/q01-01.js dist/templates/lib
cp ../examples/pvcDocUtils.* dist/templates/lib
cp ../examples/lib/codemirror/codemirror.* dist/templates/lib/codemirror
cp ../examples/lib/codemirror/javascript.js dist/templates/lib/codemirror

cp ../pvc-r1.0.js dist/templates/lib
#cp ../pvc-d1.0.js dist/templates/lib

# generate one output files per template
for file in templates/*; do perl ./_generate.pl $file resources > dist/$file; done;