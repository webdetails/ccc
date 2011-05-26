

var tryMe = function(e){ 
    console.log("Test " + e);
    eval($(e).prev().text());
}

pv.listenForPageLoad(function() {

    // When everything is ready, click all tryMe buttons
    $("button.tryMe").click();
    
    
});