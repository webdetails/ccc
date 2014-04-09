# Community Charting Components

**CCC** is a charting library for web documents.
It can generate charts in SVG or VML (for IE8 support).

**CCC** is one of the _tools_ of the **CTools** family.

If you wan't to know more, [see the site](http://ccc.webdetails.org).


## Building

For building the code:

```
$ npm install requirejs
$ ant assemble
```

For building the JavaScript options docs:

```
$ ./generateJsDocs.sh
```

For building the CCC site (requires the previous two have been run before):

```
$ ./generateSite.sh
```

## Testing

```
$ npm install
```

```
$ karma
```
