
pvc.debug = true;
var tryMe = function(e){ 
    try{
        eval( $(e).prev().val());
    }
    catch(e){
        alert("Error: " + e);
    }
}

pv.listenForPageLoad(function() {

    // When everything is ready, click all tryMe buttons
    $("button.tryMe").click();
    
    
});