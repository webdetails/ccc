$(document).ready(function(){

	$( ".copyClipboard" ).click(function(elem) {
		var $tempClipboard = $("<input>");
		$("body").append($tempClipboard);
		$tempClipboard.val(elem.target.href).select();
		document.execCommand("copy");
		$tempClipboard.remove();
	});

});
