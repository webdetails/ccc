/*
 * requirejs configuration file used to build the tipsy.css file
 */

({
    cssIn:   "../../package-res/lib/tipsy.css",
    out:     "../module-scripts/tipsy.css",
    
    removeCombined: true,
    preserveLicenseComments: true,
    optimizeCss: "none",
    
    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    }
})