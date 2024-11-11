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


var protovisId = "./protovis";
var protovisMsieId = "./protovis-msie";
var compat = {
  load: function(name, require, onLoad, config){
    if(config.isBuild) {
      require([protovisId], onLoad);
    } else {
        // detect SVG support
        var have_SVG = !!(
         document.createElementNS && 
         document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect 
        );

        // detect VML support
        var have_VML = (function (d,a,b) {
          a = d.createElement('div');
          a.innerHTML = '<pvml:shape adj="1" />';
          b = a.firstChild;
          if(b) {
            b.style.behavior = 'url(#default#VML)';
            return typeof b.adj === 'object';
          }
          return false;
       })(document);

        if (!have_SVG && have_VML) {
          contextualRequire([protovisMsieId], onLoad);
        } else {
          contextualRequire([protovisId], onLoad);
        }
      }
  }
};