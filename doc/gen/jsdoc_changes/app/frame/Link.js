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
/** Handle the creation of HTML links to documented symbols.
	@constructor
*/
function Link() {
	this.alias = "";
	this.src = "";
	this.file = "";
	this.text = "";
	this.innerName = "";
	this.classLink = false;
	this.targetName = "";
	
	this.target = function(targetName) {
		if (defined(targetName)) this.targetName = targetName;
		return this;
	}
	this.inner = function(inner) {
		if (defined(inner)) this.innerName = inner;
		return this;
	}
	this.withText = function(text) {
		if (defined(text)) this.text = text;
		return this;
	}
    this.withoutNamespace = function(namespaceName) {
        if(defined(namespaceName)){
            this.namespaceName = namespaceName;
            if(namespaceName && this.alias && this.alias.indexOf(namespaceName) === 0){
                this.text = this.alias.substr(namespaceName.length + 1);
            }
        }
        
		return this;
	}
	this.toSrc = function(filename) {
		if (defined(filename)) this.src = filename;
		return this;
	}
	this.toSymbol = function(alias) {
		if (defined(alias)) this.alias = new String(alias);
		return this;
	}
	this.toClass = function(alias) {
		this.classLink = true;
		return this.toSymbol(alias);
	}
	this.toFile = function(file) {
		if (defined(file)) this.file = file;
		return this;
	}
	
	this.toString = function() {
		var linkString;
		var thisLink = this;

		if (this.alias) {
            if(this.alias.indexOf("http:") === 0){
                var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";
                linkString = "<a href=\"" + this.alias + "\""+target+">" + (this.text || this.alias) + "</a>";
            } else {
                //LOG.warn("Alias '" + this.alias + "'");
                
                linkString = this.alias.replace(
                    /(^|[^a-z$0-9_#.^-]*)([a-z$0-9_#.^-]+)($|(?![a-z$0-9_#.^-]))/ig,
                    function(match, prematch, symbolName){
                        //LOG.warn("--> pre: '" + prematch   + 
                        //         "' match: '" + symbolName + "'");
                        
                        return prematch + thisLink._makeSymbolLink(symbolName);
                    });
            }
		}
		else if (this.src) {
			linkString = thisLink._makeSrcLink(this.src);
		}
		else if (this.file) {
			linkString = thisLink._makeFileLink(this.file);
		}

		return linkString;
	}
}

/** prefixed for hashes */
Link.hashPrefix = "";

/** Appended to the front of relative link paths. */
Link.base = "";

Link.symbolNameToLinkName = function(symbol) {
	var linker = "",
		ns = "";
	
	if (symbol.isStatic) linker = ".";
	else if (symbol.isInner) linker = "-";
	
	if (symbol.isEvent && !/^event:/.test(symbol.name)) {
		ns = "event:";
	}
	return Link.hashPrefix+linker+ns+symbol.name;
}

Link.getSymbol= function(alias) {
    var symbol= Link.symbolSet.getSymbol(alias);
    
    if (symbol)
        return symbol;
        
    if ('#'!==alias.charAt(0) || !Link.currentSymbol)
        return null;
    
    //  resolve relative name
    var container= Link.currentSymbol;
    
    while (container)
    {
        symbol= Link.symbolSet.getSymbol(container.alias + alias);
        if (symbol)
            return symbol;
        
        //  No superclass
        if (!container.augments.length)
            return null;
        
        container= Link.symbolSet.getSymbol(container.augments[0].desc);
    }
    
    return null;
}

/** Create a link to another symbol. */
var _notExistsLinkWarned = {};

Link.prototype._makeSymbolLink = function(alias) {
	var linkBase = Link.base+publish.conf.symbolsDir;
	var linkTo = Link.getSymbol(alias);
	var linkPath;
	var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";

	// if there is no symbol by that name just return the name unaltered
	if (!linkTo){
        switch(alias){
            case 'function':
            case 'boolean':
            case 'number':
            case 'object':
            case '_global_':
            case 'string':
            case 'undefined':
            case 'null':
            case 'any':
            case 'map':
            case 'list':
                break;
            
            default:
                if(!Object.prototype.hasOwnProperty.call(_notExistsLinkWarned, alias)){
                    _notExistsLinkWarned[alias] = 1;
                    LOG.warn("symbolName='" + alias + "' does not exist.");
                }
        }
        
        return this.text || alias;
	// it's a symbol in another file
	} else {
		if (!linkTo.is("CONSTRUCTOR") && !linkTo.isNamespace) { // it's a method or property
			linkPath= (Link.filemap) ? Link.filemap[linkTo.memberOf] :
				      escape(linkTo.memberOf) || "_global_";
				linkPath += publish.conf.ext + "#" + Link.symbolNameToLinkName(linkTo);
		}
		else {
			linkPath = (Link.filemap)? Link.filemap[linkTo.alias] : escape(linkTo.alias);
			linkPath += publish.conf.ext;// + (this.classLink? "":"#" + Link.hashPrefix + "constructor");
		}
		linkPath = linkBase + linkPath
	}
        
	var linkText= this.text || alias;
    
	var link = {linkPath: linkPath, linkText: linkText, linkInner: (this.innerName? "#"+this.innerName : "")};
	
	if (typeof JSDOC.PluginManager != "undefined") {
		JSDOC.PluginManager.run("onSymbolLink", link);
	}
	
	return "<a href=\""+link.linkPath+link.linkInner+"\""+target+">"+link.linkText+"</a>";
}

/** Create a link to a source file. */
Link.prototype._makeSrcLink = function(srcFilePath) {
	var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";
		
	// transform filepath into a filename
	var srcFile = srcFilePath.replace(/\.\.?[\\\/]/g, "").replace(/[:\\\/]/g, "_");
	var outFilePath = Link.base + publish.conf.srcDir + srcFile + publish.conf.ext;

	if (!this.text) this.text = FilePath.fileName(srcFilePath);
	return "<a href=\""+outFilePath+"\""+target+">"+this.text+"</a>";
}

/** Create a link to a source file. */
Link.prototype._makeFileLink = function(filePath) {
	var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";
		
	var outFilePath =  Link.base + filePath;

	if (!this.text) this.text = filePath;
	return "<a href=\""+outFilePath+"\""+target+">"+this.text+"</a>";
}