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
/*
 * requirejs configuration file used to build the tipsy.css file
 */
module.exports =
({
    cssIn:   'ccc-js/src/main/javascript/package-res/lib/tipsy.css',
    out:     '../module-scripts/tipsy.css',
    
    removeCombined: true,
    preserveLicenseComments: true,
    optimizeCss: 'none',
    
    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    }
})