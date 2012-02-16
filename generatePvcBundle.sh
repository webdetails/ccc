#!/bin/sh

VERSION="pvc-d1.0.js"
echo "//VERSION $@\n" > $VERSION

cat src/pvc/pvc.js src/pvc/pvcDatum.js src/pvc/pvcDataDimension.js src/pvc/pvcDataElement.js src/pvc/pvcDataTranslator.js src/pvc/pvcData.js src/pvc/pvcAbstract.js src/pvc/pvcBaseChart.js src/pvc/pvcBasePanel.js src/pvc/pvcTitlePanel.js src/pvc/pvcLegendPanel.js src/pvc/pvcTimeseriesAbstract.js src/pvc/pvcCategoricalAbstract.js src/pvc/pvcCategoricalAbstractPanel.js src/pvc/pvcAxisPanel.js src/pvc/pvcPieChart.js src/pvc/pvcBarChart.js src/pvc/pvcNormalizedBarChart.js src/pvc/pvcLine.js src/pvc/pvcHeatGridChart.js  src/pvc/pvcMetricAbstract.js src/pvc/pvcMetricScatter.js src/pvc/pvcMetricLine.js src/pvc/pvcWaterfallChart.js src/pvc/pvcBulletChart.js src/pvc/pvcParallelCoordinates.js src/pvc/pvcDataTree.js src/pvc/pvcBoxplotChart.js >> $VERSION

