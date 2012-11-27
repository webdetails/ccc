<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:com="urn:webdetails/com/2012"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:fun="localfunctions"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="com fun xs xsl fn xhtml">
    
    <xsl:output method="xhtml" indent="no" />
    
    <!-- Unfortunately indenting creates unwanted spaces in some places of the HTML.
         Use indenting only for debugging the stylesheet's output. 
         -->
    <xsl:output method="xhtml" indent="no" name="html" omit-xml-declaration="yes" />
    
    <xsl:include href="com-lib.xsl" />
    
    <xsl:param name="helpBaseUrl"  select="''" />
    
    <xsl:param name="outBaseUrl"  select="''" />
    
    <xsl:variable name="minGroupSize" select="3" />
    
    <xsl:variable name="excludeProps">
        <prop>trendTrend</prop>
        <prop>trendNullInterpolationMode</prop>
    </xsl:variable>
    
    <xsl:variable name="excludeLocalProps">
        <prop>keepInBounds</prop>
        <prop>alignTo</prop>
    </xsl:variable>
    
    <xsl:variable name="rewriteProps">
        <prop as="colors">colorColors</prop>
        <prop as="legendVisible">colorLegendVisible</prop>
        <prop as="legendDrawLine">colorLegendDrawLine</prop>
        <prop as="legendDrawMarker">colorLegendDrawMarker</prop>
        <prop as="legendShape">colorLegendShape</prop>
        <prop as="legendClickMode">colorLegendClickMode</prop>
    </xsl:variable>
    
    <!-- MAIN TEMPLATE - The flow Starts Here -->
	<xsl:template match="/">
	   
        <xsl:for-each select="$complexTypesExp[@space='pvc.options.charts' and not(@abstract='true')]">
            <xsl:variable name="filename" select="concat($outBaseUrl, replace(@name, '^(.*?)Chart$', '$1'), '.html')" />
            
            <xsl:message>
                <xsl:value-of select="$filename" />
            </xsl:message>
            
	        <xsl:result-document href="{$filename}" format="html">
	            <xsl:apply-templates select="." />
            </xsl:result-document>
	    </xsl:for-each>
	</xsl:template>
	
	<!-- Process ONE complex type -->
    <xsl:template match="com:complexType">
        <xsl:variable name="properties" select="fun:expandComplexProperties(., '', '', '')" />
        
        <xsl:variable name="nonExtProperties" select="$properties[not(ends-with(@name, '_'))]" />
        
        <xsl:variable name="extProperties"    select="$properties[ends-with(@name, '_')]" />
        
        <!-- 
        <h1><xsl:value-of select="fun:buildTitleFromName(@name)" /></h1>
         -->
         
        <xsl:if test="count($nonExtProperties) > 0">
	        <div class="bodycopytitle">
               <h29>CHART OPTIONS</h29>
            </div>
	        <xsl:call-template name="processComplexType">
	            <xsl:with-param name="type" select="." />
	            <xsl:with-param name="properties" select="$nonExtProperties" />
	        </xsl:call-template>
	    </xsl:if>
	    
	    <xsl:if test="count($extProperties) > 0">
	        <xsl:if test="count($nonExtProperties) > 0">
	           <div class="clear"></div>
               <div class="vSpacer"></div>
            </xsl:if>
            
	        <div class="bodycopytitle">
               <h29>EXTENSION POINTS</h29>
            </div>
	        <xsl:call-template name="processComplexType">
	            <xsl:with-param name="type" select="." />
	            <xsl:with-param name="properties" select="$extProperties" />
	        </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="processComplexType">
        <xsl:param name="type" />
        <xsl:param name="properties" />
        
        <!-- <div id="options"> -->
        <!-- Organize properties by category
             Categories with too few elements are  
             joined in a "General" category
             -->
        <xsl:variable name="groups">
	        <xsl:for-each-group select="$properties" group-by="@category">
	            <group key="{current-grouping-key()}" count="{count(current-group())}" />
	        </xsl:for-each-group>
	    </xsl:variable>
	    
	    <xsl:variable name="manyGroups" select="$groups/group[@count &lt; $minGroupSize]" />
	    
	    <xsl:variable name="propertiesManyGroup" 
	                  select="$properties[@category = $manyGroups/@key]" />
	    
	    <xsl:variable name="manyGroupLabel">
	       <xsl:for-each select="$manyGroups">
	           <xsl:sort select="@key" />
	           <xsl:if test="position() > 1">
	               <xsl:value-of select="' / '" />
	           </xsl:if>
	           <xsl:value-of select="@key" />
	       </xsl:for-each>
	    </xsl:variable>
        
        <xsl:call-template name="processGroup">
            <xsl:with-param name="group"    select="$propertiesManyGroup" />
            <xsl:with-param name="category" select="$manyGroupLabel" />
            <xsl:with-param name="position" select="1" />
        </xsl:call-template>
        
        <xsl:for-each select="$groups/group[@count >= $minGroupSize]">
            <xsl:sort select="@key" />
            
            <xsl:call-template name="processGroup">
                <xsl:with-param name="group"    select="$properties[@category = current()/@key]" />
                <xsl:with-param name="category" select="@key" />
                <xsl:with-param name="position" select="position() + 1" />
            </xsl:call-template>
        </xsl:for-each>
        
        <!-- </div> -->
    </xsl:template>
    
    <xsl:template name="processGroup">
        <xsl:param name="group" />
        <xsl:param name="category" />
        <xsl:param name="position" />
    
        <!-- <div id="category"> -->
        <li>
            <span class="negrito"><xsl:value-of select="$category" /></span>
            <ul class="bodycopylist">
            <xsl:for-each select="$group">
                <xsl:sort select="@name" />
                <li><xsl:apply-templates select="." /></li>
            </xsl:for-each>
            </ul>
        </li>
        <!-- </div> -->
         
        <xsl:if test="(($position - 1) mod 3) = 2">
            <div class="clear"></div>
            <div class="vSpacer"></div>
        </xsl:if>
        
    </xsl:template>
    
    <xsl:template match="com:property">
        <xsl:variable name="helpUrl" select="concat($helpBaseUrl, @originalType, '.html', '#', @originalName)" />
        
        <xsl:variable name="rewrittenName" select="$rewriteProps/prop[. = current()/@name]/@as" />
        
        <xsl:variable name="name" select="if ($rewrittenName) then $rewrittenName else string(@name)" />
        
        <span class="js-identifier"><a href="{$helpUrl}" target="comjsdocs"><xsl:value-of select="$name" /></a></span>
        <xsl:if test="@default != ''">
            <span class="js-punctuation"><xsl:value-of select="$nbsp" disable-output-escaping="yes"/>: </span>
            <span class="js-{fun:getJSType(@default)}"><xsl:value-of select="@default" /></span>
        </xsl:if>
        <xsl:if test="count(typeName/node()) > 0">
            <span class="js-comment">  //<xsl:value-of select="$nbsp" disable-output-escaping="yes"/><xsl:copy-of select="typeName/node()" />
	        <!--
	          <xsl:value-of select="replace(com:documentation, '^(.*?\.).*$', '$1', 'sm')" />
	          -->
	        </span>
	    </xsl:if>
    </xsl:template>
    
    <xsl:function name="fun:expandComplexProperties">
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
                <xsl:variable name="nonComplexTypes">
                    <xsl:apply-templates select="types" mode="clean-types" />
                </xsl:variable>
            
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
                <xsl:variable name="nameEx"
                              select="concat(
                                        $name,
                                        if($nonComplexTypes/types/primitive[@isExtension='true'])
                                        then '_'
                                        else '')" />
                
	            <xsl:variable name="expandedName" select="fun:expandName($path, $nameEx)" />
	            
	            <!-- Is expanded property excluded? -->
	            <xsl:if test="count($excludeProps/prop[. = $expandedName]) = 0">
	            
	                <xsl:variable name="expandableComplexTypes"
	                              select="fun:getExpandableComplexTypes(types)" />
	                
	                <!-- When expanding, 
	                     skip the local category, 
	                     unless there's no categPath above.
	                     Limit to a maximum of 2 categories. 
	                     -->
	                <xsl:variable name="expandedCat"
	                              select="fun:limitCategoryTitle(
	                                  if (count($expandableComplexTypes) = 0)
	                                  then fun:join(' > ', $categPath, @category)
	                                  else (
	                                     if ($categPath) 
	                                     then fun:join(' > ', $categPath, fun:buildTitleFromName($name))
	                                     else fun:join(' > ', @category,  fun:buildTitleFromName($name))))" />
	                                    
	                <xsl:variable name="nonComplexTypesName">
	                    <xsl:apply-templates select="$nonComplexTypes" mode="build-type-name">
	                        <xsl:with-param name="defaultValue" select="string(@default)"/>
	                    </xsl:apply-templates>
	                </xsl:variable>
	                
			        <xsl:if test="$nonComplexTypesName != '' or @default != ''">
			            <com:property name="{$expandedName}" 
			                          category="{$expandedCat}" 
			                          originalType="{fun:getTypeFullName($compType)}" 
			                          originalName="{@name}">
			                <xsl:copy-of select="@*[name() != 'name' and name() != 'category']" />
			                <xsl:copy-of select="*" />
			                <typeName>
			                    <xsl:copy-of select="$nonComplexTypesName" />
			                </typeName>
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
			                <xsl:copy-of select="fun:expandComplexProperties(., $childPath, string($childMinPath), $expandedCat)" />
			            </xsl:for-each>
			        </xsl:if>
		        </xsl:if>
		    </xsl:if>
        </xsl:for-each>
                
    </xsl:function>
    
    <xsl:function name="fun:limitCategoryTitle">
        <xsl:param name="category" />
        
        <xsl:variable name="categories" select="subsequence(tokenize($category, '\s*>\s*'), 1, 2)" />
        
        <xsl:value-of select="$categories" separator=" > "/>
    </xsl:function>
    
    <xsl:function name="fun:getExpandableComplexTypes">
        <!-- Complex types that will be expanded -->
        <xsl:param name="types" />

        <xsl:for-each select="$types/complex">
            <xsl:variable name="propComplexType" 
                          select="$complexTypesExp[fun:getTypeFullName(.) = current()/@of]" />
            
            <!-- If @use = literal, skip the complex type
                 Must also skip any complexTypes of the pvc.options.marks space,
                 so that custom extension point Marks don't get expanded. 
                 -->
            <xsl:if test="
                    $propComplexType
                    [@use='expanded' or @use='any']
                    [@space != 'pvc.options.marks']">
                <xsl:sequence select="$propComplexType" />
            </xsl:if>
        </xsl:for-each>
    </xsl:function>
    
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
    
    
    <!-- CLEAN TYPES -->
    <xsl:template match="types" mode="clean-types">
        <xsl:copy>
            <xsl:apply-templates select="*" mode="clean-types" />
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="list" mode="clean-types">
        <xsl:variable name="children">
            <xsl:apply-templates select="*" mode="clean-types" />
        </xsl:variable>
        <xsl:if test="count($children/*) > 0">
	        <xsl:copy>
	            <xsl:copy-of select="@*" />
	            <xsl:copy-of select="$children" />
	        </xsl:copy>
	    </xsl:if>
    </xsl:template>
    
    <xsl:template match="function" mode="clean-types">
        <primitive of="function" />
    </xsl:template>
    
    <!--
    <xsl:template match="atom" mode="clean-types">
        <xsl:variable name="atomType" select="$atomTypes[fun:getTypeFullName(.) = current()/@of]" />
        <primitive of="{$atomType/@base}" />
    </xsl:template>
    -->
    
    <!-- Let extension point classes pass-through as 
         a primitive type of its corresponding "pv.Mark" subclass.
         The primitive tag is marked with an @isExtension attribute
         so that, later, it can be identified as an extension type.
         -->
    <xsl:template match="complex" mode="clean-types">
        <xsl:variable name="compType" select="$complexTypesExp[fun:getTypeFullName(.) = current()/@of]" />
        <xsl:if test="$compType/@space = 'pvc.options.marks'">
            <primitive of="pv.{replace($compType/@name, '^(.*?)ExtensionPoint$', '$1')}" isExtension="true" />
        </xsl:if>
    </xsl:template>
    
    <xsl:template match="map" mode="clean-types">
    </xsl:template>
    
    <xsl:template match="*" mode="clean-types">
        <xsl:copy-of select="." />
    </xsl:template>

    
    <!-- From a types element, 
         build the type name string -->
    <xsl:template match="types" mode="build-type-name">
        <xsl:param name="defaultValue" select="''" />
        
        <xsl:variable name="items">
            <xsl:apply-templates select="*" mode="build-type-name">
                <xsl:with-param name="defaultValue" select="$defaultValue"/>
            </xsl:apply-templates>
        </xsl:variable>
        
        <xsl:for-each select="$items/*">
            <xsl:if test="position() > 1">
                <xsl:value-of select="' | '" />
            </xsl:if>
            
            <xsl:copy-of select="node()" />
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="list" mode="build-type-name">
        <xsl:param name="defaultValue" />
        
        <xsl:variable name="items">
            <xsl:apply-templates select="*" mode="build-type-name">
                <xsl:with-param name="defaultValue" select="$defaultValue" />
            </xsl:apply-templates>
        </xsl:variable>
        
        <item>
        <xsl:value-of select="'list('" />
        <xsl:for-each select="$items/*">
            <xsl:if test="position() > 1">
                <xsl:value-of select="' | '" />
            </xsl:if>
            <xsl:copy-of select="node()" />
        </xsl:for-each>
        <xsl:value-of select="')'" />
        </item>
    </xsl:template>
    
    <xsl:template match="map" mode="build-type-name">
        <xsl:param name="defaultValue" />
        
        <xsl:variable name="items">
            <xsl:apply-templates select="*" mode="build-type-name">
                <xsl:with-param name="defaultValue" select="$defaultValue"/>
            </xsl:apply-templates>
        </xsl:variable>
        
        <item>
        <xsl:value-of select="'map('" />
        <xsl:for-each select="$items/*">
            <xsl:if test="position() > 1">
                <xsl:value-of select="' : '" />
            </xsl:if>
            <xsl:copy-of select="node()" />
        </xsl:for-each>
        <xsl:value-of select="')'" />
        </item>
    </xsl:template>
    
    <xsl:template match="atom" mode="build-type-name">
        <xsl:param name="defaultValue" />
        
        <xsl:variable name="atomType" select="$atomTypes[fun:getTypeFullName(.) = current()/@of]" />
        <item>
        <xsl:choose>
            <xsl:when test="$atomType/com:atom">
                <span class="js-punctuation">[</span>
                <xsl:for-each select="$atomType/com:atom[@value != $defaultValue]">
                    <xsl:if test="position() > 1">
                        <span class="js-punctuation">, </span>
                    </xsl:if>
                    <span class="js-{fun:getJSType(@value)}"><xsl:value-of select="@value" /></span>
                </xsl:for-each>
                <span class="js-punctuation">]</span>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$atomType/@base" />
            </xsl:otherwise>
        </xsl:choose>
        </item>
    </xsl:template>
    
    <xsl:template match="*" mode="build-type-name">
        <xsl:param name="defaultValue" />
        
        <xsl:variable name="jsType" select="fun:getJSType($defaultValue)" />
        
        <xsl:if test="@of != $jsType">
            <item><xsl:value-of select="@of" /></item>
        </xsl:if>
    </xsl:template>
    
</xsl:stylesheet>