/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if(typeof pvc === 'undefined') {
    pvc = {setDebug: function(){}};
}

(function(){
    var url;
    /*global window:true */
    if(typeof (url = window.location.href) !== 'undefined') {

        if(!/\bdebug\b/.test(url)) { def.setDebug(3); }
    }
}());

var tryMe = function(e){
    /*global CodeMirror:true */
    
    try{
        var $e = $(e);
        var $textArea = $e.prevAll("textarea");
        var textArea = $textArea[0];
        var codeMirror = textArea._codeMirror;
        if(codeMirror){
            codeMirror.save();
        }
        
        var code = $textArea.val();
        if(code){
            // In IE document mode 8 the editor doesn't work well
            // In other IE variants the css also doesn't work very well
            var betterNot = !pv.have_SVG && pv.have_VML;
            if(!betterNot && /^\s*new\s/.test(code)){
                if(!codeMirror){
                    if(!CodeMirror.keyMap.ccc){
                        CodeMirror.keyMap.ccc = {
                            'Tab':       false,
                            'Shift-Tab': false,
                            'PageUp':    false,
                            'PageDown':  false,
                            fallthrough: 'default'
                        };
                    }
                    
                    codeMirror = 
                    textArea._codeMirror = 
                    CodeMirror.fromTextArea(textArea, {
                        mode:          'javascript',
                        //lineWrapping:  true,
                        lineNumbers:   false,
                        indentUnit:    4,
                        autofocus:     false,
                        matchBrackets: true,
                        keyMap:        'ccc'
                    });
                }
                
                var reWidth  = /\b(width\s*:\s*)(.*?)(\s*[,}])/;
                var reHeight = /\b(height\s*:\s*)(.*?)(\s*[,}])/;
                var m;
                
                // V2-style example
                // Fix width and height
                var width;
                m = reWidth.exec(code);
                if(m){
                    width = +m[2];
                }
                
                var height;
                m = reHeight.exec(code);
                if(m){
                    height = +m[2];
                }
                
                if(height && width){
                    var $scrollBox = $textArea.parent().find('.CodeMirror-scroll');
                    var $codeBox   = $textArea.parent().find('.CodeMirror');
                    
                    var maxWidth  = 0.95 * $e.parent().next().width();
                    var maxHeight = Math.max(500, 0.95 * ($scrollBox.length ? $scrollBox : $e.parent().next()).height());
                    
                    $codeBox.css({
                        'max-width': $e.parent().width() + 'px'
                    });
                    
                    // Don't allow growing beyond the initial height,
                    // which is all the height required to fit the initial code, limited by 800px.
                    $scrollBox.css({
                        'max-height': $scrollBox.height() + 'px'
                    });
                    
                    var ar = width / height;
                    if(ar >= 1){
                        // bigger width
                        width  = maxWidth;
                        height = width / ar;
                        if(height > maxHeight){
                            height = maxHeight;
                            width  = height * ar;
                        }
                    } else {
                        height = maxHeight;
                        width  = height * ar;
                        
                        if(width > maxWidth){
                            width  = maxWidth;
                            height = width / ar;
                        }
                    }
                    
                    // Replace
                    code = code
                        .replace(reWidth, function($0, $1, $2, $3){
                            return $1 + width + $3;
                        })
                        .replace(reHeight, function($0, $1, $2, $3){
                            return $1 + height + $3;
                        });
                }
            }
            
            /*jshint evil:true */
            eval(code);
        }
        
    } catch(ex) {
        /*global alert:true */
        alert("Try Me error\n" + (ex.message || ex));
    }
};

def.scope(function(){
    
    var $e = pvc.examples = {};
    var chartExamples = {};
    
    $e.register = registerChartExample;
    $e.render   = renderChartExample;
    $e.renderAll = renderAllChartExamples;
    
    function registerChartExample(exampleDef){
        chartExamples[exampleDef.id] = {
            className: exampleDef.className,
            dataVar:   exampleDef.dataVar,
            def:       exampleDef.def,
            showProps: exampleDef.showProps || []
        };
    }
    
    function renderChartExample(id, canvas){
        var chartExample = chartExamples[id];
        if(!chartExample){
            return;
        }
        
        var height = chartExample.def.height;
        
        // ----------------------
        /*
        <div style="display:table-row;height:300px">
            <div style="display:table-cell; width:150px"></div>
            <div style="display:table-cell"></div>
        </div>
        */
        var $table = $("#examples");
        
        var $tableRow = $('<div />');
        $tableRow.appendTo($table);
        if(height != null) {
            $tableRow.css('height', height + 'px');
        }
        
        var $tableChartCell = $('<div style="display:table-cell;" />');
        $tableChartCell.appendTo($tableRow);
        
        var $tableChartDiv = $('<div>&nbsp;</div>');
        $tableChartDiv.appendTo($tableChartCell);
        
        var $tablePropsCell = $('<div></div>'); 
        $tablePropsCell.appendTo($tableRow);
        
        // -----------------------
        
        var ChartClass = pvc[chartExample.className];
        var options = def.create(false, chartExample.def, {
            canvas: $tableChartDiv[0]
        });
        
        if(options.width == null){
            options.width = $tableChartDiv.width();
        }
        
        if(options.height == null){
            options.height = $tableRow.height();
        }
        
        var chart = new ChartClass(options);
        
        // ----------------------
     
        var $propsTable = $('<div class="props" />');
        $propsTable.appendTo($tablePropsCell);
        
        chartExample.showProps.forEach(function(name){
            var $propsRow = $('<div />');
            $propsRow.appendTo($propsTable);
            
            $('<div />').appendTo($propsRow)
                .text(name);
            
            $('<div />').appendTo($propsRow)
                .text(JSON.stringify(chart.options[name]));
        });
        
        // ----------------------
    
        
        chart.setData(def.global[chartExample.dataVar]);
        chart.render();
    }
   
    function renderAllChartExamples() {
        var ids = def.ownKeys(chartExamples);
        var count = ids.length;
        if(count) {
            $("#examples div").remove();
            
            ids.forEach(function(id) {
                setTimeout(function() {
                    $e.render(id);
                }, 30);
            });
        }
    }
});

pv.listenForPageLoad(function() {
    // When everything is ready, click all tryMe buttons
    $("button.tryMe")
    .click();
    //.each(function(i,e) { setTimeout(function() { e.click(); }, 30); });
    
    pvc.examples.renderAll();
});
//
//$(window).resize(function(){
//    
//    pvc.examples.renderAll();
//});