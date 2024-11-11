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
$('document').ready(function() {
  $('img').bind('dragstart', function(event) {
    event.preventDefault();
  });

  $('a').bind('dragstart', function(event) {
    event.preventDefault();
  });

  if ($('.selectpicker').length > 0) {
    $('.selectpicker').selectpicker();
  }

  /*verify if device is touch/no-touch and add class*/
  var isTouch = Modernizr.touch;
  if (isTouch) {
    $('body').addClass('touchDevice');
  } else {
    $('body').addClass('no-touchDevice');
  }

  if (!Modernizr.svg) {
    var imgs = document.getElementsByTagName('img');
    var svgExtension = /.*\.svg$/
    var l = imgs.length;
    for (var i = 0; i < l; i++) {
      if (imgs[i].src.match(svgExtension)) {
        imgs[i].src = imgs[i].src.slice(0, -3) + 'png';
        console.log(imgs[i].src);
      }
    }
  }

  if ($('body').hasClass('wd-main-page')) {
    $('.features-tabs .tabs-list li:not(.link-tab) a').click(function(e) {
      e.preventDefault();

      var tab = $(this),
        targetID = tab.attr('href'),
        tabTarget = $('.features-tabs').find(targetID);

      if (!tab.closest('li').hasClass('active')) {
        $('.features-tabs .tabs-list li').removeClass('active');
        tab.closest('li').addClass('active');

        if ($('.features-tabs .tabs-content > div.active').length) {
          $('.features-tabs .tabs-content > div.active').stop().slideUp(400, function() {
            $('.features-tabs .tabs-content > div.active').removeClass('active');
            tabTarget.stop().slideDown(400);
            tabTarget.addClass('active');
          });
        } else {
          tabTarget.stop().slideDown(400);
          tabTarget.addClass('active');
        }

        // close opened accordion panels
        $('.features-accordion .panel .panel-collapse.in').closest('.panel').find('.panel-title > a').addClass('collapsed');
        $('.features-accordion .panel .panel-collapse.in').collapse('hide');

        // open related accordion panel
        $('.features-accordion .panel:eq(' + tabTarget.index() + ') .panel-collapse').collapse('show');
        $('.features-accordion .panel:eq(' + tabTarget.index() + ') .panel-title > a').removeClass('collapsed');
      } else {
        tab.closest('li').removeClass('active');
        tabTarget.removeClass('active');
        tabTarget.stop().slideUp(400);

        // close related accordion panel
        $('.features-accordion .panel:eq(' + tabTarget.index() + ') .panel-title > a').addClass('collapsed');
        $('.features-accordion .panel:eq(' + tabTarget.index() + ') .panel-collapse').collapse('hide');
      }
    });

    // create an accordion based on the tabs, to use on smaller screens (col-xs and col-sm)
    var $accordion = $('.features-accordion'),
      $tabs = $('.features-tabs .tabs-list li:not(.link-tab)');

    // add panel-group class to the accordion container, so bootstrap can handle it as an accordion
    $accordion.addClass('panel-group');

    // for each tab, find related content and build a panel with tab name as panel-heading and the content as panel-body
    $tabs.each(function(idx) {
      var $currentTab = $(this).find('a'),
        tabTitle = $currentTab.text(),
        tabRef = $currentTab.attr('href'),
        $content = $('.features-tabs .tabs-content').find(tabRef),
        contentHtml = $content.html(),
        panel = '<div class="panel panel-default">' +
        '<div class="panel-heading"><h4 class="panel-title">' +
        '<a class="collapsed" data-toggle="collapse" data-parent="#features-accordion" href="' + tabRef + '-panel">' + tabTitle + "</a>" +
        '<span class="accordion-arrow"></span></h4></div>' +
        '<div class="panel-collapse collapse" id="' + tabRef.split('#')[1] + '-panel">' +
        '<div class="panel-body">' + contentHtml + '</div>' +
        '</div>' +
        '</div>';

      $accordion.append(panel);
    });

    $('.features-accordion .panel-title a').on('click', function() {
      $('.features-tabs .tabs-list li').removeClass('active');
      $('.features-tabs .tabs-content > div').removeClass('active');
      $('.features-tabs .tabs-content > div').hide();

      if (!$(this).closest('.panel').find('.panel-collapse').hasClass('in')) {
        $('.features-tabs .tabs-list li:eq(' + $(this).closest('.panel').index() + ')').addClass('active');
        $('.features-tabs .tabs-content > div:eq(' + $(this).closest('.panel').index() + ')').addClass('active');
        $('.features-tabs .tabs-content > div:eq(' + $(this).closest('.panel').index() + ')').show();
      }
    });

    $('.highlightsRow .background-column').each(function() {
      var column = $(this),
        imageSrc = column.find('img').attr('src');
      column.closest('.highlightItem').find('.container').append('<div class="highlightCoverImg" style="background-image: url(' + imageSrc + ');"></div>')
    })
  }

    if ($(window).width() < 760) {
  		$(".showcase-demo-box").removeAttr("data-toggle");
    } else {
  		$(".showcase-demo-box").attr("data-toggle", "modal");
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
  if ($(window).width() <= 750) {
    $('html, body').stop().animate({
      scrollTop: (offsetTop)
    }, 800);
  } else {
    $('html, body').stop().animate({
      scrollTop: (offsetTop - 120)
    }, 800);
  }
}

function cccScrollBehaviour() {
  //<![CDATA[
  $(window).load(function() {
    // Cache selectors
    var lastId, topMenu = $(".fixedmenu ul"),
      topMenuHeight = 200,
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
        var href = $(this).attr("href"),
          offsetTop = href === "#" ? 0 : $(href).offset().top - 183;
      } else if ($('#header-navigation').css('position') == 'relative') {
        var href = $(this).attr("href"),
          offsetTop = href === "#" ? 0 : $(href).offset().top - 45;
      }
      $('html, body').stop().animate({
        scrollTop: offsetTop
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
        //menuItems.parent().removeClass("selected").end().filter("[href=#" + id + "]").parent().addClass("selected");
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
    scrollTop: 0
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
    overlay = document.getElementById(overlayID + "Info"),
    closeButton = document.getElementsByClassName('overlay-close');;

  classie.add(overlay, 'open');
  classie.add(container, 'overlay-open');

}

function hideOverlay() {
  $('.overlay').removeClass('open');
  $('#content-section').removeClass('overlay-open');
}

function myChangelog(url, windowname) {
  window.open(url, windowname, "resizable=no,toolbar=no,scrollbars=yes,menubar=no,status=no,directories=no,width=550,height=300,left=25,top=25");
}

$(window).resize(function() {
  windowsize = $(window).width();
  if (windowsize < 760) {
		$(".showcase-demo-box").removeAttr("data-toggle");
  } else {
		$(".showcase-demo-box").attr("data-toggle", "modal");
	}
});
