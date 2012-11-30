<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:com="urn:webdetails/com/2012"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:fun="localfunctions"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xs="http://www.w3.org/2001/XMLSchema">
    
    <!-- Path of loaded documents, for include, relative to the location of the XSL -->
    <xsl:param name="relativePath" select="''" />
    
    <!-- The new line character -->
    <xsl:variable name='nl'><xsl:text>&#xd;&#xa;</xsl:text></xsl:variable>
    
    <!-- ' -->
    <xsl:variable name='q'><xsl:text>&#39;</xsl:text></xsl:variable>
    
    <!-- nbsp -->
    <xsl:variable name="nbsp"><xsl:text disable-output-escaping="yes"><![CDATA[&nbsp;]]></xsl:text></xsl:variable>
    
    <!-- A-priori loaded node sequences with 
         functionType, facetType, complexType and atomType 
      -->
    <xsl:variable name="funTypes"        select="fun:getFunctionTypes(/)" />
    <xsl:variable name="facetTypes"      select="fun:getFacetTypes(/)" />
    <xsl:variable name="atomTypes"       select="fun:getAtomTypes(/)" />
    <xsl:variable name="complexTypes"    select="fun:getComplexTypes(/)" />
    <xsl:variable name="complexTypesExp" select="fun:expandComplexTypes($complexTypes)" />
    
    <xsl:function name="fun:buildTitleFromName" as="xs:string?">
        <xsl:param name="name" as="xs:string?" />
        <xsl:value-of select="replace(fun:capitalizeWord($name), '([a-z]\d*)([A-Z])', '$1 $2')" />
    </xsl:function>
    
    <xsl:function name="fun:capitalizeWord">
        <xsl:param name="word" as="xs:string?" />
        <xsl:value-of select="concat(upper-case(substring($word, 1, 1)), substring($word, 2))" />
    </xsl:function>
    
    <xsl:function name="fun:join" as="xs:string?">
        <xsl:param name="sep"  as="xs:string?" />
        <xsl:param name="arg1" as="xs:string?" />
        <xsl:param name="arg2" as="xs:string?" />
        
        <xsl:choose>
            <xsl:when test="string($arg1) != '' and string($arg2) != ''">
                <xsl:value-of select="concat($arg1, $sep, $arg2)" />
            </xsl:when>
            <xsl:when test="string($arg1) != ''">
                <xsl:value-of select="string($arg1)" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="string($arg2)" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="fun:expandName" as="xs:string?">
        <xsl:param name="path" as="xs:string?" />
        <xsl:param name="name" as="xs:string?" />
        <xsl:choose>
            <xsl:when test="string($path) != ''">
                <xsl:value-of select="concat($path, fun:capitalizeWord($name))" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$name" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="fun:getTypeFullName" as="xs:string?">
        <xsl:param name="type" as="node()?" />
        <xsl:choose>
            <xsl:when test="string($type/@space) != ''">
                <xsl:value-of select="concat($type/@space, '.', $type/@name)" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="string($type/@name)" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="fun:getMetaType" as="xs:string?">
        <xsl:param name="fullTypeName" />
        <xsl:choose>
            <xsl:when test="$complexTypes[fun:getTypeFullName(.) = $fullTypeName]">
                <xsl:value-of select="'complex'" />
            </xsl:when>
            <xsl:when test="$funTypes[fun:getTypeFullName(.) = $fullTypeName]">
                <xsl:value-of select="'function'" />
            </xsl:when>
            <xsl:when test="$facetTypes[fun:getTypeFullName(.) = $fullTypeName]">
                <xsl:value-of select="'facet'" />
            </xsl:when>
            <xsl:when test="$atomTypes[fun:getTypeFullName(.) = $fullTypeName]">
                <xsl:value-of select="'atom'" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="'primitive'" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="fun:getFunctionTypes">
        <xsl:param name="doc" />
        
        <xsl:sequence select="$doc/com:model/com:functionType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getFunctionTypes(document(concat($relativePath,@the)))" />
	        </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:getFacetTypes">
        <xsl:param name="doc" />
        
        <xsl:sequence select="$doc/com:model/com:facetType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getFacetTypes(document(concat($relativePath,@the)))" />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:getAtomTypes">
        <xsl:param name="doc" />
        
        <xsl:sequence select="$doc/com:model/com:atomType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getAtomTypes(document(concat($relativePath,@the)))" />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:getComplexTypes">
        <xsl:param name="doc" />
        
        <xsl:sequence select="$doc/com:model/com:complexType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getComplexTypes(document(concat($relativePath,@the)))" />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:inheritProperties">
        <xsl:param name="complexType" />
        
        <!-- I  - LOCAL properties -->
        <xsl:sequence select="$complexType/com:property" />
        
        <!-- II - FACET properties -->
        <xsl:for-each select="tokenize($complexType/@facets, '\s+')">
            <xsl:variable name="facetType" select="$facetTypes[fun:getTypeFullName(.) = current()]" />
            <xsl:if test="not($facetType)">
                <xsl:message terminate="yes">Undefined facet type '<xsl:value-of select="." />'</xsl:message>
            </xsl:if>
            
            <xsl:sequence select="$facetType/com:property" />
        </xsl:for-each>
        
        <!-- III - Base type -->
        <xsl:variable name="base" select="string($complexType/@base)" />
        
        <xsl:if test="$base">
            <xsl:variable name="baseType" select="$complexTypes[fun:getTypeFullName(.) = $base]" />
            <xsl:if test="not($baseType)">
                <xsl:message terminate="yes">Undefined base complex type '<xsl:value-of select="$base" />'</xsl:message>
            </xsl:if>
            
            <xsl:sequence select="fun:inheritProperties($baseType)" />
        </xsl:if>
    </xsl:function>
    
    <!-- Keeps only the first property of each name -->
    <xsl:function name="fun:uniqueProperties">
        <xsl:param name="properties" />
        
        <xsl:for-each-group select="$properties" group-by="string(@name)">
            <xsl:sequence select="current-group()[1]" />
        </xsl:for-each-group>
    </xsl:function>
    
    <!-- Removes some unwanted properties
         * fixed value
         * deprecated
         -->
    <xsl:function name="fun:filterProperties">
        <xsl:param name="properties" />
        
        <xsl:for-each select="$properties">
            <!-- Exclude fixed value properties  -->
            <xsl:if test="string(@fixed) = ''">
                
                <!-- Exclude deprecated properties  -->
                <xsl:if test="string(com:documentation/com:deprecated) = ''">
                    <xsl:sequence select="." />
                </xsl:if>
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:analyzeProperties">
        <xsl:param name="properties" />
        
        <xsl:for-each select="$properties">
            <xsl:copy>
                <xsl:copy-of select="@*" />
                <xsl:copy-of select="*" />
                <types>
                    <xsl:copy-of select="fun:parseTypeName(@type)" />
                </types>
            </xsl:copy>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:expandComplexTypes">
        <xsl:param name="complexTypes" />
        
        <xsl:for-each select="$complexTypes">
            <xsl:copy>
                <xsl:copy-of select="@*" />
                
                <xsl:copy-of select="
                      fun:analyzeProperties(
                      fun:filterProperties (
                      fun:uniqueProperties (
                      fun:inheritProperties( . ))))" />
            </xsl:copy>
        </xsl:for-each>
    </xsl:function>
    
    <!-- 
	    Assumed that no nested parenthesis occur...
	    
	    ((list|map)\(*\)) | *
	    
	    $1 -> if list or map
	    $2 -> "list" or "map"
	    $3 -> list or map argument
	    $4 -> type not within list or map
	    
	    <list of="foo bar ...">
	       <atom of="foo" />
	       <function of="bar" />
	       ...
	    </list>
	 -->
    <xsl:function name="fun:parseTypeName">
        <xsl:param name="typeName" />
        
        <xsl:analyze-string regex="((list|map)\s*\(\s*(.*?)\))|([\w0-9_\.\-]+)" select="$typeName">
            <xsl:matching-substring>
                <xsl:choose>
                    <xsl:when test="regex-group(4) != ''">
                        <!-- Item Type -->
                        <xsl:variable name="fullItemTypeName" select="regex-group(4)" />
                        
                        <xsl:element name="{fun:getMetaType($fullItemTypeName)}">
                            <xsl:attribute name="of" select="$fullItemTypeName" />
                        </xsl:element>
                    </xsl:when>
                    <xsl:otherwise>
                        <!-- List or Map type -->
                        <xsl:variable name="fullItemTypeName" select="regex-group(3)" />
                        
                        <xsl:element name="{regex-group(2)}">
                            <xsl:attribute name="of" select="$fullItemTypeName" />
                            <xsl:copy-of select="fun:parseTypeName($fullItemTypeName)" />
                        </xsl:element>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:matching-substring>
         </xsl:analyze-string>
    </xsl:function>
</xsl:stylesheet>