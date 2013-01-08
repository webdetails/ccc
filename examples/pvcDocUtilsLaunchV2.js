
(function(){
    var url;
    /*global window:true */
    if(typeof (url = window.location.href) !== 'undefined'){
        if(!((/\bdebug=true\b/).test(url) && /\bdebugLevel=(\d+)/.test(url))){
            pvc.debug = 0;
        }
    }
}());

var tryMe = function(e){
    /*global CodeMirror:true */
    
    try{
        var $textArea = $(e).prevAll("textarea");
        var code = $textArea.val();
        
        /*jshint evil:true */
        eval(code);
    } catch(ex) {
        /*global alert:true */
        alert("Try me error: " + ex);
    }
};

