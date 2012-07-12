
pvc.debug = 6;
var tryMe = function(e){ 
    try{
        /*jshint evil:true */
        eval( $(e).prev("textarea").val());
    } catch(ex){
        alert("Error: " + ex);
    }
};

pv.listenForPageLoad(function() {
    // When everything is ready, click all tryMe buttons
    $("button.tryMe").click();
});


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
            width:  $tableChartDiv.width(),
            height: $tableRow.height(),
            canvas: $tableChartDiv[0]
        });
        
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
   
    function renderAllChartExamples(){
        $("#examples div").remove();
        
        for(var id in chartExamples){ 
            $e.render(id);
        }
    }
});

pv.listenForPageLoad(function() {
    // When everything is ready, click all tryMe buttons
    $("button.tryMe").click();
    
    pvc.examples.renderAll();
});

$(window).resize(function(){
    
    pvc.examples.renderAll();
});