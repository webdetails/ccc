const requirejs = require('requirejs');
const concat = require('concat');

const mode = process.argv[2] || 'default';

process.chdir('../');
const dir = `${process.cwd()}/ccc-js/src/main/javascript/build-res`; // TODO: Set the cwd

// Modules that we're wrapping the JS with
const modules = ['ccc', 'pen', 'pen-legacy', 'amd'];
// const modules = ['ccc'];

// Set of default page wraps for the generated JS Files
// Wrap files are located in /partials
const defaultWraps = modules;

// Different libraries that need to be wrapped
const libraries = [{
    name: 'cdo',
    hasRelease: true // sets beautify = false, and mangle = true
  }, {
    name: 'def',
  }, {
    name: 'jquery.tipsy',
  }, {
    name: 'protovis',
    skipLicense: true // license already included
  }, {
    name: 'protovis-compat',
    wraps: ['amd'],
    skipLicense: true
  }, {
    name: 'protovis-msie',
    skipLicense: true
  }, {
    name: 'pvc',
    hasRelease: true
  }, {
    name: 'tipsy',
    hasCss: true
  }];

// Concat the source files into a single JS file
const buildJS = (modl, lib) => {
  const config = require(`${dir}/r.js-configs/${lib.name}.build`);
  
  const wrap = {
    startFile: `${dir}/partials/${lib.name}/${modl}.begin.js`,
    endFile: `${dir}/partials/${lib.name}/${modl}.end.js`
  };
  
  const out = `target/module-scripts/${modl}/${lib.name}.js`;

  const uglify2 = {...config.uglify2}; // copy the uglify settings
  
  // if the release flag has been set, mangle and skip beautification if
  // the library supports it and the target is ccc
  if (mode === 'release' && lib.hasRelease && modl === 'ccc') {
    uglify2.output.beautify = false;
    uglify2.mangle = true; 
  }
  
  requirejs.optimize({...config, out, wrap, uglify2}, buildResponse => {
    // prepend license file
    if (!lib.skipLicense) { concat([`${dir}/partials/license.js`, out], out); }
    console.log(`Built ${lib.name}.js for ${modl}: ${out}`);
  });

  if (lib.hasCss) {
    buildCss(modl, lib, dir);
  }
}

const buildCss = (modl, lib, dir) => {
  const cssConfig = require(`${dir}/r.js-configs/${lib.name}.css.build`);
  const cssOut = `target/module-scripts/${modl}/${lib.name}.css`;
  requirejs.optimize({...cssConfig, out: cssOut}, buildResponse => {
    // prepend license file
    concat([`${dir}/partials/license.js`, cssOut], cssOut);
    console.log(`Built ${lib.name}.css for ${modl}: ${cssOut}`);
  });
};

modules.forEach(modl => libraries.forEach(lib => {
  const wraps = lib.wraps || defaultWraps;
  wraps.includes(modl) && buildJS(modl, lib);
}));
