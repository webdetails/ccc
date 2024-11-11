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
# Change Date: 2029-07-20
# ******************************************************************************
# Run script from script dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";cd $DIR;

mkdir -p ../target/bundle-files

perl ./build-scripts-config.pl def-bundle-files.txt > ../target/bundle-files/def-bundle-files.js;
perl ./build-scripts-config.pl cdo-bundle-files.txt > ../target/bundle-files/cdo-bundle-files.js;
perl ./build-scripts-config.pl ccc-bundle-files.txt > ../target/bundle-files/ccc-bundle-files.js;
