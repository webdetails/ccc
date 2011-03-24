#!/bin/sh

VERSION="pvc-d1.0.js"

cat src/pvc/pvc.js src/pvc/pvcPanel.js src/pvc/pvcLegend.js src/pvc/pvcTimeseriesAbstract.js src/pvc/pvcCategoricalAbstract.js src/pvc/pvcPie.js src/pvc/pvcBar.js src/pvc/pvcLine.js src/pvc/pvcData.js src/pvc/pvcHeatGrid.js  src/pvc/pvcLinearAbstract.js src/pvc/pvcScatter.js src/pvc/pvcLLine.js > $VERSION


#-rw-r--r-- 1 cees cees 17011 2011-03-23 20:20 src/pvc/pvcLinearAbstract.js
#-rw-r--r-- 1 cees cees  9243 2011-03-21 19:47 src/pvc/pvcLine.js
#-rw-r--r-- 1 cees cees  2879 2011-03-23 17:26 src/pvc/pvcLLine.js
#-rw-r--r-- 1 cees cees 14036 2011-03-17 17:32 src/pvc/pvcPanel.js
#-rw-r--r-- 1 cees cees  4980 2011-03-17 17:32 src/pvc/pvcPie.js
#-rw-r--r-- 1 cees cees  8121 2011-03-23 19:33 src/pvc/pvcScatter.js

