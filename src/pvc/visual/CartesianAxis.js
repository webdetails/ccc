def.scope(function(){

/**
 * Initializes a cartesian axis.
 * 
 * @name pvc.visual.CartesianAxis
 * 
 * @class Represents an axis for a role in a cartesian chart.
 * <p>
 * The main properties of an axis: {@link #type}, {@link #orientation} and relevant chart's properties 
 * are related as follows:
 * </p>
 * <pre>
 * axisType={base, ortho} = f(axisOrientation={x,y})
 * 
 *          Vertical   Horizontal   (chart orientation)
 *         +---------+-----------+
 *       x | base    |   ortho   |
 *         +---------+-----------+
 *       y | ortho   |   base    |
 *         +---------+-----------+
 * (axis orientation)
 * </pre>
 * 
 * @property {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @property {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @property {number} index The index of the axis within its type (0, 1, 2...).
 * @property {string} orientation The orientation of the axis. 
 * One of the values: 'x' or 'y', for horizontal and vertical axis orientations, respectively.
 * @property {string} orientatedId The id of the axis with respect to the orientation and the index of the axis ("").
 * @property {pvc.visual.Role} role The associated visual role.
 * @property {pv.Scale} scale The associated scale.
 *  
 * @constructor
 * @param {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {pvc.visual.Role || pvc.visual.Role[]} roles The associated visual role or roles.
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * @param {pv.Scale} scale The associated scale.
 */
def.type('pvc.visual.CartesianAxis')
.init(function(chart, type, index, roles, keyArgs){
    /*jshint expr:true */
    roles || def.fail.argumentRequired('roles');
    
    this.chart = chart;
    this.type  = type;
    this.index = index == null ? 0 : index;

    this.roles = def.array(roles);
    this.role  = this.roles[0];
    this.scaleType = groupingScaleType(this.role.grouping);

    // Role compatibility checks
    var L = this.roles.length;
    if(L > 1){
        var grouping = this.role.grouping, 
            i;
        if(this.scaleType === 'Discrete'){
            for(i = 1; i < L ; i++){
                if(grouping.id !== this.roles[i].grouping.id){
                    throw def.error.operationInvalid("Discrete roles on the same axis must have equal groupings.");
                }
            }
        } else {
            if(!grouping.firstDimension.type.isComparable){
                throw def.error.operationInvalid("Continuous roles on the same axis must have comparable groupings.");
            }

            for(i = 1; i < L ; i++){
                if(this.scaleType !== groupingScaleType(this.roles[i].grouping)){
                    throw def.error.operationInvalid("Continuous roles on the same axis must have equal scales of the same type.");
                }
            }
        }
    }

    this.scale = def.get(keyArgs, 'scale');
    
    // ------------
    
    var options = chart.options;
    
    this.id = $VCA.getId(this.type, this.index);
    
    this.orientation = $VCA.getOrientation(this.type, options.orientation);
    this.orientedId  = $VCA.getOrientedId(this.orientation, this.index);
    this.optionsId   = $VCA.getOptionsId(this.orientation, this.index);
    
    this.upperOrientedId = def.firstUpperCase(this.orientedId);
    
    if(this.index !== 1) {
        this.isVisible = options['show' + this.upperOrientedId + 'Scale'];
    } else {
        this.isVisible = !!options.secondAxisIndependentScale; // options.secondAxis is already true or wouldn't be here
    }
})
.add(/** @lends pvc.visual.CartesianAxis# */{
    
    setScale: function(scale){
        this.scale = scale;
    },
    
    /**
     * Determines the type of scale required by the cartesian axis.
     * The scale types are 'Discrete', 'Timeseries' and 'Continuous'.
     * 
     * @type string
     */
    scaleType: function(){
        return groupingScaleType(this.role.grouping);
    },
    
    /**
     * Obtains a scene-scale function to compute values of this axis' main role.
     * 
     * @type function
     */
    sceneScale: function(){
        var roleName = this.role.name,
            grouping = this.role.grouping;

        if(grouping.isSingleDimension && grouping.firstDimension.type.valueType === Number){
            return this.scale.by(function(scene){
                return scene.acts[roleName].value || 0; // null -> 0
            });
        }

        return this.scale.by(function(scene){
            return scene.acts[roleName].value;
        });
    },
    
    /**
     * Obtains the value of an axis option, given its name.
     * <p>
     * Always tries to obtain the option value using the "Bare Id" option name format.
     * If it is not specified using such a name, 
     * then logic that depends on each option is applied to obtain the option's value.
     * </p>
     * 
     * @param {string} name The option name.
     * @type string
     */
    option: function(name){
        /* Custom option handler */
        var handler = axisOptionHandlers[name];
        
        var value = coreOptions.call(this, handler, name);
        if(value != null && handler && handler.cast) {
            value = handler.cast.call(this, value);
        }
        
        return value;
    }
});

var $VCA = pvc.visual.CartesianAxis;

function coreOptions(handler, name) {
    var value;
    
    /* Custom option handler */
    if(handler && handler.resolve) {
        value = handler.resolve.call(this, name);
        if(value !== undefined) {
            return value;
        }
    }
 
    /* By Id  (baseAxis, orthoAxis, base2Axis, ortho2Axis, ...) */
    value = idOptions.call(this, name);
    if(value !== undefined) {
        return value;
    }
    
    /* By Options Id (xAxis, yAxis, secondAxis) */
    value = v1OptionIdOptions.call(this, name);
    if(value !== undefined) {
        return value;
    }
    
    /* Custom option post handler */
    if(handler && handler.resolvePost) {
        value = handler.resolvePost.call(this, name);
        if(value !== undefined) {
            return value;
        }
    }

    /* Common (axis) */
    value = commonOptions.call(this, name);

    return value;
}

/**
 * Obtains the type of the axis given an axis orientation and a chart orientation.
 * 
 * @param {string} axisOrientation The orientation of the axis. One of the values: 'x' or 'y'.
 * @param {string} chartOrientation The orientation of the chart. One of the values: 'horizontal' or 'vertical'.
 * 
 * @type string
$VCA.getTypeFromOrientation = function(axisOrientation, chartOrientation){
    return ((axisOrientation === 'x') === (chartOrientation === 'vertical')) ? 'base' : 'ortho';  // NXOR
};
 */

/**
 * Obtains the orientation of the axis given an axis type and a chart orientation.
 * 
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {string} chartOrientation The orientation of the chart. One of the values: 'horizontal' or 'vertical'.
 * 
 * @type string
 */
$VCA.getOrientation = function(type, chartOrientation){
    return ((type === 'base') === (chartOrientation === 'vertical')) ? 'x' : 'y';  // NXOR
};

/**
 * Calculates the oriented id of an axis given its orientation and index.
 * @param {string} orientation The orientation of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
$VCA.getOrientedId = function(orientation, index){
    switch(index) {
        case 0: return orientation; // x, y
        case 1: return "second" + orientation.toUpperCase(); // secondX, secondY
    }
    
    return orientation + "" + (index + 1); // y3, x4,...
};

/**
 * Calculates the oriented id of an axis given its orientation and index.
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
$VCA.getId = function(type, index){
    if(index === 0) {
        return type; // base, ortho
    }
    
    return type + "" + (index + 1); // base2, ortho3,...
};

/**
 * Calculates the options id of an axis given its orientation and index.
 * 
 * @param {string} orientation The orientation of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
$VCA.getOptionsId = function(orientation, index){
    switch(index) {
        case 0: return orientation; // x, y
        case 1: return "second"; // second
    }
    
    return orientation + "" + (index + 1); // y3, x4,...
};

$VCA.createAllDefaultOptions = function(options){
    var types   = ['base', 'ortho'],
        indexes = [0, 1],
        orientations = ['x', 'y'],
        optionNames = [
            'Position',
            'Size',
            'FullGrid',
            'FullGridCrossesMargin',
            'RuleCrossesMargin',
            'EndLine',
            'DomainRoundMode',
            'DesiredTickCount',
            'MinorTicks',
            'ClickAction',
            'DoubleClickAction',
            'Title',
            'TitleSize',
            'LabelFont',
            'TitleFont',
            'OriginIsZero',
            'Offset',
            'FixedMin',
            'FixedMax',
            'OverlappedLabelsHide',
            'OverlappedLabelsMaxPct',
            'Composite',
            'ZeroLine'
       ],
       globalDefaults = {
           'OriginIsZero':      true,
           'Offset':            0,
           'Composite':         false,
           'OverlappedLabelsHide': false,
           'OverlappedLabelsMaxPct': 0.2,
           'LabelFont':         '9px sans-serif',
           'TitleFont':         '12px sans-serif', // 'bold '
           'MinorTicks':        true,
           'FullGrid':          false,
           'FullGridCrossesMargin': true,
           'RuleCrossesMargin': true,
           'EndLine':           false,
           'DomainRoundMode':   'none',
           'ZeroLine':          true
       };

    function addOption(optionId, value){
        if(!(optionId in options)){
            options[optionId] = value;
        }
    }
    
    optionNames.forEach(function(name){
        indexes.forEach(function(index){
            /* id options */
            types.forEach(function(type){
                addOption($VCA.getId(type, index) + "Axis" + name);
            });

            /* by optionsId */
            orientations.forEach(function(orientation){
                addOption($VCA.getOptionsId(orientation, index) + 'Axis' + name);
            });
        });

        /* common options */
        addOption('axis' + name, globalDefaults[name]);
    });

    return options;
};

