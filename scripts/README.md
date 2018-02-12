# Community Charting Components Scripts

Scripts that are executed manually are stored here. There are also several bundle files located in this directory that
are used with several scripts. These are manually maintained.

## Scripts for Generating the Example Site

The following scripts generate artifacts into the `/target` directory. For more details on building the example site,
check the [Contributing](../Contributing.md) document.

#### generateJsDocs.sh
Generates HTML docs based on comments from the JS files into the `jsdoc` directory.

#### generateSummary.sh
Generates summary HTML files for each of the graph types into the `summary` directory

#### generateSite.sh
Builds out the example site into the `target/site` directory. This script output is what is used as
a source for the github example site at https://webdetails.github.io/ccc/

## Utility Scripts

#### build-scripts-config.sh
Using the *-bundle-files.txt located within this directory, this scripts will build javascript files
containing an array of all the files listed within the text files. The resulting javascript files
will be generated into `target/bundle/files`.

The array inside the generated javascript files is used for updating the following r.js config files.

Example Configurations:\
[cdo config](../ccc-js/src/main/javascript/build-res/r.js-configs/cdo.build.js)\
[def config](../ccc-js/src/main/javascript/build-res/r.js-configs/def.build.js)

#### repl-scripts.sh
This scripts is used to modify the html files in the [examples](../examples) directory whenever a new javascript chart
is added to the project. The *-bundles-files.txt located in the `scripts` directory are used as the source.