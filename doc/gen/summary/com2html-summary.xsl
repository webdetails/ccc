<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:com="urn:webdetails/com/2012"
    xmlns:c="urn:webdetails/com/2012"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:fun="localfunctions"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    exclude-result-prefixes="com fun xs xsl fn xhtml xsi c">
    
    <xsl:output method="xhtml" indent="no" />
    
    <!-- Unfortunately indenting creates unwanted spaces in some places of the HTML.
         Use indenting only for debugging the stylesheet's output. 
         -->
    <xsl:output method="xhtml" indent="no" name="html" omit-xml-declaration="yes" />
    
    <!-- PARAMETERS -->
    <xsl:param name="outBaseUrl"  select="''" />
    <xsl:param name="helpBaseUrl" select="''" />
    
    <!-- CONFIGURATION VARIABLES for some of COM-LIB features -->
    <xsl:variable name="excludeProps">
        <prop></prop>
        <!--
        <prop>trendTrend</prop>
        <prop>trendNullInterpolationMode</prop>
          -->
    </xsl:variable>
    
    <xsl:variable name="excludeLocalProps">
        <prop></prop>
        <!-- 
        <prop>keepInBounds</prop>
        <prop>alignTo</prop>
         -->
    </xsl:variable>
    
    <xsl:variable name="rewriteProps">
        <prop as="colors">colorColors</prop>
        <prop as="legendVisible">colorLegendVisible</prop>
        <prop as="legendDrawLine">colorLegendDrawLine</prop>
        <prop as="legendDrawMarker">colorLegendDrawMarker</prop>
        <prop as="legendShape">colorLegendShape</prop>
        <prop as="legendClickMode">colorLegendClickMode</prop>
    </xsl:variable>
    
    <!-- Properties with overridden defaults, by expanded name (but before rename) -->
    <xsl:variable name="overrideDefaultsProps">
        <prop></prop>
        <!--  <prop default="2">compatVersion</prop> -->
    </xsl:variable>
    
    <!-- Include COM-LIB -->
    <xsl:include href="../com-lib.xsl" />
    
    <xsl:variable name="minGroupSize" select="0" />
    
    <!-- MAIN TEMPLATE - The flow Starts Here -->
    <xsl:template match="/">
        <xsl:for-each select="$complexTypesExp[@space='pvc.options.charts' and not(@abstract='true')]">
            <xsl:variable name="filename" select="concat($outBaseUrl, replace(lower-case(@name), '^(.*?)chart$', '$1'), '.html')" />
            
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
        <xsl:variable name="properties" select="fun:processSummaryProperties(.)" />
        
        <xsl:variable name="nonExtProperties" 
                      select="fun:processPropertiesCategory($properties[not(ends-with(@name, '_'))])" />
        
        <xsl:variable name="extProperties"
                      select="fun:processPropertiesCategory($properties[ends-with(@name, '_')])" />
        
        <!-- 
        <h1><xsl:value-of select="fun:buildTitleFromName(@name)" /></h1>
         -->
         
        <xsl:if test="count($nonExtProperties) > 0">
            <h2 id="chart-options">CHART OPTIONS</h2>
            <xsl:call-template name="processComplexType">
                <xsl:with-param name="type" select="." />
                <xsl:with-param name="properties" select="$nonExtProperties" />
            </xsl:call-template>
        </xsl:if>
	    
        <xsl:if test="count($extProperties) > 0">
            <h2 id="extension-points">EXTENSION POINTS</h2>
            <xsl:call-template name="processComplexType">
                <xsl:with-param name="type" select="." />
                <xsl:with-param name="properties" select="$extProperties" />
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="processComplexType">
        <xsl:param name="type" />
        <xsl:param name="properties" />
        
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

        <xsl:if test="count($propertiesManyGroup) > 0">
            <xsl:call-template name="processGroup">
                <xsl:with-param name="group"    select="$propertiesManyGroup" />
                <xsl:with-param name="category" select="$manyGroupLabel" />
                <xsl:with-param name="position" select="1" />
            </xsl:call-template>
        </xsl:if>
        
        <xsl:for-each select="$groups/group[@count >= $minGroupSize]">
            <xsl:sort select="@key" />
            
            <xsl:call-template name="processGroup">
                <xsl:with-param name="group"    select="$properties[@category = current()/@key]" />
                <xsl:with-param name="category" select="@key" />
                <xsl:with-param name="position" select="position() + 1" />
            </xsl:call-template>
        </xsl:for-each>
        
    </xsl:template>
    
    <xsl:template name="processGroup">
        <xsl:param name="group" />
        <xsl:param name="category" />
        <xsl:param name="position" />
        <p class="title"><xsl:value-of select="$category" /></p>
        <ul>
            <xsl:for-each select="$group">
                <xsl:sort select="@name2" case-order="lower-first" />
                <li><xsl:apply-templates select="." /></li>
            </xsl:for-each>
        </ul>
    </xsl:template>
    
    <xsl:template match="com:property">
        <xsl:variable name="helpUrl" select="concat($helpBaseUrl, @originalType, '.html', '#', @originalName)" />
        
        <span class="js-identifier"><a href="{$helpUrl}" target="comjsdocs"><xsl:value-of select="@name2" /></a></span>
        <xsl:if test="@default != ''">
            <span class="js-punctuation"><xsl:value-of select="$nbsp" disable-output-escaping="yes"/>: </span>
            <span class="js-{fun:getJSType(@default)}"><xsl:value-of select="@default" /></span>
        </xsl:if>
        <xsl:if test="count(typeName/node()) > 0">
            <span class="js-comment">  //<xsl:value-of select="$nbsp" disable-output-escaping="yes"/><xsl:copy-of select="typeName/node()" copy-namespaces="no" />
	        <!--
	          <xsl:value-of select="replace(com:documentation, '^(.*?\.).*$', '$1', 'sm')" />
	          -->
	        </span>
	    </xsl:if>
    </xsl:template>
    
    <!-- The "extensionPoints" property are excluded
             through global configuration, 
             so that no pvc.options.marks complex types
             are expected at this phase.
             As such, any 
             -->
             
    <!-- Removes properties that are not shown in the summary. 
         Builds a simplified typeName.
         -->
    <xsl:function name="fun:processSummaryProperties">
        <xsl:param name="complexType" />
        <xsl:for-each select="$complexType/com:property">
            
            <!-- Clean the property's "types" child element -->
            <xsl:variable name="cleanedTypes">
                <xsl:apply-templates select="types" mode="clean-types" />
            </xsl:variable>
            
            <!-- Markup description of the type name -->
            <xsl:variable name="cleanedTypeName">
                <xsl:apply-templates select="$cleanedTypes" mode="build-type-name">
                    <xsl:with-param name="defaultValue" select="string(@default)"/>
                </xsl:apply-templates>
            </xsl:variable>
            
            <!--<xsl:if test="$cleanedTypeName != '' or @default != ''">-->>
                <xsl:copy>
                    <xsl:copy-of select="@*" />
                    <typeName>
                        <xsl:copy-of select="$cleanedTypeName" />
                    </typeName>
                </xsl:copy>
            <!--</xsl:if>-->
        </xsl:for-each>
    </xsl:function>

    <xsl:function name="fun:processPropertiesCategory">
        <xsl:param name="properties" />
        <xsl:for-each select="$properties">

            <!-- Simplify the category
                 If   it has no expandable types (=> terminal)
                 and  it is not a root property
                 and  there are at most 2 properties in the group
                 then use only the base category without the last element.
                 fun:butLastCategory
            -->
            <xsl:variable name="sameCatCount"
                          select="count($properties[@category = current()/@category])" />

            <xsl:variable name="category"
                          select="if($sameCatCount > 2)
                                  then string(@category)
                                  else fun:butLastCategoryIfMoreThanOne(string(@category))" />

            <xsl:copy>
                <xsl:copy-of select="@*[local-name(.) != 'category']" />
                <xsl:attribute name="category">
                    <xsl:value-of select="$category" />
                </xsl:attribute>
                <xsl:copy-of select="*" />
            </xsl:copy>
        </xsl:for-each>
    </xsl:function>

    <xsl:function name="fun:butLastCategoryIfMoreThanOne">
        <xsl:param name="category" />

        <xsl:variable name="categories" select="tokenize($category, '\s*>\s*')" />

        <!-- remove last if more than 1 -->
        <xsl:choose>
            <xsl:when test="count($categories) > 1">
                <xsl:value-of select="subsequence($categories, 1, count($categories) - 1)" separator=" > "/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$category" />
            </xsl:otherwise>
        </xsl:choose>
        
    </xsl:function>

    <!-- CLEAN TYPES 
    
      Translations
      ===============
      * <function of="foo" />         ~~> <primitive of="function" />
      * <list of="gu ga"> ... </list> ~~> process each item
      * <map of="bar guru">...</map>  ~~> **nothing**
      
      * <complex of="pvc.options.Marks.zzzExtensionPoints" />
                                      ~~> <primitive of="pv.zzz" isExtension="true" />
      * <complex ... />               ~~> **nothing**
      
      Passes-through
      ===============
      * <atom ... />
      * <primitive ... />
      * 
     -->
    <xsl:template match="types" mode="clean-types">
        <xsl:copy copy-namespaces="no">
            <xsl:apply-templates select="*" mode="clean-types" />
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="list" mode="clean-types">
        <xsl:variable name="children">
            <xsl:apply-templates select="*" mode="clean-types" />
        </xsl:variable>
        <xsl:if test="count($children/*) > 0">
            <xsl:copy copy-namespaces="no">
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
        <xsl:variable name="compType" select="$complexTypesInh[fun:getTypeFullName(.) = current()/@of]" />
        <xsl:if test="$compType/@space = 'pvc.options.marks'">
            <primitive of="pv.{replace($compType/@name, '^(.*?)ExtensionPoint$', '$1')}" isExtension="true" />
        </xsl:if>
    </xsl:template>
    
    <xsl:template match="map" mode="clean-types">
    </xsl:template>
    
    <xsl:template match="*" mode="clean-types">
        <xsl:copy-of select="." copy-namespaces="no" />
    </xsl:template>
    
    <!-- BUILD-TYPE-NAME -->
    
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