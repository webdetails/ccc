<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:com="urn:webdetails/com/2012"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:fun="localfunctions"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="com fun xs xsl fn xhtml">
    
    <!-- Path of loaded documents, for include, relative to the location of this XSL -->
    <xsl:param name="relativePath" select="'../model/'" />
    
    <!-- The new line character -->
    <xsl:variable name='nl'><xsl:text>&#xd;&#xa;</xsl:text></xsl:variable>
    
    <!-- ' -->
    <xsl:variable name='q'><xsl:text>&#39;</xsl:text></xsl:variable>
    <xsl:variable name="trimAposRegexp" select="concat('^\s*', $q, '([^', $q, ']*)', $q, '\s*$')" />
    
    <!-- nbsp -->
    <xsl:variable name="nbsp"><xsl:text disable-output-escaping="yes"><![CDATA[&nbsp;]]></xsl:text></xsl:variable>
    
    <!-- A-priori loaded node sequences with 
         functionType, facetType, atomType and complexType 
      -->
    <xsl:variable name="funTypes"        select="fun:getFunctionTypes(/)" />
    <xsl:variable name="facetTypes"      select="fun:getFacetTypes(/)" />
    <xsl:variable name="atomTypes"       select="fun:getAtomTypes(/)" />
    <xsl:variable name="complexTypes"    select="fun:getComplexTypes(/)" />
    
    <!-- A-priori inherited complex types 
         i.e. whose properties have been inherited from
         their respective base class and facets 
      -->
    <xsl:variable name="complexTypesInh" select="fun:inheritComplexTypes($complexTypes)" />
    
    <!-- A-priori expanded complex types 
         i.e. whose complex properties have been expanded
         and generated concatenated properties 
      -->
    <xsl:variable name="complexTypesExp" select="fun:expandComplexTypes($complexTypesInh)" />
    
    <!-- MODEL READER FUNCTIONS -->
    
    <xsl:function name="fun:getFunctionTypes">
        <xsl:param name="doc" />
        
        <xsl:sequence select="$doc/com:model/com:functionType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getFunctionTypes(document(concat($relativePath, @the)))" />
	        </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:getFacetTypes">
        <xsl:param name="doc" />
        
        <xsl:sequence select="$doc/com:model/com:facetType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getFacetTypes(document(concat($relativePath, @the)))" />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:getAtomTypes">
        <xsl:param name="doc" />
        
        <xsl:sequence select="$doc/com:model/com:atomType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getAtomTypes(document(concat($relativePath, @the)))" />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:getComplexTypes">
        <xsl:param name="doc" />
        
        <!-- Check for complex types with no properties, due to kettle job limitation 
        <xsl:for-each select="$doc/com:model/com:complexType[count(com:property) = 0]">
            <xsl:message>
                <xsl:value-of select="@name" />
            </xsl:message>
        </xsl:for-each>
         -->
         
        <xsl:sequence select="$doc/com:model/com:complexType" />
        
        <xsl:for-each select="$doc/com:model/com:include">
            <xsl:if test="string(@the) != ''">
                <xsl:sequence select="fun:getComplexTypes(document(concat($relativePath, @the)))" />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <!-- VERTICAL - COMPLEX TYPE - INHERITANCE -->
    
    <!-- TODO: filtering of deprecated and/or fixed should be optional  -->
    <xsl:function name="fun:inheritComplexTypes">
        <xsl:param name="complexTypes" />
        
        <xsl:for-each select="$complexTypes">
            <xsl:copy>
                <xsl:copy-of select="@*" />
                
                <xsl:copy-of select="
                      fun:analyzeProperties(
                      fun:filterProperties (
                      fun:uniqueProperties (
                      fun:inheritComplexType( . ))))" />
            </xsl:copy>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:inheritComplexType">
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
            
            <xsl:sequence select="fun:inheritComplexType($baseType)" />
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
    
    <!-- Parses the @type attribute of each property
         and adds the resulting types as children of a 
         "types" child element of each property.
         -->
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
    
    <!-- 
	    Assumes that no nested parenthesis occur...
	    
	    ((list|map)\(*\)) | *
	    
	    $1 -> if list or map
	    $2 -> "list" or "map"
	    $3 -> list or map argument
	    $4 -> type not within list or map
	    
	    <list of="foo bar ...">
	       <atom of="foo" />
	       <function of="bar" />
	       <complex of="BarChart" />
	       <list of="foo bar">
	           <atom of="foo" />
	           <function of="bar" />
	       </list>
	       <map ... 
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

    <!-- HORIZONTAL - COMPLEX TYPE - PROPERTY EXPANSION  -->
    <xsl:function name="fun:expandComplexTypes">
        <xsl:param name="complexTypes" />
        
        <xsl:for-each select="$complexTypes">
            <xsl:copy>
                <xsl:copy-of select="@*" />
                <xsl:copy-of select="fun:expandComplexType( . , '', '', '')" />
            </xsl:copy>
        </xsl:for-each>
    </xsl:function>
    
    <xsl:function name="fun:expandComplexType">
        <!-- The Inherited Complex Type Element to expand -->
        <xsl:param name="compType" />
        
        <xsl:param name="path" />
        <xsl:param name="minPath" />
        <xsl:param name="categPath" />
        
        <xsl:for-each select="$compType/com:property">
        
            <!-- Is local property excluded? -->
            <xsl:if test="count($excludeLocalProps/prop[. = current()/@name]) = 0">
                <!--
                I - Output the property once 
                    with a type constituted by all its direct non-complex types
                    (can include lists...)
                    
                    Translate atoms      to primitive
                    Translate functions  to function
                    Translate ext.points to primitive of **pv.Mark**
                    
                    Ignore literal complex types
                    Ignore complex types within lists
                    Ignore empty lists
                    Expand expandable complex types.
                 -->
                <xsl:variable name="expandableComplexTypes"
                              select="fun:getExpandableComplexTypes(types, false())" />
                
                <xsl:variable name="otherTypes"
                              select="types/* except $expandableComplexTypes" />
                
                <!-- Some extension points have an empty name (!) -
                     it's a way to inherit only the parent's name.
                     The "empty" name is marked with an "_".
                     
                     If there is no ascending path,
                     the resulting name would be "",
                     so the "_" is translated to minPath.
                     Otherwise, 
                     the "_" name is translated to "" -  
                     when prefixed with path it will be ok.  
                  -->
                <xsl:variable name="name" 
                              select="if(@name = '_') 
                                      then (if($path = '') then $minPath else '') 
                                      else string(@name)" />
                
                <!-- If the property contains an extension point type,
                     it is renamed to contain the suffix: "_".
                     -->
                <xsl:variable name="hasExtPointType" 
                              select="count(types/complex[starts-with(@of, 'pvc.options.marks.')]) > 0" />

                <xsl:variable name="nameEx"
                              select="concat(
                                       $name,
                                       if($hasExtPointType) then '_' else '')" />
                
                <xsl:variable name="expandedName" select="fun:expandName($path, $nameEx)" />
                
                <!-- Is expanded property excluded? -->
                <xsl:if test="count($excludeProps/prop[. = $expandedName]) = 0">
                    <!-- Skip the local category,
                         unless it is a root property.

                         If it has no expandable types (=> terminal)
                         then use only the base category.

                         If it is named 'extensionPoints'
                         then use only the base category.
                          -->
                    <xsl:variable
                        name="baseCat"
                        select="if($categPath)
                                then $categPath
                                else string(@category)" />

                    <!--  or @expandUse = 'optional' -->
                    <xsl:variable
                        name="expCat"
                        select="if(count($expandableComplexTypes) = 0 or $name = 'extensionPoints')
                                then $baseCat
                                else fun:join(' > ', $baseCat, fun:buildTitleFromName($name))" />
                    
                    <xsl:if test="count($otherTypes) > 0">
                        <xsl:variable name="rewrittenName" select="$rewriteProps/prop[. = $expandedName]/@as" />
        
                        <xsl:variable name="expandedName2" select="if ($rewrittenName) then $rewrittenName else $expandedName" />
                        
                        <xsl:variable name="defaultPropOverride"
                                      select="$overrideDefaultsProps/prop[. = $expandedName]" />
                        
                        <xsl:variable name="default"
                                      select="
                                      if(count($defaultPropOverride) = 0)
                                      then string(@default)
                                      else string($defaultPropOverride/@default)" />

                        <!--
                            1 - Send "- Multi" to the end as: (Multi)
                            2 - Remove "Small "
                            -->
                        <xsl:variable
                            name="termCat0"
                            select="if   (contains($expCat, 'Multi'))
                                    then replace($expCat, '^(.*?)\s*(-\s)?(Multi)\s*(.*)$', '$1 $4 (Multi)')
                                    else $expCat" />

                        <xsl:variable
                            name="termCat"
                            select="replace($termCat0, 'Small ', '')" />

                        <com:property name="{$expandedName}" 
                                      name2="{$expandedName2}"
                                      category="{$termCat}"
                                      default="{$default}" 
                                      originalType="{fun:getTypeFullName($compType)}" 
                                      originalName="{@name}">
                            <xsl:copy-of select="@*[name() != 'name' and name() != 'category' and name() != 'default']" />
                            <xsl:copy-of select="*[local-name() != 'types']" />
                            <types>
                                <xsl:copy-of select="$otherTypes" />
                            </types>
                        </com:property>
                    </xsl:if>
                     
                    <!-- II - Expand direct complex types -->
                    <xsl:if test="count($expandableComplexTypes) > 0">
                        <xsl:variable name="childPath" 
                                      select="if(@expandUse = 'optional') 
                                              then $path
                                              else $expandedName" />
                        
                        <xsl:variable name="childMinPath"
                                      select="if($minPath) 
                                              then $minPath
                                              else $name" />

                        <xsl:for-each select="$expandableComplexTypes">
                            <!-- Get the inherited complex type element -->
                            <xsl:variable name="propComplexType" 
                                          select="$complexTypesInh[fun:getTypeFullName(.) = current()/@of]" />
                                          
                            <xsl:copy-of select="fun:expandComplexType($propComplexType, $childPath, string($childMinPath), $expCat)" />
                        </xsl:for-each>
                    </xsl:if>
                </xsl:if>
            </xsl:if>
        </xsl:for-each>
                
    </xsl:function>
    
    <!-- Given a property's parsed "types" element,
         yields a sequence of child elements
         that correspond to expandable complex types.
          
         Complex types whose @use attribute
         has one of the values 'expanded' or 'any' are returned.
         
         A second argument 'expandMarks' controls whether
         complex types of the 'pvc.options.Marks' namespace are expanded.
         -->
    <xsl:function name="fun:getExpandableComplexTypes">
        <!-- Complex types that will be expanded -->
        <xsl:param name="types" />
        <xsl:param name="expandMarks" />

        <xsl:for-each select="$types/complex">
            <xsl:variable name="propComplexType" 
                          select="$complexTypesInh[fun:getTypeFullName(.) = current()/@of]" />
            
            <!-- If @use = literal, skip the complex type
                 Must also skip any complexTypes of the pvc.options.marks space,
                 so that custom extension point Marks don't get expanded. 
                 -->
            <xsl:if test="
                    $propComplexType
                    [@use='expanded' or @use='any']
                    [$expandMarks or @space != 'pvc.options.marks']">
                <xsl:sequence select="." />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
    <!-- UTILITIES -->
    
    <!-- trim ' character -->
    <xsl:function name="fun:trimApostrophe">
        <xsl:param name="text" />
        <xsl:choose>
            <xsl:when test="string($text) != ''">
                <xsl:value-of select="replace($text, $trimAposRegexp, '$1')" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="''" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <!-- Creates a "title" suitable description given a Pascal or Camel-cased name -->
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
    
    <!-- Returns the JavaScript type of a JS literal, given as a JS code string -->
    <xsl:function name="fun:getJSType">
        <xsl:param name="value" />
        <xsl:choose>
            <xsl:when test="$value = 'true' or $value = 'false'">
                <xsl:value-of select="'boolean'" />
            </xsl:when>
            <xsl:when test="matches($value, '^[0-9\.]+$')">
                <xsl:value-of select="'number'" />
            </xsl:when>
            <xsl:when test="$value = 'null'">
                <xsl:value-of select="'null'" />
            </xsl:when>
            <xsl:when test="$value = 'undefined'">
                <xsl:value-of select="'undefined'" />
            </xsl:when>
            <!-- " or ' &#34; &#39; matches($value,'^\&quot;') or  -->
            <xsl:when test="starts-with($value,'&quot;') or starts-with($value, $q)">
                <xsl:value-of select="'string'" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="'unknown'" />
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
</xsl:stylesheet>