/*!
 * Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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

/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
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

define([ "require" ], function(contextualRequire) {
    var protovisId = "./protovis", protovisMsieId = "./protovis-msie", compat = {
        load: function(name, require, onLoad, config) {
            if (config.isBuild) require([ protovisId ], onLoad); else {
                var have_SVG = !(!document.createElementNS || !document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect), have_VML = function(d, a, b) {
                    a = d.createElement("div");
                    a.innerHTML = '<pvml:shape adj="1" />';
                    b = a.firstChild;
                    if (b) {
                        b.style.behavior = "url(#default#VML)";
                        return "object" == typeof b.adj;
                    }
                    return !1;
                }(document);
                !have_SVG && have_VML ? contextualRequire([ protovisMsieId ], onLoad) : contextualRequire([ protovisId ], onLoad);
            }
        }
    };
    return compat;
});