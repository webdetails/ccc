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

rm target/summary/*.html;

# -- Invoke XSLT
java -jar target/Saxon-HE-9.4.jar -xsl:doc/gen/summary/com2html-summary.xsl -s:doc/model/pvc.options.xml helpBaseUrl=jsdoc/symbols/ outBaseUrl=target/summary/
