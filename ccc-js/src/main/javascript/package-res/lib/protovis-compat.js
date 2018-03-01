/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company.  All rights reserved.
 * 
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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