/* PRIVATE STUFF */
var axisOptionHandlers = {
    /*
     * 1     <- useCompositeAxis
     * >= 2  <- false
     */
    Composite: {
        resolve: function(){
            /* Only first axis can be composite? */
            if(this.index > 0) {
                return false;
            }
            
            return finalOptions.call(this, 'useCompositeAxis');
        },
        cast: Boolean
    },
    
    /* xAxisSize,
     * secondAxisSize || xAxisSize 
     */
    Size: {
        resolve:  function(name){
            var value = v1OptionIdOptions.call(this, name);
            if(!value && this.index > 0) {
                // Default to the size of the first axis of same orientation
                value = firstOptions.call(this, name);
            }
            
            return value;
        },
        cast: Number2
    },
    
    /* xAxisPosition,
     * secondAxisPosition <- opposite(xAxisPosition) 
     */
    Position: {
        resolve: function(name){
            if(this.index > 0) {
                // Use the position opposite to that of the first axis of same orientation
                var firstPosition = firstOptions.call(this, name);
                return pvc.BasePanel.oppositeAnchor[firstPosition || 'left'];
            }
            
            return v1OptionIdOptions.call(this, name);
        }
    },
    
    /* orthoFixedMin, orthoFixedMax */
    FixedMin: {
        resolvePost: function(name){
            if(!this.index && this.type === 'ortho') {
                return bareIdOptions.call(this, name);
            }
        },
        cast: Number2
    },
    FixedMax: {
        resolvePost: function(name){
            if(!this.index && this.type === 'ortho') {
                return bareIdOptions.call(this, name);
            }
        },
        cast: Number2
    },
    
    /* 1 <- originIsZero
     * 2 <- secondAxisOriginIsZero
     */
    OriginIsZero:  {
        resolvePost: function(name){
            switch(this.index) {
                case 0: return finalOptions.call(this, 'originIsZero');
                case 1: return finalOptions.call(this, 'secondAxisOriginIsZero');
            }
        },
        cast: Boolean
    }, 
    
    /* 1 <- axisOffset, 
     * 2 <- secondAxisOffset, 
     */
    Offset:  {
        resolvePost: function(name){
            switch(this.index) {
                case 0: return finalOptions.call(this, 'axisOffset');
                case 1: return finalOptions.call(this, 'secondAxisOffset');
            }
        },
        
        cast: Number2
    },
    
    OverlappedLabelsHide: {cast: Boolean },
    OverlappedLabelsMaxPct: {cast: Number2 },
    FullGrid: {
        resolve: function(name){
            // TODO: is this too restrictive?
            if(this.index !== 0){
                return false;
            }
        },
        cast: Boolean
    },
    EndLine:  {cast: Boolean },
    DesiredTickCount: {cast: Number2 },
    MinorTicks: {cast: Number2 },
    TitleSize: {cast: Number2 },
    FullGridCrossesMargin: {cast: Boolean },
    RuleCrossesMargin: {cast: Boolean },
    ZeroLine: {cast: Boolean }
};

