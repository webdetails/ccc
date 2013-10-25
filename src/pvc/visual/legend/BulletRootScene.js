/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a legend bullet root scene.
 * 
 * @name pvc.visual.legend.BulletRootScene
 * 
 * @extends pvc.visual.Scene
 * 
 * @constructor
 * @param {pvc.visual.Scene} [parent] The parent scene, if any.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for supported keyword arguments.
 */
/*global pvc_Sides:true, pvc_Size:true */
def
.type('pvc.visual.legend.BulletRootScene', pvc.visual.Scene)
.init(function(parent, keyArgs){
    
    this.base(parent, keyArgs);
    
    this._unresolvedMarkerDiam  = def.get(keyArgs, 'markerSize');
    this._unresolvedItemPadding = new pvc_Sides(def.get(keyArgs, 'itemPadding', 5));
    this._unresolvedItemSize    = pvc_Size.to(def.get(keyArgs, 'itemSize')) || new pvc_Size();

    def.set(this.vars,
        'horizontal',  def.get(keyArgs, 'horizontal', false),
        'font',        def.get(keyArgs, 'font'),
        // Space between marker and text.
        // -3 is to compensate for now the label being anchored to 
        // the panel instead of the rule or the dot...
        'textMargin',  (def.get(keyArgs, 'textMargin', 6) - 3));
})
.add(/** @lends pvc.visual.legend.BulletRootScene# */{
    layout: function(layoutInfo){
        // Any size available?
        var clientSize = layoutInfo.clientSize;
        if(!(clientSize.width > 0 && clientSize.height > 0)){
            return new pvc_Size(0,0);
        }

        var desiredClientSize = layoutInfo.desiredClientSize;
        
        // The size of the biggest cell

        var itemPadding = this._unresolvedItemPadding.resolve(clientSize);

        // This facilitates making the calculations for the margins of border items
        //  to not be included.
        var extClientSize = {
            width:  clientSize.width  + itemPadding.width,
            height: clientSize.height + itemPadding.height
        };
        var desiredItemSize = this._unresolvedItemSize.resolve(extClientSize);

        var desiredItemClientSize = {
            width:  Math.max(0, desiredItemSize.width  - itemPadding.width ),
            height: Math.max(0, desiredItemSize.height - itemPadding.height)
        };

        var markerDiam = this._unresolvedMarkerDiam || desiredItemClientSize.height || 15;
        
        this.vars.itemPadding           = itemPadding;
        this.vars.desiredItemSize       = desiredItemSize;
        this.vars.desiredItemClientSize = desiredItemClientSize;
        this.vars.markerSize            = markerDiam;
        
        var textLeft      = markerDiam + this.vars.textMargin;
        var labelWidthMax = Math.max(0,
                Math.min(
                    (desiredItemClientSize.width || Infinity),
                    (desiredClientSize.width     || Infinity), 
                    clientSize.width) - 
                textLeft);

        // Names are for legend items when laid out in rows
        var a_width  = this.vars.horizontal ? 'width' : 'height';
        var a_height = pvc.BasePanel.oppositeLength[a_width]; // height or width
        
        var $maxRowWidth = desiredClientSize[a_width];
        if(!$maxRowWidth || $maxRowWidth < 0) {
            $maxRowWidth = clientSize[a_width]; // row or col
        }
        
        var row;
        var rows = [];
        var contentSize = {width: 0, height: 0};

        this.childNodes.forEach(function(groupScene){
            groupScene.childNodes.forEach(layoutItem, this);
        }, this);
        
        // If there's no pending row to commit, there are no rows...
        // No items or just items with no text -> hide
        if(!row) { return new pvc_Size(0,0); }
        
        commitRow(/* isLast */ true);
        
        def.set(this.vars,
            'sections',      rows,
            'contentSize',   contentSize,
            'labelWidthMax', labelWidthMax);
        
        var isV1Compat = this.compatVersion() <= 1;
        
        // Request used width / all available width (V1)
        var $w = isV1Compat ? $maxRowWidth : contentSize[a_width];
        var $h = desiredClientSize[a_height];
        if(!$h || $h < 0) { $h = contentSize[a_height]; }
        
        var requestSize = this.vars.size = def.set({},
            a_width,  Math.min($w, clientSize[a_width ]),
            a_height, Math.min($h, clientSize[a_height]));

        return requestSize;
        
        function layoutItem(itemScene) {
            // The names of props  of textSize and itemClientSize 
            // are to be taken literally.
            // This is because items, themselves, are always laid out horizontally...
            var textSize = itemScene.labelTextSize();
            
            var hidden = !textSize || !textSize.width || !textSize.height;
            itemScene.isHidden = hidden;
            if(hidden) { return; }
            
            var itemContentSize = {
                width:  textLeft + textSize.width,
                height: Math.max(textSize.height, markerDiam)
            };

            var itemSize = {
                width:  desiredItemSize.width  || (itemPadding.width  + itemContentSize.width ),
                height: desiredItemSize.height || (itemPadding.height + itemContentSize.height)
            };

            var itemClientSize = {
                width:  Math.max(0, itemSize.width  - itemPadding.width ),
                height: Math.max(0, itemSize.height - itemPadding.height)
            };

            // -------------
            
            var isFirstInRow;
            if(!row) {
                row = new pvc.visual.legend.BulletItemSceneSection(0);
                isFirstInRow = true;
            } else {
                isFirstInRow = !row.items.length;
            }
            
            var $newRowWidth = row.size[a_width] + itemClientSize[a_width]; // or bottom
            if(!isFirstInRow) {
                $newRowWidth += itemPadding[a_width]; // separate from previous item
            }
            
            // If not the first column of a row and the item does not fit
            if(!isFirstInRow && ($newRowWidth > $maxRowWidth)) {
                commitRow(/* isLast */false);
                
                $newRowWidth = itemClientSize[a_width];
            }
            
            // Add item to row
            var rowSize = row.size;
            rowSize[a_width ] = $newRowWidth;
            rowSize[a_height] = Math.max(rowSize[a_height], itemClientSize[a_height]);
            
            var sectionIndex = row.items.length;
            row.items.push(itemScene);
            
            def.set(itemScene.vars,
                'section',         row,
                'sectionIndex',    sectionIndex,
                'textSize',        textSize,
                'itemSize',        itemSize,
                'itemClientSize',  itemClientSize,
                'itemContentSize', itemContentSize);
        }
        
        function commitRow(isLast) {
            var rowSize = row.size;
            contentSize[a_height] += rowSize[a_height];
            if(rows.length) {
                // Separate rows
                contentSize[a_height] += itemPadding[a_height];
            }
            
            contentSize[a_width] = Math.max(contentSize[a_width], rowSize[a_width]);
            rows.push(row);
            
            // New row
            if(!isLast) {
                row = new pvc.visual.legend.BulletItemSceneSection(rows.length);
            }
        }
    },
    
    defaultGroupSceneType: function(){
        var GroupType = this._bulletGroupType;
        if(!GroupType){
            GroupType = def.type(pvc.visual.legend.BulletGroupScene);
            
            // Apply legend group scene extensions
            //this.panel()._extendSceneType('group', GroupType, ['...']);
            
            this._bulletGroupType = GroupType;
        }
        
        return GroupType;
    },
    
    createGroup: function(keyArgs){
        var GroupType = this.defaultGroupSceneType();
        return new GroupType(this, keyArgs);
    }
});

def
.type('pvc.visual.legend.BulletItemSceneSection')
.init(function(index){
    this.index = index;
    this.items = [];
    this.size  = {width: 0, height: 0};
});