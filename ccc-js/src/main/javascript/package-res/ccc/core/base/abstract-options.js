/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function OptionsMetaType() {

    def.MetaType.apply(this, arguments);

    // Inherit base options' defs
    var baseOptsDef = this.baseType && this.baseType.optionsDef;
    this.optionsDef = def.create(baseOptsDef);
}

def.MetaType.subType(OptionsMetaType, {
    methods: /** @lends pvc.OptionsMetaType# */{
        // Specify local options' defs
        options: function(optionsDef) {
            return def.mixin(this.optionsDef, optionsDef), this;
        },

        _addInitSteps: function(steps) {
            // Called after post steps are added.

            // Add init steps.
            this.base(steps);

            // First thing to execute is initOptions.
            var type = this;

            function initOptions() {
                this.option = pvc.options(type.optionsDef, this);
            }

            steps.push(initOptions);
        }
    }
});

// --------------

var pvc_OptionBase = OptionsMetaType.Ctor;

def('pvc.visual.OptionsBase', pvc_OptionBase.configure({
    /**
     * Initializes the object with options.
     *
     * @name pvc.visual.OptionsBase
     *
     * @class Represents an object, associated with a chart, that has options.
     *
     * @property {pvc.BaseChart} chart The associated chart.
     * @property {string} type The type of object.
     * @property {number} index The index of the object within its type (0, 1, 2...).
     * @property {string} [name] The name of the object.
     *
     * @constructor
     * @param {pvc.BaseChart} chart The associated chart.
     * @param {string} type The type of the object.
     * @param {number} [index=0] The index of the object within its type.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {string} [keyArgs.name] The name of the object.
     * @param {boolean} [keyArgs.byV1=true] Whether to resolve using V1 logic.
     * @param {boolean} [keyArgs.byName=true] Whether to resolve by name.
     * @param {boolean} [keyArgs.byId=true] Whether to resolve by option id.
     * @param {boolean} [keyArgs.byNaked] Whether to resolve by naked option name.
     *     Defaults to <tt>true</tt> if <i>index</i> is 0.
     */
    init: function(chart, type, index, keyArgs) {
        this.type  = type;
        this.chart = chart;
        this.index = index == null ? 0 : index;
        this.name  = def.get(keyArgs, 'name');
        this.id    = def.indexedId(this.type, this.index);
        this.optionId = this._buildOptionId(keyArgs);

        var rs = this._resolvers = [];

        this._registerResolversFull(rs, keyArgs);
    },

    methods: /** @lends pvc.visual.OptionsBase# */{
        _buildOptionId: function(keyArgs) { return this.id; },
        _chartOption:   function(name) { return this.chart.options[name]; },
        _registerResolversFull: function(rs, keyArgs) {
            // I - By Fixed values
            var fixed = def.get(keyArgs, 'fixed');
            if(fixed) {
                this._fixed = fixed;
                rs.push(pvc.options.specify(function(optionInfo) {
                    return fixed[optionInfo.name];
                }));
            }

            this._registerResolversNormal(rs, keyArgs);

            // VI - By Default Values
            var defaults = def.get(keyArgs, 'defaults');
            if(defaults) this._defaults = defaults;

            rs.push(this._resolveDefault);
        },

        _registerResolversNormal: function(rs, keyArgs) {
            // II - By V1 Only Logic
            if(def.get(keyArgs, 'byV1', 1) && this.chart.compatVersion() <= 1)
                rs.push(this._resolveByV1OnlyLogic);

            // III - By Name (ex: plot2, trend)
            if(this.name && def.get(keyArgs, 'byName', 1)) rs.push(this._resolveByName);

            // IV - By OptionId
            if(def.get(keyArgs, 'byId', 1)) rs.push(this._resolveByOptionId);

            // V - By Naked option name
            if(def.get(keyArgs, 'byNaked', !this.index)) rs.push(this._resolveByNaked);
        },

        // -------------

        _resolveFull: function(optionInfo) {
            var rs = this._resolvers;
            for(var i = 0, L = rs.length ; i < L ; i++)
                if(rs[i].call(this, optionInfo))
                    return true;
            return false;
        },

        _resolveFixed: pvc.options.specify(function(optionInfo) {
            if(this._fixed) return this._fixed[optionInfo.name];
        }),

        _resolveByV1OnlyLogic: function(optionInfo) {
            var data = optionInfo.data,
                resolverV1;
            if(data && (resolverV1 = data.resolveV1))
                return resolverV1.call(this, optionInfo);
        },

        _resolveByName: pvc.options.specify(function(optionInfo) {
            if(this.name) return this._chartOption(this.name + def.firstUpperCase(optionInfo.name));
        }),

        _resolveByOptionId: pvc.options.specify(function(optionInfo) {
            return this._chartOption(this.optionId + def.firstUpperCase(optionInfo.name));
        }),

        _resolveByNaked: pvc.options.specify(function(optionInfo) {
            return this._chartOption(def.firstLowerCase(optionInfo.name));
        }),

        _resolveDefault: function(optionInfo) {
            // Dynamic default value?
            var data = optionInfo.data,
                resolverDefault;
            if(data &&
               (resolverDefault = data.resolveDefault) &&
               resolverDefault.call(this, optionInfo)) return true;

            if(this._defaults) {
                var value = this._defaults[optionInfo.name];
                if(value !== undefined) return optionInfo.defaultValue(value), true;
            }
        },

        _specifyChartOption: function(optionInfo, asName) {
            var value = this._chartOption(asName);
            if(value != null) return optionInfo.specify(value), true;
        }
    }
}));

