#!/bin/sh

VERSION="pvc-d1.0.js"

cat src/pvc/pvc.js src/pvc/pvcPanel.js src/pvc/pvcLegend.js src/pvc/pvcTimeseriesAbstract.js src/pvc/pvcCategoricalAbstract.js src/pvc/pvcPie.js src/pvc/pvcBar.js src/pvc/pvcLine.js src/pvc/pvcData.js src/pvc/pvcHeatGrid.js  src/pvc/pvcMetricAbstract.js src/pvc/pvcMetricScatter.js src/pvc/pvcMetricLine.js src/pvc/pvcWaterfall.js > $VERSION



