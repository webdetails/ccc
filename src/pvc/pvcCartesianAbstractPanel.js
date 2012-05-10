
pvc.CartesianAbstractPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    orientation: "vertical",
    stacked: false,
    
    /**
     * @override
     */
    _createCore: function() {
        // Send the panel behind the axis, title and legend, panels
        this.pvPanel.zOrder(-10);

        // Overflow
        var orthoAxis = this.chart.axes.ortho,
            baseAxis  = this.chart.axes.base;
        if (orthoAxis.options('FixedMin') != null ||
            orthoAxis.options('FixedMax') != null ||
            baseAxis .options('FixedMin') != null ||
            baseAxis .options('FixedMax') != null){
            this.pvPanel["overflow"]("hidden");
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend body
        this.extend(this.pvPanel, "chart_");
    },

    /* @override */
    isOrientationVertical: function(){
        return this.orientation == "vertical";
    },

    /* @override */
    isOrientationHorizontal: function(){
        return this.orientation == "horizontal";
    },

    /*
     * @override
     */
   _detectDatumsUnderRubberBand: function(datumsByKey, rb, keyArgs){
       var any = false,
           chart = this.chart,
           xAxisPanel = chart.xAxisPanel,
           yAxisPanel = chart.yAxisPanel,
           xDatumsByKey,
           yDatumsByKey;

       //1) x axis
       if(xAxisPanel){
           xDatumsByKey = {};
           if(!xAxisPanel._detectDatumsUnderRubberBand(xDatumsByKey, rb, keyArgs)) {
               xDatumsByKey = null;
           }
       }

       //2) y axis
       if(yAxisPanel){
           yDatumsByKey = {};
           if(!yAxisPanel._detectDatumsUnderRubberBand(yDatumsByKey, rb, keyArgs)) {
               yDatumsByKey = null;
           }
       }

       // Rubber band selects on both axes?
       if(xDatumsByKey && yDatumsByKey) {
           // Intersect datums

           def.eachOwn(yDatumsByKey, function(datum, key){
               if(def.hasOwn(xDatumsByKey, key)) {
                   datumsByKey[datum.key] = datum;
                   any = true;
               }
           });

           keyArgs.toggle = true;

       // Rubber band selects over any of the axes?
       } else if(xDatumsByKey) {
           def.copy(datumsByKey, xDatumsByKey);
           any = true;
       } else if(yDatumsByKey) {
           def.copy(datumsByKey, yDatumsByKey);
           any = true;
       } else {
           // Ask the base implementation for signums
           any = this.base(datumsByKey, rb, keyArgs);
       }

       return any;
   }
});