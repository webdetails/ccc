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
.init(function(parent, keyArgs) {
    
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
    layout: function(layoutInfo) {
        // Any size available?
        var clientSize = layoutInfo.clientSize;
        if(!(clientSize.width > 0 && clientSize.height > 0)) return new pvc_Size(0,0);

        var desiredClientSize = layoutInfo.desiredClientSize,

            // The size of the biggest cell
            itemPadding = this._unresolvedItemPadding.resolve(clientSize),

            // This facilitates making the calculations for the margins of border items
            //  to not be included.
            extClientSize = {
                width:  clientSize.width  + itemPadding.width,
                height: clientSize.height + itemPadding.height
            },

            // May come with both width/height to null
            desiredItemSize = this._unresolvedItemSize.resolve(extClientSize),
            desiredItemClientSize = {
                width:  desiredItemSize.width  && Math.max(0, desiredItemSize.width  - itemPadding.width ),
                height: desiredItemSize.height && Math.max(0, desiredItemSize.height - itemPadding.height)
            },

            markerDiam = this._unresolvedMarkerDiam || desiredItemClientSize.height || 15;
        
        this.vars.itemPadding           = itemPadding;
        this.vars.desiredItemSize       = desiredItemSize;
        this.vars.desiredItemClientSize = desiredItemClientSize;
        this.vars.markerSize            = markerDiam;
        
        var textLeft      = markerDiam + this.vars.textMargin,
            labelWidthMax = Math.max(0,
                Math.min(
                    (desiredItemClientSize.width || Infinity),
                    (desiredClientSize.width     || Infinity), 
                    clientSize.width) - 
                textLeft),
            // Names are for legend items when laid out in sections
            a_width  = this.vars.horizontal ? 'width' : 'height',
            a_height = pvc.BasePanel.oppositeLength[a_width], // height or width
            section,
            sections = [],
            contentSize = {width: 0, height: 0},
            $maxSectionWidth = desiredClientSize[a_width];

        if(!$maxSectionWidth || $maxSectionWidth < 0) $maxSectionWidth = clientSize[a_width]; // row or col

        this.childNodes.forEach(function(groupScene) { groupScene.childNodes.forEach(layoutItem, this); }, this);
        
        // If there's no pending section to commit, there are no sections...
        // No items or just items with no text -> hide
        if(!section) return new pvc_Size(0,0);
        
        commitSection(/* isLast */ true);
        
        def.set(this.vars,
            'sections',      sections,
            'contentSize',   contentSize,
            'labelWidthMax', labelWidthMax);
        
        var isV1Compat = this.compatVersion() <= 1,
            // Request used width / all available width (V1)
            $w = isV1Compat ? $maxSectionWidth : contentSize[a_width],
            $h = desiredClientSize[a_height];

        if(!$h || $h < 0) $h = contentSize[a_height];

        // requestSize
        return (this.vars.size = def.set({},
            a_width,  Math.min($w, clientSize[a_width ]),
            a_height, Math.min($h, clientSize[a_height])));
        
        function layoutItem(itemScene) {
            // The names of props  of textSize and itemClientSize 
            // are to be taken literally.
            // This is because items, themselves, are always laid out horizontally...
            var textSize = itemScene.labelTextSize(),
                hidden = !textSize || !textSize.width || !textSize.height;

            itemScene.isHidden = hidden;

            if(hidden) return;
            
            var itemContentSize = {
                    width:  textLeft + textSize.width,
                    height: Math.max(textSize.height, markerDiam)
                },
                itemSize = {
                    width:  desiredItemSize.width  || (itemPadding.width  + itemContentSize.width ),
                    height: desiredItemSize.height || (itemPadding.height + itemContentSize.height)
                },
                itemClientSize = {
                    width:  Math.max(0, itemSize.width  - itemPadding.width ),
                    height: Math.max(0, itemSize.height - itemPadding.height)
                },
                isFirstInSection;

            if(!section) {
                section = new pvc.visual.legend.BulletItemSceneSection(0);
                isFirstInSection = true;
            } else {
                isFirstInSection = !section.items.length;
            }
            
            var $newSectionWidth = section.size[a_width] + itemClientSize[a_width]; // or bottom
            if(!isFirstInSection) $newSectionWidth += itemPadding[a_width]; // separate from previous item
            
            // If not the first item of a section and it does not fit
            if(!isFirstInSection && ($newSectionWidth > $maxSectionWidth)) {
                commitSection(/* isLast */false);
                
                $newSectionWidth = itemClientSize[a_width];
            }
            
            // Add item to section
            var sectionSize = section.size;
            sectionSize[a_width ] = $newSectionWidth;
            sectionSize[a_height] = Math.max(sectionSize[a_height], itemClientSize[a_height]);
            
            var sectionIndex = section.items.length;
            section.items.push(itemScene);
            
            def.set(itemScene.vars,
                'section',         section,
                'sectionIndex',    sectionIndex,
                'textSize',        textSize,
                'itemSize',        itemSize,
                'itemClientSize',  itemClientSize,
                'itemContentSize', itemContentSize);
        }
        
        function commitSection(isLast) {
            var sectionSize = section.size;
            contentSize[a_height] += sectionSize[a_height];

            // Separate sections
            if(sections.length) contentSize[a_height] += itemPadding[a_height];
            
            contentSize[a_width] = Math.max(contentSize[a_width], sectionSize[a_width]);
            sections.push(section);
            
            // New section
            if(!isLast) section = new pvc.visual.legend.BulletItemSceneSection(sections.length);
        }
    },
    
    defaultGroupSceneType: function() {
        var GroupType = this._bulletGroupType;
        if(!GroupType) {
            GroupType = def.type(pvc.visual.legend.BulletGroupScene);
            
            // Apply legend group scene extensions
            //this.panel()._extendSceneType('group', GroupType, ['...']);
            
            this._bulletGroupType = GroupType;
        }
        
        return GroupType;
    },
    
    createGroup: function(keyArgs) {
        var GroupType = this.defaultGroupSceneType();
        return new GroupType(this, keyArgs);
    }
});

def
.type('pvc.visual.legend.BulletItemSceneSection')
.init(function(index) {
    this.index = index;
    this.items = [];
    this.size  = {width: 0, height: 0};
});