/**
 * Obtains the value of an option using a specified final name.
 * 
 * @name pvc.visual.CartesianAxis#_finalOptions
 * @function
 * @param {string} name The option name.
 * @private
 * @type string
 */
function finalOptions(name) {
    return this.chart.options[name];
}

/**
 * Obtains the value of an option using the V1 options id. format.
 * using {@link #_buildOptionsIdName}.
 * 
 * @name pvc.visual.CartesianAxis#_v1OptionIdOptions
 * @function
 * @param {string} name The option name.
 * @private
 * @type string
 */
function v1OptionIdOptions(name){
    return finalOptions.call(this, buildOptionsIdName.call(this, name)); 
}

function Number2(value) {
    if(value != null) {
        value = +value; // to number
        if(isNaN(value)) {
            value = null;
        }
    }
    return value;
}

/**
 * Obtains the value of an option that uses the axis id followed by "Axis" as a prefix
 * (ex. <tt>orthoAxisFixedMax</tt>, <tt>baseAxisFixedMin</tt>, <tt>ortho2AxisFixedMin</tt>).
 * 
 * @name pvc.visual.CartesianAxis#_idOptions
 * @function
 * @param {string} name The option name.
 * @private
 * @type string
 */
function idOptions(name){
    return finalOptions.call(this, this.id + "Axis" + name);
}

