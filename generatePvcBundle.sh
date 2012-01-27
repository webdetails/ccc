#!/bin/sh

VERSION="pvc-d1.0.js"
TODAY=$(date "+//VERSION TRUNK-%Y%m%d\n")
echo $TODAY > $VERSION

cat src/pvc/pvc.js src/pvc/pvcDatum.js src/pvc/pvcDataDimension.js src/pvc/pvcDataTranslator.js src/pvc/pvcData.js src/pvc/pvcPanel.js src/pvc/pvcLegend.js src/pvc/pvcTimeseriesAbstract.js src/pvc/pvcCategoricalAbstract.js src/pvc/pvcPie.js src/pvc/pvcBar.js src/pvc/pvcLine.js src/pvc/pvcHeatGrid.js  src/pvc/pvcMetricAbstract.js src/pvc/pvcMetricScatter.js src/pvc/pvcMetricLine.js src/pvc/pvcWaterfall.js src/pvc/pvcBullet.js src/pvc/pvcParallelCoordinates.js src/pvc/pvcDataTree.js src/pvc/pvcBoxplot.js >> $VERSION