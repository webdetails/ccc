/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/

$(document).ready(function(){

	$( ".copyClipboard" ).click(function(elem) {
		var $tempClipboard = $("<input>");
		$("body").append($tempClipboard);
		$tempClipboard.val(elem.target.href).select();
		document.execCommand("copy");
		$tempClipboard.remove();
	});

});
