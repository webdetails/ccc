/**
 * Initializes a bullet plot.
 * 
 * @name pvc.visual.BulletPlot
 * @class Represents a bullet plot.
 * @extends pvc.visual.Plot
 */
def
.type('pvc.visual.BulletPlot', pvc.visual.Plot)
.add({
    type: 'bullet',
    
    _getOptionsDefinition: function(){
        return pvc.visual.BulletPlot.optionsDef;
    }
});

pvc.visual.BulletPlot.optionsDef = def.create(
    pvc.visual.Plot.optionsDef, {
        ValuesVisible: { // override
            value: true
        },
        
        ColorRole: {
            value: null
        }
    });