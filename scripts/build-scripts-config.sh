#!/bin/sh
# Run script from script dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";cd $DIR;

mkdir -p ../target/bundle-files

perl ./build-scripts-config.pl def-bundle-files.txt > ../target/bundle-files/def-bundle-files.js;
perl ./build-scripts-config.pl cdo-bundle-files.txt > ../target/bundle-files/cdo-bundle-files.js;
perl ./build-scripts-config.pl ccc-bundle-files.txt > ../target/bundle-files/ccc-bundle-files.js;
