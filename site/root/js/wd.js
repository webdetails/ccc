// JavaScript Document

//preload images
function preload(arrayOfImages) {
	$(arrayOfImages).each(function() {
		$('<img/>')[0].src = this;
	});
}

//scroll to menu position and hide webdetails logo
function slideUpWebdetails() {
	if (navigator.userAgent.match(/iPhone|iPod|Android|BlackBerry/i)) {
		$('body,html').delay(1500).animate({
			scrollTop : 105
		}, 800);
	}
}

//generate random image for main pages' headers
function getImageTag(type) {
	//index.html
	if (type == 'main') {
		var imageURLs = ["images/headertest3.png", "images/headertest2.png", "images/headertest1.png"];
	} else if (type == 'mobile') {
		var imageURLs = ["images/headertest1_m.png", "images/headertest1_m.png", "images/headertest1_m.png"];
	}

	//return random image to where the function was called
	var img = '<img src=\"';
	var randomIndex = Math.floor(Math.random() * imageURLs.length);
	img += imageURLs[randomIndex];
	img += '\" alt=\"Webdetails. Lead your business.\"/>';
	return img;
}

//add behaviours which are common to every single page
function addCommonBehaviour() {
	//prevent link and image dragging
	$('img').bind('dragstart', function(event) {
		event.preventDefault();
	});
	$('a').bind('dragstart', function(event) {
		event.preventDefault();
	});

	$('a, .item').hover(function(e) {
		if ($(this).hasClass('someClass') == false) {
			$(this).attr('data-title', $(this).attr('title'));
			$(this).removeAttr('title');
		}
	}, function(e) {
		if ($(this).hasClass('someClass') == false) {
			$(this).attr('title', $(this).attr('data-title'));
		}
	});

	$('.options').find('a').click(function() {
		scrollToTop(100);
	});
}

//fix the filters menu
function fixMenu() {
	if ($(this).scrollTop() > 0 && navigator.userAgent.match(/iPhone|iPod|Android|BlackBerry|iPad/i) == null && $(window).width() > 480 && $('body').hasClass('ipad') == false) {
		$('.options ul').addClass('largerOptions');

	} else if ($(this).scrollTop() == 0 && navigator.userAgent.match(/iPhone|iPod|Android|BlackBerry|iPad/i) == null && $(window).width() > 480 && $('body').hasClass('ipad') == false) {
		$('.options ul').removeClass('largerOptions');
	}
}

//fix the ctools filters menu
function fixMenuCtools() {
	if ($(this).scrollTop() > 0 && navigator.userAgent.match(/iPhone|iPod|Android|BlackBerry|iPad/i) == null && $(window).width() > 480 && $('body').hasClass('ipad') == false) {
		$('#optionsctools ul').addClass('largerOptionsCtools');
	} else if ($(this).scrollTop() == 0 && navigator.userAgent.match(/iPhone|iPod|Android|BlackBerry|iPad/i) == null && $(window).width() > 480 && $('body').hasClass('ipad') == false) {
		$('#optionsctools ul').removeClass('largerOptionsCtools');
	}
}

//back to top button interaction
function goToTop() {
	if ($(this).scrollTop() != 0 && navigator.userAgent.match(/iPhone|Android|BlackBerry|iPad/i) == null && $(window).width() > 480) {
		$('#toTop').fadeIn();
	} else {
		$('#toTop').fadeOut();
	}
}

//scroll to top
function scrollToTop(time) {
	$('body,html').animate({
		scrollTop : 0
	}, time);
}

//adjust fixed menu shadows
function adjustShadows() {
	if ($(this).scrollTop() != 0 && navigator.userAgent.match(/iPhone|Android|BlackBerry/i) == null && $(window).width() > 480 && $('body').hasClass('ipad') == false) {
		$('.fixedmenu').css({
			'box-shadow' : "none",
			'-webkit-box-shadow' : "none"
		});
		//$('.fixedmenu').css({'background-color':"#fff"});
		//$('.fixedmenu ul').animate({width:"55%"},500);
	} else {
		//$('.fixedmenu ul').animate({width:"50%"},500);
		$('.fixedmenu').css({
			'box-shadow' : "none",
			'-webkit-box-shadow' : "none"
		});
		//$('.fixedmenu').css({'background-color':"#EFF5F7"});
	}
}

//add goBack button
function addGoBack() {
	//check if there is any browser history, and if there is, add goback link
	//if not, add class no-back to body
	if (window.history.length > 1) {
		$('.fixedmenuContent').prepend("<p class='goBack'></p>");
	} else {
		$('body').addClass('no-back');
	}

	//go to previous page on goback click
	$('.goBack').click(function() {
		window.history.back();
	});

	$(".goBack").hover(function() {
		$(".goBack").css('cursor', 'pointer');
	});
}

//check browser and add proper classes
function verifyBrowser() {
	if (navigator.userAgent.match(/iPhone|Android|BlackBerry|iPad/i) == null && $(window).width() >= 480) {
		$('body').addClass('no-touch');
	} else {
		$('body').removeClass('no-touch');
	}
	if (navigator.userAgent.match(/Android|iPad/i) != null) {
		$('body').addClass('ipad');
	}
}

