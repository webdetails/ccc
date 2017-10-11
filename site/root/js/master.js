/* Modernizr 2.8.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-flexbox-svg-touch-cssclasses-teststyles-testprop-testallprops-prefixes-domprefixes
 */
;window.Modernizr=function(a,b,c){function A(a){j.cssText=a}function B(a,b){return A(m.join(a+";")+(b||""))}function C(a,b){return typeof a===b}function D(a,b){return!!~(""+a).indexOf(b)}function E(a,b){for(var d in a){var e=a[d];if(!D(e,"-")&&j[e]!==c)return b=="pfx"?e:!0}return!1}function F(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:C(f,"function")?f.bind(d||b):f}return!1}function G(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+o.join(d+" ")+d).split(" ");return C(b,"string")||C(b,"undefined")?E(e,b):(e=(a+" "+p.join(d+" ")+d).split(" "),F(e,b,c))}var d="2.8.2",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n="Webkit Moz O ms",o=n.split(" "),p=n.toLowerCase().split(" "),q={svg:"http://www.w3.org/2000/svg"},r={},s={},t={},u=[],v=u.slice,w,x=function(a,c,d,e){var f,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),l.appendChild(j);return f=["&#173;",'<style id="s',h,'">',a,"</style>"].join(""),l.id=h,(m?l:n).innerHTML+=f,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=g.style.overflow,g.style.overflow="hidden",g.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),g.style.overflow=k),!!i},y={}.hasOwnProperty,z;!C(y,"undefined")&&!C(y.call,"undefined")?z=function(a,b){return y.call(a,b)}:z=function(a,b){return b in a&&C(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=v.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(v.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(v.call(arguments)))};return e}),r.flexbox=function(){return G("flexWrap")},r.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:x(["@media (",m.join("touch-enabled),("),h,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c},r.svg=function(){return!!b.createElementNS&&!!b.createElementNS(q.svg,"svg").createSVGRect};for(var H in r)z(r,H)&&(w=H.toLowerCase(),e[w]=r[H](),u.push((e[w]?"":"no-")+w));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)z(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" "+(b?"":"no-")+a),e[a]=b}return e},A(""),i=k=null,e._version=d,e._prefixes=m,e._domPrefixes=p,e._cssomPrefixes=o,e.testProp=function(a){return E([a])},e.testAllProps=G,e.testStyles=x,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+u.join(" "):""),e}(this,this.document);

/*!
 * jQuery Cookie Plugin v1.3.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function(e){if(typeof define==="function"&&define.amd){define(["jquery"],e)}else{e(jQuery)}})(function(e){function n(e){return e}function r(e){return decodeURIComponent(e.replace(t," "))}function i(e){if(e.indexOf('"')===0){e=e.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\")}try{return s.json?JSON.parse(e):e}catch(t){}}var t=/\+/g;var s=e.cookie=function(t,o,u){if(o!==undefined){u=e.extend({},s.defaults,u);if(typeof u.expires==="number"){var a=u.expires,f=u.expires=new Date;f.setDate(f.getDate()+a)}o=s.json?JSON.stringify(o):String(o);return document.cookie=[s.raw?t:encodeURIComponent(t),"=",s.raw?o:encodeURIComponent(o),u.expires?"; expires="+u.expires.toUTCString():"",u.path?"; path="+u.path:"",u.domain?"; domain="+u.domain:"",u.secure?"; secure":""].join("")}var l=s.raw?n:r;var c=document.cookie.split("; ");var h=t?undefined:{};for(var p=0,d=c.length;p<d;p++){var v=c[p].split("=");var m=l(v.shift());var g=l(v.join("="));if(t&&t===m){h=i(g);break}if(!t){h[m]=i(g)}}return h};s.defaults={};e.removeCookie=function(t,n){if(e.cookie(t)!==undefined){e.cookie(t,"",e.extend({},n,{expires:-1}));return true}return false}});


/*! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL Version 2 (GPL_LICENSE.txt) licenses.
 *
 * Version: 1.1.1
 * Requires jQuery 1.3+
 * Docs: http://docs.jquery.com/Plugins/livequery
 */

