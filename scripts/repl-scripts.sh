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

# Run script from base dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";cd $DIR; cd ..

if [ -z "$BASH_VERSION" ]
then
    exec bash "$0"
fi

# combine def, cdo and ccc files
cat scripts/def-bundle-files.txt scripts/cdo-bundle-files.txt scripts/ccc-bundle-files.txt > all-bundle-files.txt

# create one .out file per html
for file in examples/*.html; do perl ./scripts/repl-scripts.pl $file all-bundle-files.txt > $file.out; done;

# move .out files into .html files
for file in examples/*.out; do mv $file ${file/%.html.out/.html}; done;

rm all-bundle-files.txt