//slide to hash if it exists
function ctoolsSlideToHash() {
	if (location.hash) {
	    var $target = $(location.hash);
	    if($target.length) {
	        ctoolsSlideToPosition($target.offset().top);
	    }
	}
}

function ctoolsSlideToPosition(offsetTop) {
    if ($('#header-navigation').css('position') == 'fixed') {
        $('html, body').stop().animate({
            scrollTop : offsetTop - 156
        }, 800);
    } else {
        $('html, body').stop().animate({
            scrollTop : offsetTop - 20
        }, 800);
    }
}

function slideToHash() {
	if (location.hash) {
	    var $target = $(location.hash);
        if($target.length) {
            var offsetTop = $target.offset().top;
    		if ($('#header-navigation').css('position') == 'fixed') {
    			$('html, body').stop().animate({
    				scrollTop : offsetTop - 156
    			}, 800);
    		} else {
    			$('html, body').stop().animate({
    				scrollTop : offsetTop - 20
    			}, 800);
    		}
        }
	}
}

function ctoolsScrollBehaviour() {
	//<![CDATA[
	$(window).load(function() {
		// Cache selectors
		var lastId, 
		    topMenu = $(".fixedmenu ul"), 
		    topMenuHeight = 140,
		    
		    // All list items
		    menuItems = topMenu.find("a"),
		    
		    // Anchors corresponding to menu items
		    scrollItems = menuItems.map(function() {
		        var item = $($(this).attr("href"));
    			if (item.length) { return item; }
    		});

		// Bind click handler to menu items
		// so we can get a fancy scroll animation
		menuItems.click(function(e) {
			if ($('#header-navigation').css('position') == 'fixed') {
				var href = $(this).attr("href"), 
				    offsetTop = href === "#" ? 0 : $(href).offset().top - 180;
			} else if ($('#header-navigation').css('position') == 'relative'){
				var href = $(this).attr("href"), 
				    offsetTop = href === "#" ? 0 : $(href).offset().top - 20;
			}
			
			var scrollTop = $(window).scrollTop();
			$('html, body')
			    .stop()
			    .animate(
			        {scrollTop: offsetTop}, 
			        Math.abs(offsetTop - scrollTop));
			
			e.preventDefault();
		});

		// Bind to scroll
		$(window).scroll(function() {
			// Get container scroll position
			var fromTop = $(this).scrollTop() + 200;

			// Get id of current scroll item
			var cur = scrollItems.map(function() {
				if ($(this).offset().top < fromTop)
					return this;
			});
			// Get the id of the current element
			cur = cur[cur.length - 1];
			var id = cur && cur.length ? cur[0].id : "";

			if (lastId !== id) {
				lastId = id;
				// Set/remove active class
				menuItems.parent().removeClass("selected").end().filter("[href=#" + id + "]").parent().addClass("selected");
			}
		});
	});
}

function cccScrollBehaviour() {
	//<![CDATA[
	$(window).load(function() {
		// Cache selectors
		var lastId, topMenu = $(".fixedmenu ul"), topMenuHeight = 200,
		// All list items
		menuItems = topMenu.find("a"),
		// Anchors corresponding to menu items
		scrollItems = menuItems.map(function() {
			var item = $($(this).attr("href"));
			if (item.length) {
				return item;
			}
		});

		// Bind click handler to menu items
		// so we can get a fancy scroll animation
		menuItems.click(function(e) {
			if ($('#header-navigation').css('position') == 'fixed') {
				var href = $(this).attr("href"), offsetTop = href === "#" ? 0 : $(href).offset().top - 180;
			} else if ($('#header-navigation').css('position') == 'relative'){
				var href = $(this).attr("href"), offsetTop = href === "#" ? 0 : $(href).offset().top - 20;
			}
			$('html, body').stop().animate({
				scrollTop : offsetTop
			}, 800);
			e.preventDefault();

		});

		// Bind to scroll
		$(window).scroll(function() {
			// Get container scroll position
			var fromTop = $(this).scrollTop() + 200;

			// Get id of current scroll item
			var cur = scrollItems.map(function() {
				if ($(this).offset().top < fromTop)
					return this;
			});
			// Get the id of the current element
			cur = cur[cur.length - 1];
			var id = cur && cur.length ? cur[0].id : "";

			if (lastId !== id) {
				lastId = id;
				// Set/remove active class
				menuItems.parent().removeClass("selected").end().filter("[href=#" + id + "]").parent().addClass("selected");
			}
		});
	});
}


$(window).load(function() {
	// on click go to top
	$('#toTop').click(function() {
		scrollToTop(800);
	});
});

// TOOTLTIP EXP
function addTooltips() {
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) == false) {
		$(".someClass").tipTip({
			maxWidth : "150px",
			edgeOffset : 3,
			delay : 200,
			fadeIn : 400
		});
	}
}

function myChangelog(url, windowname) {
	window.open(url, windowname, "resizable=no,toolbar=no,scrollbars=yes,menubar=no,status=no,directories=no,width=400,height=300,left=25,top=25");
}