
/**
 * MetricAbstract is the base class for all chart types that have
 * a two linear axis.
 * If the base-axis is a categorical axis you should use categoricalAbstract.
 * 
 * If you have issues with this class please contact CvK at cde@vinzi.nl 
 */
pvc.MetricAbstract = pvc.CategoricalAbstract.extend({

    constructor: function(options){
        this.base(options);

        // This categorical chart does not support selection, yet
        this.options.selectable = false;
    },

    /* @override */
    preRender: function(){
        this.base();
        
        pvc.log("Prerendering in MetricAbstract");
    },

    /*
    * Indicates if x-axis (horizontal axis) is an ordinal scale
    */
    // CvK: if we move ordinal-ordinal to a separate class this functions
    // can be probably be thrown out as it becomes identical to the
    // parent function.
    isXAxisOrdinal: function(){
        return this.options.orthoAxisOrdinal && !this.isOrientationVertical();
    },

    /*
     * Indicates if y-axis (vertical axis) is an ordinal scale
     */
    // CvK: if we move ordinal-ordinal to a separate class this functions
    // can be probably be thrown out as it becomes identical to the
    // parent fucntion.
    isYAxisOrdinal: function(){
        return this.options.orthoAxisOrdinal && this.isOrientationVertical();
    },

    /**
     * Scale for a linear base axis.
     * xx if orientation is horizontal, yy otherwise.
     *
     * Keyword arguments:
     *   bypassAxisSize:   boolean, default is false
     */
    getLinearBaseScale: function(keyArgs){
        var bypassAxisSize = pvc.get(keyArgs, 'bypassAxisSize', false),
            yAxisSize = this._getAxisSize(bypassAxisSize, 'y'),
            xAxisSize = this._getAxisSize(bypassAxisSize, 'x');

        var isVertical = this.options.orientation=="vertical";

        // compute the input-domain of the scale
        var domainMin = this.dataEngine.getCategoryMin();
        var domainMax = this.dataEngine.getCategoryMax();
        // Adding a small relative offset to the scale to prevent that
        // points are located on top of the axis:
        var offset = (domainMax - domainMin) * this.options.axisOffset;
        domainMin -= offset;
        domainMax += offset;

        // compute the output-range
        var rangeMin, rangeMax;
        if (isVertical) {
          rangeMin = yAxisSize;
          rangeMax = this.basePanel.width;
        } else {
          rangeMin = 0;
          rangeMax = this.basePanel.height - xAxisSize;
        }

        // create the (linear) Scale
        var scale = new pv.Scale.linear()
                      .domain(domainMin, domainMax)
                      .range(rangeMin, rangeMax);

        scale.min = rangeMin;
        scale.max = rangeMax;

        return scale;
    },

    /*
     * get the scale for the axis with horizontal orientation
     */
    getXScale: function(){
        var scale = null;

        if (this.isOrientationVertical()) {
            scale = this.options.timeSeries  ?
                    this.getTimeseriesScale()     :
                    this.getLinearBaseScale();   // linear is the default
        } else {
            scale = this.getLinearScale();
        } 

        return scale;
    },

    /*
     * get the scale for the axis with the vertical orientation.
     */
    getYScale: function(){
        var scale = null;
        if (this.isOrientationVertical()) {
            scale = this.getLinearScale();
        } else {
            scale = this.options.timeSeries  ?
                this.getTimeseriesScale()     :
                this.getLinearBaseScale();
        }

        return scale;
      }
});