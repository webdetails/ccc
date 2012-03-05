
/**
 * AxisPanel panel.
 */
pvc.AxisPanel = pvc.BasePanel.extend({

    _parent: null,
    
    pvRule:     null,
    pvTicks:    null,
    pvLabel:    null,
    pvRuleGrid: null,
    pvEndLine:  null,
    pvScale:    null,
    
    ordinal: false,
    ordinalDimensionName: null, // To be used in ordinal scales
    anchor: "bottom",
    axisSize: undefined,
    tickLength: 6,
    tickColor: "#aaa",
    panelName: "axis", // override
    scale: null,
    fullGrid: false,
    endLine:  false,
    font: '10px sans-serif', // label font
    titleFont: '12px sans-serif',
    title: undefined,
    titleSize: 0,

    // To be used in linear scales
    domainRoundMode: 'none',
    desiredTickCount: null,
    minorTicks:       true,
    
    clickAction: null,
    doubleClickAction: null,

    constructor: function(chart, options){
        
        this.base(chart,options);

        this._calcLayout();
    },

    _calcLayout: function(){

        var titleSize = 0;

        if(this.title){
            titleSize = Math.ceil(
                            pvc.text.getTextHeight(this.title, this.titleFont)
                            *
                            pvc.goldenRatio);

            if(this.titleSize > titleSize){
                titleSize = this.titleSize;
            }

            if(this.axisSize  != null &&
               this.titleSize != null &&
               titleSize > this.axisSize){
                pvc.log("WARNING: Inconsistent options '" +
                            this.panelName + "TitleSize: " +  JSON.stringify(this.titleSize) +
                            this.panelName + "Size: " +  JSON.stringify(this.axisSize));

               titleSize = this.axisSize;
            }
        }

        this.titleSize = titleSize;

        if(this.axisSize == null){
            this.axisSize = this.titleSize + 50;
        }
    },

    create: function(){

        this.setAnchoredSize(this.axisSize);
        
        this.base();
        
        // ??
        this.extend(this.pvScale, this.panelName + "Scale_");
        
        this.renderAxis();
    },

    /**
     * @override
     */
    applyExtensions: function(){
        
        this.base();

        this.extend(this.pvPanel,      this.panelName + "_"     );
        this.extend(this.pvRule,       this.panelName + "Rule_" );
        this.extend(this.pvTicks,      this.panelName + "Ticks_");
        this.extend(this.pvLabel,      this.panelName + "Label_");
        this.extend(this.pvRuleGrid,   this.panelName + "Grid_" );
        this.extend(this.pvTitle,      this.panelName + "TitleLabel_");
        this.extend(this.pvEndLine,    this.panelName + "EndLine_");
        this.extend(this.pvMinorTicks, this.panelName + "MinorTicks_");
    },

    setScale: function(scale){
        this.pvScale = scale;
        this.scale = scale; // TODO: At least HeatGrid depends on this. Maybe Remove?
    },
    
    /**
     * Initializes a new layer panel.
     * @override
     */
    initLayerPanel: function(pvPanel, layer){
        if(layer === 'gridLines'){
            pvPanel.zOrder(-10);
        }
    },
    
    renderAxis: function(){
        // Z-Order
        // ==============
        // -10 - grid lines   (on 'gridLines' background panel)
        //   0 - content (specific chart types should render content on this zOrder)
        //  10 - end line     (on main foreground panel)
        //  20 - ticks        (on main foreground panel)
        //  30 - ruler (begin line) (on main foreground panel)
        //  40 - labels       (on main foreground panel)
        
        // Range
        var rMin  = this.pvScale.min,
            rMax  = this.pvScale.max,
            rSize = rMax - rMin,
            ruleParentPanel = this.pvPanel;

        if(this.title){
           this.pvTitlePanel = this.pvPanel.add(pv.Panel)
                [this.anchor             ](0)     // bottom (of the axis panel)
                [this.anchorOrthoLength()](this.titleSize) // height
                [this.anchorOrtho()      ](rMin)  // left
                [this.anchorLength()     ](rSize) // width
                ;

            this.pvTitle = this.pvTitlePanel.anchor('center').add(pv.Label)
                .lock('text', this.title)
                .lock('font', this.titleFont)

                // Rotate text over center point
                .lock('textAngle',
                    this.anchor === 'left'  ? -Math.PI/2 :
                    this.anchor === 'right' ?  Math.PI/2 :
                    null)
                ;

            // Create a container panel to draw the remaining axis components
            ruleParentPanel = this.pvPanel.add(pv.Panel)
                [this.anchorOpposite()   ](0) // top (of the axis panel)
                [this.anchorOrthoLength()](this.axisSize - this.titleSize) // height
                [this.anchorOrtho()      ](0)     // left
                [this.anchorLength()     ](rSize) // width
                ;
        }

        this.pvRule = ruleParentPanel.add(pv.Rule)
            .zOrder(30) // see pvc.js
            .strokeStyle('black')
            // ex: anchor = bottom
            [this.anchorOpposite()](0)     // top    (of the axis panel)
            [this.anchorLength()  ](rSize) // width  
            [this.anchorOrtho()   ](rMin); // left


        if(this.endLine){
            var anchorOrthoLength = this.anchorOrthoLength(),
                ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
        	this.pvEndLine = this.pvRule.add(pv.Rule)
                    .zOrder(10)
                    .visible(true) // break inheritance of pvRule's visible property
                    .strokeStyle("#f0f0f0")
                    [this.anchorOpposite()](-ruleLength)
                    [this.anchorLength()  ](null)
                    [this.anchorOrtho()   ](rMax)
                    [anchorOrthoLength    ]( ruleLength);
        }
         
        if (this.ordinal){
            if(this.useCompositeAxis){
                this.renderCompositeOrdinalAxis();
            } else {
                this.renderOrdinalAxis();
            }
        } else {
            this.renderLinearAxis();
        }
    },
    
    renderOrdinalAxis: function(){

        var scale = this.pvScale,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            ordinalDimension  = this.chart.dataEngine.getDimension(this.ordinalDimensionName),
            ticks =  ordinalDimension.getVisibleElements();
        
        // Ordinal ticks correspond to ordinal datums.
        // Ordinal ticks are drawn at the center of each band,
        //  and not at the beginning, as in a linear axis.
        this.pvTicks = this.pvRule.add(pv.Rule)
            .zOrder(20) // see pvc.js
            .data(ticks)
            //[anchorOpposite   ](0)
            [anchorLength     ](null)
            [anchorOrtho      ](function(e){
                return scale(e.value) + (scale.range().band / 2);
            })
            [anchorOrthoLength](this.tickLength)
            .strokeStyle('rgba(0,0,0,0)'); // Transparent by default, but extensible

        var align = this.isAnchorTopOrBottom() 
                    ? "center"
                    : (this.anchor == "left") ? "right" : "left";
        
        // All ordinal labels are relevant and must be visible
        this.pvLabel = this.pvTicks.anchor(this.anchor).add(pv.Label)
            .zOrder(40) // see pvc.js
            .textAlign(align)
            //.textBaseline("middle")
            .text(function(e){return e.label;})
            .font("9px sans-serif");
        
        if(this.fullGrid){
            // Grid rules are visible on all ticks,
            //  but on the first tick. 
            // The 1st tick is not shown.
            // The 2nd tick separates categ 1 from categ 2.
            // The Nth tick separates categ. N-1 from categ. N
            // No grid line is drawn at the end.
            var ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                .extend(this.pvRule)
                .data(ticks)
                .strokeStyle("#f0f0f0")
                [anchorOpposite   ](-ruleLength)
                [anchorLength     ](null)
                [anchorOrtho      ](function(e){
                    return scale(e.value) - scale.range().margin / 2;
                })
                [anchorOrthoLength]( ruleLength)
                .visible(function(){return (this.index > 0);});
        }
    },

    renderLinearAxis: function(){
        // NOTE: Includes time series, 
        // so "d" may be a number or a Date object...
        
        var scale  = this.pvScale,
            ticks  = pvc.scaleTicks(
                        scale, 
                        this.domainRoundMode === 'tick', 
                        this.desiredTickCount),
            anchorOpposite    = this.anchorOpposite(),    
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            tickStep = Math.abs(ticks[1] - ticks[0]); // ticks.length >= 2
                
        // (MAJOR) ticks
        var pvTicks = this.pvTicks = this.pvRule.add(pv.Rule)
            .zOrder(20)
            .data(ticks)
            // [anchorOpposite ](0) // Inherited from pvRule
            [anchorLength     ](null)
            [anchorOrtho      ](scale)
            [anchorOrthoLength](this.tickLength);
            // Inherit axis color
            //.strokeStyle('black'); // control visibility through color or through .visible
        
        // MINOR ticks are between major scale ticks
        if(this.minorTicks){
            this.pvMinorTicks = this.pvTicks.add(pv.Rule)
                .zOrder(20) // not inherited
                //.data(ticks)  // ~ inherited
                //[anchorOpposite   ](0)   // Inherited from pvRule
                //[anchorLength     ](null)  // Inherited from pvTicks
                [anchorOrtho      ](function(d){ 
                    return scale((+d) + (tickStep / 2)); // NOTE: (+d) converts Dates to numbers, just like d.getTime()
                })
                [anchorOrthoLength](this.tickLength / 2)
                .visible(function(){
                    return (!pvTicks.scene || pvTicks.scene[this.index].visible) &&
                           (this.index < ticks.length - 1); 
                });
        }
        
        this.renderLinearAxisLabel(ticks);
        
        // Now do the full grids
        if(this.fullGrid){
            // Grid rules are visible (only) on MAJOR ticks.
            // When EndLine is active it is drawn above the last grid line.
            var ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                .extend(this.pvRule)
            	.data(ticks)
                .strokeStyle("#f0f0f0")
                [anchorOpposite   ](-ruleLength)
                [anchorLength     ](null)
                [anchorOrtho      ](scale)
                [anchorOrthoLength]( ruleLength);
        }
    },
    
    renderLinearAxisLabel: function(ticks){
        // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        //  with their H/V alignment so that
        //  the label is not drawn off the chart.

        // Use this margin instead of textMargin, 
        // which affects all margins (left, right, top and bottom).
        // Exception is the small 0.5 textMargin set below....
        var labelAnchor = this.pvTicks.anchor(this.anchor)
                                .addMargin(this.anchorOpposite(), 2);
        
        var label = this.pvLabel = labelAnchor.add(pv.Label)
            .zOrder(40)
            .text(this.pvScale.tickFormat)
            .font("9px sans-serif")
            .textMargin(0.5) // Just enough for some labels not to be cut (vertical)
            .visible(true);
        
        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()){
            label.textAlign(function(){
                var absLeft;
                if(this.index === 0){
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft <= 0){
                        return 'left'; // the "left" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft >= rootPanel.width()){
                        return 'right'; // the "right" of the text is anchored to the tick's anchor
                    }
                }
                return 'center';
            });
        } else {
            label.textBaseline(function(){
                var absTop;
                if(this.index === 0){
                    absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop >= rootPanel.height()){
                        return 'bottom'; // the "bottom" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop <= 0){
                        return 'top'; // the "top" of the text is anchored to the tick's anchor
                    }
                }
                
                return 'middle';
            });
        }
    },

    // ----------------------------
    // Click / Double-click
    _handleDoubleClick: function(d, ev){
        if(!d){
            return;
        }
        
        var action = this.doubleClickAction;
        if(action){
            this._ignoreClicks = 2;

            action.call(null, d, ev);
        }
    },

    _shouldHandleClick: function(){
        var options = this.chart.options;
        return options.selectable || (options.clickable && this.clickAction);
    },

    _handleClick: function(d, ev){
        if(!d || !this._shouldHandleClick()){
            return;
        }

        // Selection
        
        if(!this.doubleClickAction){
            this._handleClickCore(d, ev);
        } else {
            // Delay click evaluation so that
            // it may be canceled if double click meanwhile
            // fires.
            var myself  = this,
                options = this.chart.options;
            window.setTimeout(
                function(){
                    myself._handleClickCore.call(myself, d, ev);
                },
                options.doubleClickMaxDelay || 300);
        }
    },

    _handleClickCore: function(d, ev){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
            return;
        }

        // Classic clickAction
        var action = this.clickAction;
        if(action){
            action.call(null, d, ev);
        }

        // TODO: should this be cancellable by the click action?
        var options = this.chart.options;
        if(options.selectable && this.ordinal){
            var toggle = options.ctrlSelectMode && !ev.ctrlKey;
            this._selectOrdinalElement(d, toggle);
        }
    },

    _selectOrdinalElement: function(element, toggle){
        var dataEngine = this.chart.dataEngine;

        var dimClause = {};
        dimClause[this.ordinalDimensionName] = [element.path];
        var selectedData = dataEngine.getWhere([dimClause]);

        if(toggle){
            dataEngine.clearSelections();
        }
        
        dataEngine.toggleSelections(selectedData);

        this.chart.categoricalPanel._handleSelectionChanged();
    },

    /////////////////////////////////////////////////
    //begin: composite axis
    
    getLayoutSingleCluster: function(elements, orientation, maxDepth){
        
        var depthLength = this.axisSize - this.titleSize;

        // displace to take out bogus-root
        maxDepth++;
        var baseDisplacement = depthLength / maxDepth;
        var margin = maxDepth > 2 ? ((1/12) * depthLength) : 0;//heuristic compensation
        baseDisplacement -= margin;
        
        var scaleFactor = maxDepth / (maxDepth - 1);
        var orthogonalLength = pvc.BasePanel.orthogonalLength[orientation];
        //var dlen = (orthogonalLength == 'width')? 'dx' : 'dy';
        
        var displacement = (orthogonalLength == 'width')?
                ((orientation == 'left')? [-baseDisplacement, 0] : [baseDisplacement, 0]) :
                ((orientation == 'top')?  [0, -baseDisplacement] : [0, baseDisplacement]);

        // Store without compensation for lasso handling
        this.axisDisplacement = displacement.slice(0);

        for(var i=0;i<this.axisDisplacement.length;i++){
            var ad = this.axisDisplacement[i];
            if(ad < 0){
                ad -= margin;
            } else if(ad > 0){
                ad = 0 ;
            }

            this.axisDisplacement[i] = ad * scaleFactor;
        }
        
        this.pvRule
            .strokeStyle(null)
            .lineWidth(0);

        var panel = this.pvRule
                        .add(pv.Panel)
                            [orthogonalLength](depthLength)//.overflow('hidden')
                            .strokeStyle(null)
                            .lineWidth(0) //cropping panel
                        .add(pv.Panel)
                            [orthogonalLength](depthLength * scaleFactor)
                            .strokeStyle(null)
                            .lineWidth(0);// panel resized and shifted to make bogus root disappear

        panel.transform(pv.Transform.identity.translate(displacement[0], displacement[1]));
        
        // Create with bogus-root
        // pv.Hierarchy must always have exactly one root and
        //  at least one element besides the root
        var layout = panel.add(pv.Layout.Cluster.Fill)
            .nodes(elements)
            .orient(orientation);
            
        // keep node references for lasso selection
        this.storedElements = elements;
        
        return layout;
    },
    
    getBreadthCounters: function(elements){
       var breadthCounters = {};
       for(var i =0; i<elements.length; i++){
            var name = elements[i][0];
            if(!breadthCounters[name]){
                breadthCounters[name] = 1;
            }
            else {
                breadthCounters[name] = breadthCounters[name] + 1;
            }
        }
        return breadthCounters;
    },
    
    getAreaSelections: function(x, y, dx, dy){
        
        var selections = [];
        
        if(!this.useCompositeAxis){
            return selections;
        }
        
        x-= this.axisDisplacement[0];
        y-= this.axisDisplacement[1];
        
        var xf = x + dx,
            yf = y + dy;
            
        this.storedElements[0].visitBefore(function(node, i){
            if(i > 0){
                var centerX = node.x + node.dx /2,
                    centerY = node.y + node.dy /2;
            
                if(x < centerX && centerX < xf && 
                   y < centerY && centerY < yf){
                    selections.push(node.path);
                }
           }
        });
        
        // Remove selections following an ascendant selection
        var lastSelection = null;
        var compressedSelections = [];
        for(var i = 0 ; i < selections.length ; i++){
            var selection = selections[i];
            if(lastSelection == null || !pvc.arrayStartsWith(selection, lastSelection)){
                lastSelection = selection;
                compressedSelections.push(selection);
            }
        }
        
        return compressedSelections;
    },


    renderCompositeOrdinalAxis: function(){
        var myself = this,
            chart = this.chart;

        var isTopOrBottom = this.isAnchorTopOrBottom(),
            axisDirection = isTopOrBottom ? 'h' : 'v';
        
        var ordinalDimension = chart.dataEngine.getDimension(this.ordinalDimensionName),
            // TODO: extend this to work with chart.orientation?
            reverse  = this.anchor == 'bottom' || this.anchor == 'left',
            treeInfo = ordinalDimension.createElementsTree(true, reverse),
            maxDepth = treeInfo.maxDepth,
            elements = treeInfo.root.nodes(); // descendantOrSelf, pre-order traversal, copy

        var tipsyGravity = 's';
        switch(this.anchor){
            case 'bottom':
                tipsyGravity = 's';
                break;
            case 'top':
                tipsyGravity = 'n';
                break;
            case 'left':
                tipsyGravity = 'w';
                break;
            case 'right':
                tipsyGravity = 'e';
                break;
        }

        var layout = this.getLayoutSingleCluster(elements, this.anchor, maxDepth);

        var diagDepthCutoff = 2; //depth in [-1/(n+1), 1]
        var vertDepthCutoff = 2;

        // See what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(d, e, f){
                // Just iterate and get cutoff
                var fitInfo = pvc.text.getFitInfo(d.dx, d.dy, d.label, myself.font, diagMargin);
                if(!fitInfo.h){
                    if(axisDirection == 'v' && fitInfo.v){ // prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    } else {
                        diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                }

                this.fitInfo(fitInfo);

                return d.dy;
            });

        // label space (left transparent)
        // var lblBar =
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle(function(d){
                if(d.maxDepth == 1 || d.maxDepth == 0) { // 0, 0.5, 1
                    return null;
                }

                return "rgba(127,127,127,0.3)"; //non-terminal items, so grouping is visible
            })
            .lineWidth( function(d){
                if(d.maxDepth == 1 || d.maxDepth == 0) {
                    return 0;
                }
                return 0.5; //non-terminal items, so grouping is visible
            })
            .text(function(d){
                return d.label;
            });

        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30;
        var V_CUTOFF_ANG = 1.27;
        //var V_CUTOFF_RATIO = 0.8;
        var diagMargin = pvc.text.getFontSize(this.font) / 2;

        var align = isTopOrBottom ?
                    "center" :
                    (this.anchor == "left") ? "right" : "left";

        //draw labels and make them fit
        this.pvLabel = layout.label.add(pv.Label)
            .def('lblDirection','h')
            .textAngle(function(d){
                if(d.depth >= vertDepthCutoff && d.depth < diagDepthCutoff){
                    this.lblDirection('v');
                    return -Math.PI/2;
                }

                if(d.depth >= diagDepthCutoff){
                    var tan = d.dy/d.dx;
                    var angle = Math.atan(tan);
                    //var hip = Math.sqrt(d.dy*d.dy + d.dx*d.dx);

                    if(angle > V_CUTOFF_ANG){
                        this.lblDirection('v');
                        return -Math.PI/2;
                    }

                    if(angle > H_CUTOFF_ANG) {
                        this.lblDirection('d');
                        return -angle;
                    }
                }

                this.lblDirection('h');
                return 0;//horizontal
            })
            .textMargin(1)
            //override central alignment for horizontal text in vertical axis
            .textAlign(function(d){
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)? 'center' : align;
            })
            .left(function(d) {
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)?
                     d.x + d.dx/2 :
                     ((align == 'right')? d.x + d.dx : d.x);
            })
            .font(myself.font)
            .text(function(d){
                var fitInfo = this.fitInfo();
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){//TODO: fallback option for no svg
                            return pvc.text.trimToWidth(d.dx, d.label, myself.font, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return pvc.text.trimToWidth(d.dy, d.label, myself.font, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                          //var ang = Math.atan(d.dy/d.dx);
                          var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx) ;
                          return pvc.text.trimToWidth(diagonalLength - diagMargin, d.label, myself.font,'..');
                        }
                        break;
                }
                return d.label;
            })
            .cursor('default')
            .events('all'); //labels don't have events by default

        if(this._shouldHandleClick()){
            this.pvLabel
                .cursor("pointer")
                .event('click', function(d){
                    var ev = arguments[arguments.length - 1];
                    return myself._handleClick(d, ev);
                });
        }

        if(this.doubleClickAction){
            this.pvLabel
                .cursor("pointer")
                .event("dblclick", function(d){
                    var ev = arguments[arguments.length - 1];
                    myself._handleDoubleClick(d, ev);
                });
        }

        // tooltip
        this.pvLabel
            //.def('tooltip', '')
            .title(function(d){
                this.instance()['tooltip'] = d.label;
                return '';
            })
            .event("mouseover", pv.Behavior.tipsy({//Tooltip
                gravity: tipsyGravity,
                fade: true,
                offset: diagMargin * 2,
                opacity:1
            }));
    }
    // end: composite axis
    /////////////////////////////////////////////////
});

/*
 * XAxisPanel panel.
 *
 */
pvc.XAxisPanel = pvc.AxisPanel.extend({

    anchor: "bottom",
    panelName: "xAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});

/*
 * SecondXAxisPanel panel.
 *
 */
pvc.SecondXAxisPanel = pvc.XAxisPanel.extend({

    panelName: "secondXAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});


/*
 * YAxisPanel panel.
 *
 */
pvc.YAxisPanel = pvc.AxisPanel.extend({

    anchor: "left",
    panelName: "yAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});

/*
 * SecondYAxisPanel panel.
 *
 */
pvc.SecondYAxisPanel = pvc.YAxisPanel.extend({

    panelName: "secondYAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});
