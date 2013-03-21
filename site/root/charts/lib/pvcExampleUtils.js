/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function(){
    var url;
    /*global window:true */
    if(typeof (url = window.location.href) !== 'undefined'){
        if(!((/\bdebug=true\b/).test(url) && /\bdebugLevel=(\d+)/.test(url))){
            pvc.debug = 3;
        }
    }
}());

var tryMe = (function(){
    
    var _listeners = [];
    
    function tryMe(e){
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
                code = $.trim(code);
                $textArea.val(code);
                
                // In IE document mode 8 the editor doesn't work well
                // In other IE variants the css also doesn't work very well
                var betterNot = !pv.have_SVG && pv.have_VML;
                if(!betterNot){
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
                            lineWrapping:  true,
                            lineNumbers:   false,
                            indentUnit:    4,
                            autofocus:     false,
                            matchBrackets: true,
                            keyMap:        'ccc'
                        });
                    }
                    
                    var $parentDiv = $textArea.parent();
                    var $chartDiv  = $parentDiv.parent().find('.chartDiv');
                    var $chartDefs = $parentDiv.parent().find('.chartDefs');
                    var $scrollBox = $parentDiv.find('.CodeMirror-scroll');
                    var $lines     = $parentDiv.find('.CodeMirror-lines');
                    var $codeBox   = $parentDiv.find('.CodeMirror');
                    
                    var maxHeight  = $lines.height() + 40;
                    var maxWidth   = $chartDiv.width();
                    
                    $scrollBox.css({
                        'height': maxHeight + 'px'
                    });
                    
                    var reWidth  = /\b(width\s*:\s*)(.*?)(\s*[,}])/;
                    var reHeight = /\b(height\s*:\s*)(.*?)(\s*[,}])/;
                    var reCanvas = /\b(canvas\s*:\s*)(.*?)(\s*[,}])/;
                    
                    // Fix width and height
                    var width;
                    var m = reWidth.exec(code);
                    if(m){
                        width = +m[2];
                    }
                    
                    var height;
                    m = reHeight.exec(code);
                    if(m){
                        height = +m[2];
                    }
                    
                    m = reCanvas.exec(code);
                    if(!m){
                        code = code.replace(/\{/, function(){
                            return '{canvas: "", ';
                        });
                    }
                    
                    var ar;
                    if(height && width){
                        ar = width / height;
                    } else {
                        ar = 4/3;
                    }
                    
                    width  = maxWidth;
                    height = Math.min(width / ar, $chartDefs.height());
                    
                    var canvasId = $chartDiv[0].id;
                    if(!canvasId){
                        canvasId = 'cccDiv' + (new Date()).getTime();
                        $chartDiv.attr('id', canvasId);
                    }
                    
                    // Replace
                    code = code
                        .replace(reWidth, function($0, $1, $2, $3){
                            return $1 + width + $3;
                        })
                        .replace(reHeight, function($0, $1, $2, $3){
                            return $1 + height + $3;
                        })
                        .replace(reCanvas, function($0, $1, $2, $3){
                            return $1 + '"' + canvasId + '"' + $3;
                        })
                        ;
                }
                
                /*jshint evil:true */
                eval(code);
            }
        } catch(ex) {
            /*global alert:true */
            alert("Try me error: " + ex);
        } finally {
            _listeners.forEach(function(handler){
                handler();
            });
        }
    }
    
    tryMe.listen = function(handler){
        _listeners.push(handler);
    };
    
    return tryMe;
}());

$(function(){
 // When everything is ready, click all tryMe buttons
    tryAllExamples();
    
    // Check for the existence of a parent frame
    // and a ctoolsOnLoad property.
    var parentFrame = window.frameElement;
    if(parentFrame && parentFrame.ctoolsOnLoad){
        parentFrame.ctoolsOnLoad(window);
    }
});

function tryAllExamples(){
    $("button.tryMe").click();
}
