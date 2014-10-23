#!/bin/sh

perl ./build-scripts-config.pl def-bundle-files.txt > def-bundle-files.js;
perl ./build-scripts-config.pl cdo-bundle-files.txt > cdo-bundle-files.js;
perl ./build-scripts-config.pl ccc-bundle-files.txt > ccc-bundle-files.js;
