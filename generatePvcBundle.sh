#!/bin/sh

VERSION="pvc-d1.0.js"

cat src/pvc/pvc.js src/pvc/pvcPanel.js src/pvc/pvcLegend.js src/pvc/pvcTimeseriesAbstract.js src/pvc/pvcCategoricalAbstract.js src/pvc/pvcPie.js src/pvc/pvcBar.js src/pvc/pvcLine.js src/pvc/pvcData.js > $VERSION
