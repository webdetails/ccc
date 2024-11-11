/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
$(document).ready(function(){


	$('.mainConceptOption').click(function() {
		$conceptContainer = $(this).closest('.row');
		$conceptContainer.find('.mainConceptOption').removeClass('active');
		$conceptContainer.find('.mainConceptContent').removeClass('active');
		$(this).addClass('active');
		var myID = $(this).attr('id');
		myID = "" + myID + "Content";
		$conceptContainer.find('#'+myID).addClass('active');
	});

	if (!Modernizr.svg) {
		navbarSrc = $("a.navbar-brand img").attr("src");
		navbarSrc = navbarSrc.replace('svg','png');
	  	$("a.navbar-brand img").attr("src", navbarSrc);
	}
	$("a.navbar-brand").attr("target", "_blank");

});

function removeOpen() {
	if((($('.dropdown-menu').is(":hover") == false) && ($('.dropdown').is(":hover") == false)) && ($(window).width() > 920)) {
		$('.dropdown').removeClass('open');
	}
}

function filterItems(input) {
	$('.dev-item').hide();
	searchingTitle = input.toUpperCase();

	$('.dev-item').each(function() {
		itemTitle = $(this).find('p.in-development-title').text().toUpperCase();
		if(itemTitle.indexOf(searchingTitle) > 0) {
			$(this).show();
		}
	});

	if(input == '') {
		$('.dev-item').show();
	}
}
