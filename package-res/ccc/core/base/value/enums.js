
pvc.parseValuesOverflow =
    pvc.makeEnumParser('valuesOverflow', ['show', 'trim', 'hide'], 'hide');

pvc.parseMultiChartOverflow =
    pvc.makeEnumParser('multiChartOverflow', ['grow', 'fit', 'clip'], 'grow');

pvc.parseLegendClickMode =
    pvc.makeEnumParser('legendClickMode', ['toggleSelected', 'toggleVisible', 'none'], 'toggleVisible');

pvc.parseTooltipAutoContent =
    pvc.makeEnumParser('tooltipAutoContent', ['summary', 'value'], 'value');

pvc.parseSelectionMode =
    pvc.makeEnumParser('selectionMode', ['rubberBand', 'focusWindow'], 'rubberBand');

pvc.parseClearSelectionMode =
    pvc.makeEnumParser('clearSelectionMode', ['emptySpaceClick', 'manual'], 'emptySpaceClick');

pvc.parsePointingMode =
    pvc.makeEnumParser('pointingMode', ['over', 'near'], 'near');

pvc.parsePointingCollapse =
    pvc.makeEnumParser('pointingCollapse', ['none', 'x', 'y'], 'none');

// ['square', 'circle', 'diamond', 'triangle', 'cross', 'bar']
pvc.parseShape = pvc.makeEnumParser('shape', pv.Scene.hasSymbol, null);

pvc.parseContinuousColorScaleType = function(scaleType) {
    if(scaleType) {
        scaleType = (''+scaleType).toLowerCase();
        switch(scaleType) {
            case 'linear':
            case 'normal':
            case 'discrete':
                break;

            default:
                if(def.debug >= 2) def.log("[Warning] Invalid 'ScaleType' option value: '" + scaleType + "'.");
                scaleType = null;
                break;
        }
    }
    return scaleType;
};

pvc.parseDomainScope = function(scope, orientation) {
    if(scope) {
        scope = (''+scope).toLowerCase();
        switch(scope) {
            case 'cell':
            case 'global':
                break;

            case 'section': // row (for y) or col (for x), depending on the associated orientation
                if(!orientation) throw def.error.argumentRequired('orientation');
                scope = orientation === 'y' ? 'row' : 'column';
                break;

            case 'column':
            case 'row':
                if(orientation && orientation !== (scope === 'row' ? 'y' : 'x')) {
                    scope = 'section';

                    if(def.debug >= 2) def.log("[Warning] Invalid 'DomainScope' option value: '" +
                        scope + "' for the orientation: '" + orientation + "'.");
                }
                break;

            default:
                if(def.debug >= 2) def.log("[Warning] Invalid 'DomainScope' option value: '" + scope + "'.");
                scope = null;
                break;
        }
    }
    return scope;
};

pvc.parseDomainRoundingMode = function(mode) {
    if(mode) {
        mode = (''+mode).toLowerCase();
        switch(mode) {
            case 'none':
            case 'nice':
            case 'tick':
                break;

            default:
                if(def.debug >= 2) def.log("[Warning] Invalid 'DomainRoundMode' value: '" + mode + "'.");
                mode = null;
                break;
        }
    }
    return mode;
};

pvc.parseOverlappedLabelsMode = function(mode) {
    if(mode) {
        mode = (''+mode).toLowerCase();
        switch(mode) {
            case 'leave':
            case 'hide':
            case 'rotatethenhide':
                break;

            default:
                if(def.debug >= 2) def.log("[Warning] Invalid 'OverlappedLabelsMode' option value: '" + mode + "'.");
                mode = null;
                break;
        }
    }
    return mode;
};

pvc.parseTrendType = function(value) {
    if(value) {
        value = (''+value).toLowerCase();
        if(value === 'none') return value;
        if(pvc.trends.has(value)) return value;

        if(def.debug >= 2) def.log("[Warning] Invalid 'TrendType' value: '" + value + "'.");
    }
};

pvc.parseNullInterpolationMode = function(value) {
    if(value) {
        value = (''+value).toLowerCase();
        switch(value) {
            case 'none':
            case 'linear':
            case 'zero':
                return value;
        }

        if(def.debug >= 2) def.log("[Warning] Invalid 'NullInterpolationMode' value: '" + value + "'.");
    }
};

pvc.parseAlign = function(side, align) {
    if(align) { align = (''+align).toLowerCase(); }
    var align2, isInvalid;
    if(side === 'left' || side === 'right') {
        align2 = align && pvc.BasePanel.verticalAlign[align];
        if(!align2) {
            align2 = 'middle';
            isInvalid = !!align;
        }
    } else {
        align2 = align && pvc.BasePanel.horizontalAlign[align];
        if(!align2) {
            align2 = 'center';
            isInvalid = !!align;
        }
    }

    if(isInvalid && def.debug >= 2) def.log(def.format("Invalid alignment value '{0}'. Assuming '{1}'.", [align, align2]));

    return align2;
};

// suitable for protovis.anchor(..) of all but the Wedge mark...
pvc.parseAnchor = function(anchor) {
    if(anchor) {
        anchor = (''+anchor).toLowerCase();
        switch(anchor) {
            case 'top':
            case 'left':
            case 'center':
            case 'bottom':
            case 'right':
                return anchor;
        }

        if(def.debug >= 2) def.log(def.format("Invalid anchor value '{0}'.", [anchor]));
    }
};

pvc.parseAnchorWedge = function(anchor) {
    if(anchor) {
        anchor = (''+anchor).toLowerCase();
        switch(anchor) {
            case 'outer':
            case 'inner':
            case 'center':
            case 'start':
            case 'end':
                return anchor;
        }

        if(def.debug >= 2) def.log(def.format("Invalid wedge anchor value '{0}'.", [anchor]));
    }
};

pvc.parsePosition = function(side, defaultSide) {
    if(side) {
        side = (''+side).toLowerCase();

        if(!def.hasOwn(pvc_Sides.namesSet, side)) {
            var newSide = defaultSide || 'left';

            if(def.debug >= 2) def.log(def.format("Invalid position value '{0}. Assuming '{1}'.", [side, newSide]));

            side = newSide;
        }
    }

    return side || defaultSide || 'left';
};