/**
 * Obtains the value of an option that uses only the axis id as a prefix
 * (ex. <tt>orthoFixedMax</tt>, <tt>orthoFixedMin</tt>).
 *
 * @name pvc.visual.CartesianAxis#_bareIdOptions
 * @function
 * @param {string} name The option name.
 * @private
 * @type string
 */
function bareIdOptions(name){
    return finalOptions.call(this, this.id + name);
}

/**
 * Obtains the value of an option that is common 
 * to all axis types, orientations and indexes
 * (ex. <tt>axisLabelFont</tt>).
 * 
 * @name pvc.visual.CartesianAxis#_commonOptions
 * @function
 * @param {string} name The option name.
 * @private
 * @type string
 */
function commonOptions(name){
    return finalOptions.call(this, 'axis' + name);
}

/**
 * Obtains the value of an option of the first axis, of the same orientation.
 * @name pvc.visual.CartesianAxis#_firstOptions
 * @function
 * @param {string} name The option name.
 * @private
 * @type string
 */
function firstOptions(name) {
    var firstOptionId = $VCA.getOptionsId(this.orientation, 0);
    
    name = buildOptionsIdName.call({optionsId: firstOptionId}, name);
    
    return finalOptions.call(this, name);
}

/** 
 * Builds the name of an option that uses the options id as a prefix 
 * (ex: <tt>xAxisEndLine</tt>, <tt>secondAxisEndLine</tt>).
 * 
 * @name pvc.visual.CartesianAxis#_buildOptionsIdName
 * @function
 * @param {string} name The option name.
 * @private
 * @type string
 */
function buildOptionsIdName(name) {
    return this.optionsId + 'Axis' + name;
}


function groupingScaleType(grouping){
    return grouping.isDiscrete() ?
                'Discrete' :
                (grouping.firstDimension.type.valueType === Date ?
                'Timeseries' :
                'Continuous');
}

});