(function(e){e.extend(e.fn,{livequery:function(t,n,r){var i=this,s;if(e.isFunction(t))r=n,n=t,t=undefined;e.each(e.livequery.queries,function(e,o){if(i.selector==o.selector&&i.context==o.context&&t==o.type&&(!n||n.$lqguid==o.fn.$lqguid)&&(!r||r.$lqguid==o.fn2.$lqguid))return(s=o)&&false});s=s||new e.livequery(this.selector,this.context,t,n,r);s.stopped=false;s.run();return this},expire:function(t,n,r){var i=this;if(e.isFunction(t))r=n,n=t,t=undefined;e.each(e.livequery.queries,function(s,o){if(i.selector==o.selector&&i.context==o.context&&(!t||t==o.type)&&(!n||n.$lqguid==o.fn.$lqguid)&&(!r||r.$lqguid==o.fn2.$lqguid)&&!this.stopped)e.livequery.stop(o.id)});return this}});e.livequery=function(t,n,r,i,s){this.selector=t;this.context=n;this.type=r;this.fn=i;this.fn2=s;this.elements=[];this.stopped=false;this.id=e.livequery.queries.push(this)-1;i.$lqguid=i.$lqguid||e.livequery.guid++;if(s)s.$lqguid=s.$lqguid||e.livequery.guid++;return this};e.livequery.prototype={stop:function(){var e=this;if(this.type)this.elements.unbind(this.type,this.fn);else if(this.fn2)this.elements.each(function(t,n){e.fn2.apply(n)});this.elements=[];this.stopped=true},run:function(){if(this.stopped)return;var t=this;var n=this.elements,r=e(this.selector,this.context),i=r.not(n);this.elements=r;if(this.type){i.bind(this.type,this.fn);if(n.length>0)e.each(n,function(n,i){if(e.inArray(i,r)<0)e.event.remove(i,t.type,t.fn)})}else{i.each(function(){t.fn.apply(this)});if(this.fn2&&n.length>0)e.each(n,function(n,i){if(e.inArray(i,r)<0)t.fn2.apply(i)})}}};e.extend(e.livequery,{guid:0,queries:[],queue:[],running:false,timeout:null,checkQueue:function(){if(e.livequery.running&&e.livequery.queue.length){var t=e.livequery.queue.length;while(t--)e.livequery.queries[e.livequery.queue.shift()].run()}},pause:function(){e.livequery.running=false},play:function(){e.livequery.running=true;e.livequery.run()},registerPlugin:function(){e.each(arguments,function(t,n){if(!e.fn[n])return;var r=e.fn[n];e.fn[n]=function(){var t=r.apply(this,arguments);e.livequery.run();return t}})},run:function(t){if(t!=undefined){if(e.inArray(t,e.livequery.queue)<0)e.livequery.queue.push(t)}else e.each(e.livequery.queries,function(t){if(e.inArray(t,e.livequery.queue)<0)e.livequery.queue.push(t)});if(e.livequery.timeout)clearTimeout(e.livequery.timeout);e.livequery.timeout=setTimeout(e.livequery.checkQueue,20)},stop:function(t){if(t!=undefined)e.livequery.queries[t].stop();else e.each(e.livequery.queries,function(t){e.livequery.queries[t].stop()})}});e.livequery.registerPlugin("append","prepend","after","before","wrap","attr","removeAttr","addClass","removeClass","toggleClass","empty","remove","html");e(function(){e.livequery.play()})})(jQuery)

// Misc functions
function equalHeights(elements) {var max_height = 0; elements.each(function(){if(jQuery(this).height() > max_height){max_height = jQuery(this).height(); } });elements.height(max_height); };

