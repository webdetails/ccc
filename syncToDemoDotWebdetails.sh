#!/bin/sh

ant dist
./generateJsDocs.sh
./generateSite.sh

rsync -rovz dist/site/ctools/ccc/charts/ demo.webdetails.org:/var/www/www.webdetails.pt/htdocs/ctools/ccc/charts/