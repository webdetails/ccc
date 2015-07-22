/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global axis_optionsDef:true*/

def('pvc.visual.CartesianFocusWindow', pvc.visual.OptionsBase.extend({
    init: function(chart) {

        this.base(chart, 'focusWindow', 0, {byNaked: false});

        // TODO: ortho
        var baseAxis = chart.axes.base;
        this.base = new pvc.visual.CartesianFocusWindowAxis(this, baseAxis);
    },
    methods: /** @lends pvc.visual.FocusWindow# */{
        _exportData: function() {
            return {
                base: def.copyProps(this.base, pvc.visual.CartesianFocusWindowAxis.props)
            };
        },

        _importData: function(data) {
            var baseData = data.base;

            this.base.option.specify({
                Begin:  baseData.begin,
                End:    baseData.end,
                Length: baseData.length
            });
        },

        _initFromOptions: function() {
            this.base._initFromOptions();
        },

        _onAxisChanged: function(axis) {
            // Fire event
            var changed = this.option('Changed');
            if(changed) changed.call(this.chart.basePanel.context());
        }
    },
    options: {
        Changed: {
            resolve: '_resolveFull',
            cast:    def.fun.as
        }
    }
}));

def('pvc.visual.CartesianFocusWindowAxis', pvc.visual.OptionsBase.extend({
    init: function(fw, axis) {
        this.window = fw;
        this.axis = axis;
        this.isDiscrete = axis.isDiscrete();

        // focusWindowBase/Ortho
        this.base(
            axis.chart,
            'focusWindow' + def.firstUpperCase(axis.type),
            0,
            {byNaked: false});
    },
    type: {
        methods: {
            props: ['begin', 'end', 'length']
        }
    },
    methods: /** @lends pvc.visual.FocusWindow# */{
        _initFromOptions: function() {
            var o = this.option;
            this.set({
                begin:  o('Begin' ),
                end:    o('End'   ),
                length: o('Length')
            });
        },

        set: function(keyArgs) {
            var me = this,
                render = def.get(keyArgs, 'render'),
                select = def.get(keyArgs, 'select', true),
                b, e, l;

            keyArgs = me._readArgs(keyArgs);
            if(!keyArgs) {
                if(this.begin != null && this.end != null && this.length != null) return;
            } else {
                b = keyArgs.begin;
                e = keyArgs.end;
                l = keyArgs.length;
            }

            var axis       = me.axis,
                scale      = axis.scale,
                isDiscrete = me.isDiscrete,
                contCast   = !isDiscrete ? axis.role.lastDimensionType().cast : null,
                domain     = scale.domain(),
                a, L, ib, ie, ia, nb, ne;

            if(isDiscrete) {
                L = domain.length;
                if(b != null) {
                    nb = +b;
                    if(!isNaN(nb)) {
                        if(nb === Infinity) {
                            ib = L - 1;
                            b  = domain[ib];
                        } else if(nb === -Infinity) {
                            ib = 0;
                            b  = domain[ib];
                        }
                    }

                    if(ib == null) {
                        ib = domain.indexOf(''+b);
                        if(ib < 0) {
                            //b = null;
                            ib = 0;
                            b  = domain[ib];
                        }
                    }
                }

                if(e != null) {
                    ne = +e;
                    if(!isNaN(ne)) {
                        if(ne === Infinity) {
                            ie = L - 1;
                            e  = domain[ie];
                        } else if(ne === -Infinity) {
                            ie = 0;
                            e  = domain[ie];
                        }
                    }

                    if(ie == null) {
                        ie = domain.indexOf(''+e);
                        if(ie < 0) {
                            //e = null;
                            ie = L - 1;
                            e  = domain[ie];
                        }
                    }
                }

                if(l != null) {
                    l = +l;
                    if(isNaN(l)) {
                        l = null;
                    } else if(l < 0 && (b != null || e != null)) {
                        // Switch b and e
                        a  = b;
                        ia = ib;
                        b  = e; ib = ie; e = a; ie = ia;
                        l  = -l;
                    }

                    // l > L ??
                }

                if(b != null) {
                    if(e != null) {
                        if(ib > ie) {
                            // Switch b and e
                            a  = b;
                            ia = ib;
                            b  = e; ib = ie; e = a; ie = ia;
                        }
                        // l is ignored
                        l = ie - ib + 1;
                    } else {
                        // b && !e
                        if(l == null) {
                            // to the end of the domain?
                            l = L - ib;
                        }

                        ie = ib + l - 1;
                        if(ie > L - 1) {
                            ie = L - 1;
                            l = ie - ib + 1;
                        }

                        e = domain[ie];
                    }
                } else {
                    // !b
                    if(e != null) {
                        // !b && e
                        if(l == null) {
                            // from the beginning of the domain?
                            l = ie;
                            // ib = 0
                        }

                        ib = ie - l + 1;
                        if(ib < 0) {
                            ib = 0;
                            l = ie - ib + 1;
                        }

                        b = domain[ib];
                    } else {
                        // !b && !e
                        if(l == null) l = Math.max(~~(L / 3), 1); // 1/3 of the width?

                        if(l > L) {
                            l = L;
                            ib = 0;
                            ie = L - 1;
                        } else {
                            // ~~ <=> Math.floor for x >= 0
                            ia = ~~(L / 2); // window center
                            ib = ia - ~~(l/2);
                            ie = ib + l - 1;
                        }

                        b = domain[ib];
                        e = domain[ie];
                    }
                }

            } else {
                // Continuous

                if(l != null) {
                    l = +l;
                    if(isNaN(l)) {
                        l = null;
                    } else if(l < 0 && (b != null || e != null)) {
                        // Switch b and e
                        a  = b;
                        b = e; e = a;
                        l = -l;
                    }

                    // l > L ??
                }

                var min = domain[0],
                    max = domain[1],
                    bAux, lAux;
                L  = max - min;
                if(b != null) {
                    // -Infinity is a placeholder for min
                    if(b < min) b = min;

                    // +Infinity is a placeholder for max
                    if(b > max) b = max;
                }

                if(e != null) {
                    // -Infinity is a placeholder for min
                    if(e < min) e = min;

                    // +Infinity is a placeholder for max
                    if(e > max) e = max;
                }

                if(b != null) {
                    if(e != null) {
                        if(b > e) {
                            // Switch b and e
                            a  = b;
                            b = e; e = a;
                        }
                        l = e - b;
                    } else {
                        // b && !e
                        if(l == null) {
                            // to the end of the domain?
                            l = max - b;
                        }

                        e = b + l;
                        if(e > max) {
                            e = max;
                            l = e - b;
                        }
                    }
                } else {
                    // !b
                    if(e != null) {
                        // !b && e
                        if(l == null) {
                            // from the beginning of the domain?
                            l = e - min;
                            // b = min
                        }

                        b = e - l;
                        if(b < min) {
                            b = min;
                            l = e - b;
                        }
                    } else {
                        // !b && !e
                        if(l == null) l = Math.max(~~(L / 3), 1); // 1/3 of the width?

                        if(l > L) {
                            l = L;
                            b = min;
                            e = max;
                        } else {
                            // ~~ <=> Math.floor for x >= 0
                            a = ~~(L / 2); // window center
                            b = a - ~~(l/2);
                            bAux = (+b);
                            lAux = (+l);
                            e = bAux + lAux; // NOTE: Dates subtract, but don't add...
                        }
                    }
                }

                b = contCast(b);
                e = contCast(e);
                l = contCast(l);

                var constraint = me.option('Constraint');
                if(constraint) {
                    var oper2 = {
                        type:    'new',
                        target:  'begin',
                        value:   b,
                        length:  l,
                        length0: l,
                        min:     min,
                        max:     max,
                        minView: min,
                        maxView: max
                    };

                    constraint(oper2);

                    b = contCast(oper2.value );
                    l = contCast(oper2.length);
                    bAux = (+b);
                    lAux = (+l);
                    e = contCast(bAux + lAux); // NOTE: Dates subtract, but don't add...
                }
            }

            me._set(b, e, l, select, render);
        },

        _updatePosition: function(pbeg, pend, select, render) {
            var me = this,
                axis = me.axis,
                scale = axis.scale,
                b, e, l;

            if(me.isDiscrete) {
                var ib = scale.invertIndex(pbeg),
                    ie = scale.invertIndex(pend) - 1,
                    domain = scale.domain();

                b = domain[ib];
                e = domain[ie];
                l = ie - ib + 1;
            } else {
                b = scale.invert(pbeg);
                e = scale.invert(pend);
                l = e - b;
            }

            this._set(b, e, l, select, render);
        },

        /*
            var oper = {
                type:    op,
                target:  target,
                point:   p,
                length:  l,  // new length
                length0: l0, // prev length
                min:     drag.min[a_p],
                max:     drag.max[a_p],
                minView: 0,
                maxView: w
            };
         */
        _constraintPosition: function(oper) {
            var me = this,
                axis = me.axis,
                scale = axis.scale,
                constraint;

            if(me.isDiscrete) {
                // Align to category boundaries
                var index = Math.floor(scale.invertIndex(oper.point, /* noRound */true));
                if(index >= 0) {
                    var r = scale.range(),
                        L = scale.domain().length,
                        S = (r.max - r.min) / L;
                    if(index >= L && (oper.type === 'new' || oper.type === 'resize-begin')) index = L - 1;
                    oper.point = index * S;
                }
            } else if((constraint = me.option('Constraint'))) {
                var contCast = axis.role.lastDimensionType().cast,
                    v = contCast(scale.invert(oper.point)),
                    sign    = oper.target === 'begin' ? 1 : -1,
                    pother  = oper.point + sign * oper.length,
                    vother  = contCast(scale.invert(pother)),
                    vlength = contCast(sign * (vother - v)),
                    vlength0, pother0, vother0;

                if(oper.length === oper.length0) {
                    vlength0 = vlength;
                } else {
                    pother0  = oper.point + sign * oper.length0;
                    vother0  = contCast(scale.invert(pother0));
                    vlength0 = contCast(sign * (vother0 - v));
                }

                var vmin = contCast(scale.invert(oper.min)),
                    vmax = contCast(scale.invert(oper.max)),
                    oper2 = {
                        type:    oper.type,
                        target:  oper.target,
                        value:   v,
                        length:  vlength,  // new length if value is accepted
                        length0: vlength0, // prev length (with previous value)
                        min:     vmin,
                        max:     vmax,
                        minView: contCast(scale.invert(oper.minView)),
                        maxView: contCast(scale.invert(oper.maxView))
                    };

                constraint(oper2);

                // detect any changes and update oper
                if(+oper2.value !== +v) {
                    v = oper2.value;
                    oper.point = scale(v);
                }

                var vlength2 = oper2.length;
                if(+vlength2 !== +vlength) {
                    if(+vlength2 === +vlength0) {
                        oper.length = oper.length0;
                    } else {
                        var vother2 = (+v) + sign * (+vlength2), // NOTE: Dates subtract, but don't add...
                            pother2 = scale(vother2);

                        oper.length = pother2 - sign * oper.point;
                    }
                }

                if(+oper2.min !== +vmin) oper.min = scale(oper2.min);
                if(+oper2.max !== +vmax) oper.max = scale(oper2.max);
            }
        },

        _compare: function(a, b) {
            return this.isDiscrete ?
                   (('' + a) === ('' + b)) :
                   ((+a) === (+b));
        },

        _set: function(b, e, l, select, render) {
            var me = this, changed = false;

            if(!me._compare(b, me.begin )) me.begin  = b, changed = true;
            if(!me._compare(e, me.end   )) me.end    = e, changed = true;
            if(!me._compare(l, me.length)) me.length = l, changed = true;

            if(changed) me.window._onAxisChanged(me);
            if(select ) me._updateSelection({render: render});

            return changed;
        },

        _readArgs: function(keyArgs) {
            if(keyArgs) {
                var out = {},
                    any = 0,
                    read = function(p) {
                        var v = keyArgs[p];
                        if(v != null)
                            any = true;
                        else
                            v = this[p];

                        out[p] = v;
                    };

                pvc.visual.CartesianFocusWindowAxis.props.forEach(read, this);

                if(any) return out;
            }
        },

        // keyArgs: render: boolean [true]
        _updateSelection: function(keyArgs) {
            var me = this,
                // TODO: Only the first dataCell is supported...
                // TODO: cache domainData?
                selectDatums,
                axis       = me.axis,
                isDiscrete = axis.isDiscrete(),
                chart      = axis.chart,
                dataCell   = axis.dataCell,
                role       = dataCell.role,
                partData   = chart.partData(dataCell.dataPartValue),
                domainData;
            if(isDiscrete) {
                domainData = role.flatten(partData);

                var dataBegin = domainData.child(me.begin),
                    dataEnd   = domainData.child(me.end  );
                if(dataBegin && dataEnd) {
                    var indexBegin = dataBegin.childIndex(),
                        indexEnd   = dataEnd  .childIndex();
                    selectDatums = def
                        .range(indexBegin, indexEnd - indexBegin + 1)
                        .select(function(index) { return domainData.childNodes[index]; })
                        .selectMany(def.propGet('_datums'))
                        .where(cdo.Datum.isVisibleT)
                        .distinct(def.propGet('key'));
                }
            } else {
                domainData = partData;

                var dimName = role.lastDimensionName();
                selectDatums = def
                    .query(partData._datums)
                    .where(cdo.Datum.isVisibleT)
                    .where(function(datum) {
                        var v = datum.atoms[dimName].value;
                        return v != null && v >= me.begin && v <= me.end;
                    });
            }

            if(selectDatums) {
                chart.data.replaceSelected(selectDatums);

                // Fire events; maybe render (keyArgs)
                chart.root.updateSelections(keyArgs);
            }
        }
    },

    options: {
        Resizable: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },

        Movable:   {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },

        Begin: {
            resolve: '_resolveFull'
        },

        End: {
            resolve: '_resolveFull'
        },

        Length: {
            resolve: '_resolveFull'
        },

        // Continuous Axis function(v, vother, op, vmax) -> vconstrained
        Constraint: {
            resolve: '_resolveFull',
            cast:    def.fun.as
        }
    }
}));