jQuery(document).ready(function($){
	// Customers page
	$('.featured-customer-item').hover(function() {
		$(this).siblings().toggleClass('featured-customer-item-skinny');
	});
	// prevent click to go anywhere on editions table
	$('.table-compare-popup-link').on('click',function(e){
		return false;
	});

	//------------------------------------------------------------------------------
	// Click Toggle
	//------------------------------------------------------------------------------
	$('.super-nav .nolink').addClass('click-toggle').closest('.menu-item-wrapper').addClass('click-toggle-target');
	// Toggle showing the drop-down items in the Super Nav
	$('.click-toggle').on('click',function(e){
		$(this).closest('.click-toggle-target').toggleClass('active')
		.on('mouseleave', function() {
			$(this).removeClass('active');
		});
	});

	// smooth scroll on film strip nav
	var root = $('html, body');
	$('a.link-scroll').click(function() {
		$(this).addClass('active').siblings().removeClass('active');
		var href = $.attr(this, 'href');
		root.animate ({
			scrollTop: ($(href).offset().top - 20)
		}, 500, 'swing', function () {
			window.location.hash = href;
		});
		return false;
	});

	// make the first item in the film-strip-nav be selected on default:
	$('.film-strip-nav .film-strip-nav-item:first-child').addClass('active');

	var tabGroup = $('.tab-group');
	// Eric's super-simple tab groups
	tabGroup.livequery(function() {
		$(this).on('click','.tab-group-tabs-item', function() {
			$(this).addClass('active').siblings().removeClass('active');
			var href = $(this).attr('href');
			$(this).closest('.tab-group').find('.tab-group-main-item').filter(href).addClass('active').siblings().removeClass('active');
			// Add equalheights to tabs in Advanced template
			//if ($('.node-type-advanced').length > 0) {
			//	var tabId = href.substr(1);
			//	equalHeights($('.equalheight-' + tabId));
			//}
			return false;
		});
	});

	// Extend hover functionality to tab groups
	$('.tab-group-tabs-item.extend-hover').on('hover', function() {
		$(this).addClass('active').siblings().removeClass('active');
		var href = $(this).attr('href');
		$(this).closest('.tab-group').find('.tab-group-main-item').filter(href).addClass('active').siblings().removeClass('active');
	});

	// Set equal heights
	equalHeights($('.equalheight'));
	//equalHeights($('.valprop-content, .media-object'));
	// Initial equalheight for tabs in Advanced template:
	// On click, the heights get updated within the 'tabGroup' function above
	//if ($('.node-type-advanced').length > 0) {
	//	var tabId = $('.tab-group-main-item.active').attr('id');
	//	equalHeights($('.equalheight-' + tabId));
	//}

	// On "Try Hitachi Vantara", the paragraph that starts with an asterisk into "small-text"
	$('.cta-image-block-item p').filter(function() {
		return $(this).text().search(/\*/) == 0;
	}).addClass('small-text');

	// On "Editions", hide the SPACER row from showing
	$('.table-compare td .table-compare-popup-link').filter(function() {
		return $(this).text().search(/SPACER/) == 0;
	}).closest('tr').addClass('no-show');




	// on the about us page, make the video-link play the youtube video
	$('.video-link').on('click',function() {
		var youtube = $(this).data('youtube');
		$(this).addClass('play-youtube').find('.video-placeholder').show().append('<iframe width="630" height="354" src="http://www.youtube.com/embed/' + youtube + '?autoplay=1&rel=0" frameborder="0" allowfullscreen class="video-player"></iframe>').siblings().hide()
		return false;
	});



	// reset all the videos on tab change
	$('.video-tab').on('click', function() {
		$('.video-player').remove();
		$('.video-placeholder').hide();
		$('.video-image').show();
		$('.video-copy').show();
	});

	// resources page (/resources): auto-submit exposed filters that are select lists
	$('#views-exposed-form-resources-default select').change(function() {
		$(this).parents('form').submit();
	});

	// Events page
	var isEventsPage = $('body').hasClass('page-node-73');
	if (isEventsPage) {
		// only show exposed filter for current event type
		var checked = $('#edit-event-type input:checked').next().text();
		// show region and language filters based on event type
		if (checked.toLowerCase().indexOf("conferences") >= 0) {
			$('#edit-event-region-layout-wrapper').show();
			$('#edit-event-language-layout-wrapper').hide();
		} else if (checked.toLowerCase().indexOf("webinars") >= 0) {
			$('#edit-event-language-layout-wrapper').show();
			$('#edit-event-region-layout-wrapper').hide();
		}

		// select list behavior
		$('#edit-event-language-wrapper, #edit-event-region-wrapper').livequery(function() {
			var editEventNew = $(this);
			var editEventTitle = $(editEventNew).find('.title');
			var newLabel = $(editEventNew).find('.form-item input:checked').next().text();

			if (newLabel != '- Any - ') {
				$(editEventTitle).text(newLabel);
			}

			$(editEventNew).on('click', function(event) {
				$(editEventNew).addClass('active');
			});

			$(editEventNew).on('hover', function() {}, function() {
				$(editEventNew).removeClass('active');
			});

			$('#edit-event-region-all + label').text('All Regions');
			$('#edit-event-language-all + label').text('All Languages');
		});
	};

	// CLICK TOGGLE
	var clickToggle = $('.click-toggle-wrapper');
	$(clickToggle).on('click','.click-toggle',function(e) {
		e.stopPropagation();
		if ($(this).hasClass('dont-toggle')) {
			$(this).addClass('active').siblings().removeClass('active');
			$(this).find('.form-text').focus();
		} else {
			$(this).toggleClass('active').siblings().removeClass('active');
		}
	});

	$(document).on('click',function() {
		$('.click-toggle').removeClass('active');
	});

	// Gear up Partners for Atlas view:
	// var partnersAtlasLabel = $('.partners-atlas label');
	// $(partnersAtlasLabel).livequery(function() {
	// 	$(this).on('click',function(){
	// 		$(this).closest('.partners-section-wrapper').toggleClass('show-right');

	// 		// var regionID = $(this).find('input').attr('value');
	// 		// var regionName = $(this).find('label').text();
	// 		// $(this).find('label').text('').append('<span class="title">'+regionName+'</span>').on('click',function(e) {
	// 		// 	$(this).closest('.partners-section-wrapper').toggleClass('show-right');
	// 		// });
	// 		// $(this).addClass('region-'+regionID);
	// 		// $(this).append('<div class="overlay"></div>');

	// 	});
	// });

	// Partners page
	var partnersSectionWrapper = $('.partners-section-wrapper');
	var partnersSection1Height = $('.partners-section-1').height();
	var partnersSection2       = $('.partners-section-2');

	// make partners list the same height as the maps content
	partnersSection2.css('height', partnersSection1Height + 'px');

	partnersSectionWrapper.on('click','.toggle-move', function() {
		$(this).closest('.partners-section-wrapper').addClass('show-right').find('.tab-region').addClass('active').siblings().removeClass('active');
		$('.tab-group-main-item').filter('[id*=tab-region]').addClass('active').siblings().removeClass('active');
		// reset partners list content height
		partnersSection2.css('height', 'auto');
		return false;
	}).on('click','.toggle-back, .partners-section-1', function() {
		$(this).closest('.partners-section-wrapper').removeClass('show-right');
		// make partners list the same height as the maps content
		partnersSection2.css('height', partnersSection1Height + 'px');
		return false;
	});


	// var chooseRegion = partnersSectionWrapper.find('.choose-region');
	partnersSectionWrapper.livequery(function() {
		$(this).on('click','.region', function() {
			var region = $(this).attr('href');
			$('.region').filter('[href='+region+']').addClass('active').siblings().removeClass('active');
			$(region).addClass('active').siblings().removeClass('active');
			return false;
		});
	});

	// Slide Open Next
	// var slideOpenWrapperWrapper = $('.slide-open-wrapper-wrapper');
	partnersSectionWrapper.on('click','.slide-open',function(e) {
		if ($(this).hasClass('open')) {
			$(this).removeClass('open').next().slideUp('fast');
		} else {
			$(this).removeClass('open').next().slideUp('fast');
			$(this).toggleClass('open').next().slideToggle('fast');
		}
		e.preventDefault();
	});

	// add the clicked section to the data attribute. For some reason, data $ was not working correctly at
	var partnersSectionWrapper = $('.partners-section-wrapper');
	partnersSectionWrapper.livequery(function(){

		$(this).on('mousedown','label',function() {
			var clickedSection = $(this).closest('.tab-group-main-item').attr('id');
			var clickedRegion = $('a.region').filter('.active').attr('href');
			// console.log(clickedRegion);
			$('.partners-section-wrapper').attr({'data-clicked-section':clickedSection,'data-clicked-region':clickedRegion});
		});

	});



	// on partners page, on success, repopulate what's active
	$(document).ajaxSuccess(function() {
		var dataClickedSection = $('.partners-section-wrapper').attr('data-clicked-section');
		var dataClickedRegion = $('.partners-section-wrapper').attr('data-clicked-region');

		// console.log('Region: '+dataClickedRegion);
		// console.log('Section: '+dataClickedSection);

		$('#'+dataClickedSection).addClass('active').siblings().removeClass('active');
		
		$('[href='+dataClickedRegion+']').addClass('active');

		var currentTypes = $('.exposed-filter-type').find('input:checked');
		currentTypes.each(function(){
			currentType = $(this);
			currentTypeLabel = currentType.next('label').text().trim();
			if (currentTypeLabel != 'All') {
				currentType.closest('.tab-group').find('.tab-type').text('Type ('+currentTypeLabel+')')
			}
		})
		var currentRegions = $('.exposed-filter-region').find('input:checked');
		currentRegions.each(function(){
			currentRegion = $(this);
			currentRegionLabel = currentRegion.next('label').text().trim();
			if (currentRegionLabel != 'All') {
				currentRegion.closest('.tab-group').find('.tab-region').text('Region ('+currentRegionLabel+')')
			}
		})
	});

	// On resources, takes the data-link and puts it into the inbound cookie
	$('.resource-link').on('click',function() {
		var dataLink = $(this).attr('data-link');
		$.cookie("inbound", dataLink, {path: '/', expires: 256 });
	})

	// On resources, where the links are loaded via ajax, we add the click function as a callback to ajaxComplete.
	// The function above only works on links that already exist on the page, it cannot add the click functionality
	// to links added after $ runs.
	$(document).ajaxComplete(function() {
		$('.resource-link').on('click',function() {
			var dataLink = $(this).attr('data-link');
			$.cookie("inbound", dataLink, {path: '/', expires: 256 });
		})
	});



		//------------------------------------------------------------------------------
	// Touch Hover
	//
	// Requires:
	//   modernizr.js (adds the 'touch' and 'no-touch' class the the html element)
	//
	// Setup:
	//   Add 'touch-hover' class to any element you'd like to make "hover" on touch.
	//   Optional:
	//     Witin 'touch-hover' element set 'data-touch-hover--target-recipient="any-name"'
	//     to point to data-touch-hover--target-name="any-name"
	//
	// Returns:
	//   Adds the 'hover' class on hover or touch to the 'touch-hover' class
	//   Optionally adds 'hover' to the 'data-touch-hover--target-name' element
	//
	// to do: must disable the close-touch event when inside the exposed area
	//------------------------------------------------------------------------------
	function touchHoverClear() {
		// only run the touchHoverClear after all the if statements have been run.
		// otherwise, you'll be clearing before you get answers. :)
		$('.touch-hover').removeClass('hover');
		$('[data-touch-hover--target-name]').removeClass('hover');
	}
	function touchHover(event) {
		if ($(event.target).closest('.touch-hover')) {
			var $touchHoverItem = $(event.target).closest('.touch-hover');

			if (event.type === 'click' && $touchHoverItem.hasClass('hover')) {
				// you can clear the hover by performing a 'click'
					if (  $(event.target).is('.hover[data-touch-hover--target-name]')
							 || $(event.target).is('.hover[data-touch-hover--target-name] *') ) {
						} else {
						touchHoverClear();
						}
			} else { // hover
				if (  $(event.target).is('.hover[data-touch-hover--target-name]')
						 || $(event.target).is('.hover[data-touch-hover--target-name] *') ) {
							// console.log('here');
							// only pre-clear if you're not on the data-touch-over area.
					} else {
					touchHoverClear();
					}
				// check to see if there's data to make active:
				$touchHoverItem.addClass('hover');
				// make the data-touch-hover--target-recipient "hover" if available
				$('[data-touch-hover--target-name=' + $touchHoverItem.attr('data-touch-hover--target-recipient') + ']').addClass('hover');
			}
		} else if (   $(event.target).is('.hover[data-touch-hover--target-name]')
						 || $(event.target).is('.hover[data-touch-hover--target-name] *') ) {
			// this just checks to see if you're on top of the hit item if it's in a different area
		} else {
			touchHoverClear();
		}
	}

	// $('html').on('click', function(){ touchHover(); });
	$('.menu-name-main-menu > .menu > .menu-item-wrapper').addClass('touch-hover'); // init custom places
	// $('.menu-name-main-menu > .menu > .menu-item-wrapper').first().addClass('hover'); // init custom places
	$('html.touch').on('click', function(event){ touchHover(event); });
	$('html.no-touch').on('mouseover', function(event){ touchHover(event); });

	//$('#archive-more-link').addClass('touch-hover'); // init custom places
	$("#archive-more-link").click(function(e){
	  $('.view-blog.view-display-id-block_2 .item-list').toggleClass("more");
	  $('#archive-more-link').html($('#archive-more-link').text() == 'Less ↑' ? 'More &#8595;' : 'Less ↑');
	  e.preventDefault();
  });

	//Responsive Menu Toggle
	$('#nav-toggle').click(function(e) {
  	$(this).add('#nav-container').toggleClass('open');
    e.preventDefault();
  });

	//Responsive Menu Sub-item Toggle
  $('.menu-name-main-menu li.expanded > .nolink, .menu-name-menu-super-nav li.expanded > .nolink').click(function(e){
    if($(this).parent().hasClass('open')) {
    	$(this).parent().removeClass('open');
    }
    else {
    	$(this).parent().addClass('open');
      $(this).parent().siblings().removeClass('open');
    }
    e.preventDefault();
  });

  //Resource Filter Toggle
	$('#filter-toggle').click(function(e) {
  	$(this).toggleClass('open');
  	$('.views-exposed-form').toggle();
    e.preventDefault();
  });

});

	//Slide Open Next
	// var slideOpen = jQuery('.slide-open');
	// jQuery(slideOpen).livequery(function(){
	// 	jQuery(this).on('click', function(e) {
	// 		if (jQuery(this).hasClass('open')) {
	// 			jQuery(this).removeClass('open').next().slideUp('fast');
	// 		} else {
	// 			jQuery(slideOpen).removeClass('open').next().slideUp('fast');
	// 			jQuery(this).toggleClass('open').next().slideToggle('fast');
	// 		}
	// 		e.preventDefault();
	// 	})
	// });
