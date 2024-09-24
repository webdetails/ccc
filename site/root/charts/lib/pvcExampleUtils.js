/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
    var url;
    /*global window:true */
    if(typeof (url = window.location.href) !== 'undefined') {
        if(!((/\bdebug=true\b/).test(url) && /\bdebugLevel=(\d+)/.test(url))) {
            def.setDebug(3);
        }
    }
}());

var tryMe = (function() {
    
    var _listeners = [];
    var _reWidth  = /\b(width\s*:\s*)(.*?)(\s*[,}])/;
    var _reHeight = /\b(height\s*:\s*)(.*?)(\s*[,}])/;
    var _reCanvas = /\b(canvas\s*:\s*)(.*?)(\s*[,}])/;
    
    function tryMe(e) {
        /*global CodeMirror:true */
        try{
            var $e = $(e);
            var $textArea = $e.prevAll("textarea");
            var textArea = $textArea[0];
            var codeMirror = textArea._codeMirror;
            if(codeMirror) { codeMirror.save(); }
            
            var code = $textArea.val();
            if(code) {
                code = $.trim(code);
                $textArea.val(code);
                
                // In IE document mode 8 the editor doesn't work well
                // In other IE variants the css also doesn't work very well
                var betterNot = !pv.have_SVG && pv.have_VML;
                if(!betterNot) {
                    if(!codeMirror) {
                        if(!CodeMirror.keyMap.ccc) {
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
                            keyMap:        'ccc',
                            viewportMargin: Infinity
                        });
                    }
                    
                    // Fix width and height
                    var width;
                    var m = _reWidth.exec(code);
                    if(m) { width = +m[2]; }
                    
                    var height;
                    m = _reHeight.exec(code);
                    if(m) { height = +m[2]; }
                    
                    m = _reCanvas.exec(code);
                    if(!m) {
                        code = code.replace(/\{/, function() { return '{canvas: "", '; });
                    }
                    
                    var ar;
                    if(height && width) { ar = width / height; } 
                    else                { ar = 4/3;            }
                    
                    var $chartDiv = $textArea.parent().parent().find('.chartDiv');
                    width  = $chartDiv.width();
                    height = Math.floor(width / ar);
                    
                    var canvasId = $chartDiv[0].id;
                    if(!canvasId) {
                        canvasId = 'cccDiv' + (new Date()).getTime();
                        $chartDiv.attr('id', canvasId);
                    }
                    
                    // Replace
                    code = code
                        .replace(_reWidth, function($0, $1, $2, $3) {
                            return $1 + width + $3;
                        })
                        .replace(_reHeight, function($0, $1, $2, $3) {
                            return $1 + height + $3;
                        })
                        .replace(_reCanvas, function($0, $1, $2, $3) {
                            return $1 + '"' + canvasId + '"' + $3;
                        })
                        ;
                }
                
                /*jshint evil:true */
                //eval(code); causes problems when debugging on Chrome
                new Function(code)();
            }
        } catch(ex) {
            $e.addClass('btn-error3d').delay(0).queue(function(next){
                $(this).removeClass("btn-error3d");
                $(this).removeClass("btn-success3d");
                next();
            });
            /*global alert:true */
            alert("Try me error: " + ex);
        } finally {
            _listeners.forEach(function(handler) { handler(); });
        }
    }
    
    tryMe.listen = function(handler) { _listeners.push(handler); };
    
    return tryMe;
}());

$(function() {
    // When everything is ready, click all tryMe buttons
    tryAllExamples();
    
    // Check for the existence of a parent frame
    // and a ctoolsOnLoad property.
    var parentFrame = window.frameElement;
    if(parentFrame && parentFrame.ctoolsOnLoad){
        parentFrame.ctoolsOnLoad(window);
    }
});

function tryAllExamples() { $("button.tryMe").click(); }

$(document).ready(function() {
    $('button.btn.tryMe').click(function() {
        $(this).addClass('btn-success3d').delay(2000).queue(function(next){
            $(this).removeClass("btn-success3d");
            next();
        });
    });
});