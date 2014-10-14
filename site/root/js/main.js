$('document').ready(function() {
	$('img').bind('dragstart', function(event) {
		event.preventDefault();
	});

	$('a').bind('dragstart', function(event) {
		event.preventDefault();
	});

	if($('.selectpicker').length > 0) {
		$('.selectpicker').selectpicker();		
	}
    
	/*verify if device is touch/no-touch and add class*/
    var isTouch = Modernizr.touch; 
	if(isTouch) {
		$('body').addClass('touchDevice');
	} else {
		$('body').addClass('no-touchDevice');
	}
});

$(window).scroll(function() {
	goToTop();
});

function openPopup(url, sizeX, sizeY) {
	var leftPosition, topPosition;
	leftPosition = (window.screen.width / 2) - (sizeX / 2 + 10);
	topPosition = (window.screen.height / 2) - (sizeY / 2 + 50);

	//window.open(url, "_blank", "status=no, height=" + sizeY + ", width=" + sizeX + ", resizable, left=" + leftPosition + ",top=" + topPosition + ",screenX=" + leftPosition + ",screenY=" + topPosition + ",toolbar=no,menubar=no,scrollbars,location=no,directories=no");
	window.open(url);
}

function validateEmail(sEmail) {
	var filter = "^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$";
	if (filter.test(sEmail)) {
		return true;
	} else {
		return false;
	}
}

//slide to hash if it exists
function ctoolsSlideToHash() {
	if (location.hash) {
		var $target = $(location.hash);
		if ($target.length) {
			ctoolsSlideToPosition($target.offset().top);
		}
	}
}

function ctoolsSlideToPosition(offsetTop) {
	if($(window).width() <= 750) {
		$('html, body').stop().animate({
			scrollTop : (offsetTop)
		}, 800);		
	} else {
		$('html, body').stop().animate({
			scrollTop : (offsetTop - 120)
		}, 800);		
	}
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
				var href = $(this).attr("href"), offsetTop = href === "#" ? 0 : $(href).offset().top - 183;
			} else if ($('#header-navigation').css('position') == 'relative') {
				var href = $(this).attr("href"), offsetTop = href === "#" ? 0 : $(href).offset().top - 45;
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

$.fn.preload = function() {
	this.each(function() {
		$('<img/>')[0].src = this;
	});
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


$(window).load(function() {
	// on click go to top
	$('#toTop').click(function() {
		scrollToTop(800);
	});
});

function launchOverlay(triggerButtonID) {
    var container = document.getElementById('content-section'),
    	triggerButton = document.getElementById(triggerButtonID),
        overlayID = triggerButton.id.split('firstDashboardItem')[1].toLowerCase(),
        overlay = document.getElementById(overlayID+"Info"),
        closeButton = document.getElementsByClassName('overlay-close');;
		
		classie.add( overlay, 'open' );
		classie.add( container, 'overlay-open' );

}

function hideOverlay() {
	$('.overlay').removeClass('open');
	$('#content-section').removeClass('overlay-open');
}

function myChangelog(url, windowname) {
	window.open(url, windowname, "resizable=no,toolbar=no,scrollbars=yes,menubar=no,status=no,directories=no,width=550,height=300,left=25,top=25");
}