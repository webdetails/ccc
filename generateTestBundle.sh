#!/bin/sh

rm -rf dist/test/
mkdir dist/test/
mkdir dist/test/lib/

cp src/cdf/jquery.js dist/test/lib/

./generateDefBundle.sh
