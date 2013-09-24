#!/bin/sh

./generatePvcBundle.sh
./generateJsDocs.sh
./generateSite.sh

rsync -rovz dist/site/ctools/charts/ demo.webdetails.org:/var/www/www.webdetails.pt/htdocs/ctools/charts/