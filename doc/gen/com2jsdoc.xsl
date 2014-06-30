<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:com="urn:webdetails/com/2012"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:fun="localfunctions"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xs="http://www.w3.org/2001/XMLSchema">
    
    <xsl:output method="text" />
    
    <xsl:param name="relativePath" select="''" />
    
    <!-- New Line character -->
    <xsl:variable name='nl'><xsl:text>&#xd;&#xa;</xsl:text></xsl:variable>
    
    <xsl:variable name="funTypes"   select="fun:getFunctionTypes(/)" />
    <xsl:variable name="facetTypes" select="fun:getFacetTypes(/)" />
    
    <xsl:template match="/com:model">
       <xsl:apply-templates select="com:space|com:complexType|com:atomType|com:include" />
    </xsl:template>

    <xsl:template match="/com:model/com:include">
       <xsl:if test="string(@the) != ''">
           <xsl:apply-templates select="document(concat($relativePath,@the))/com:model" />
       </xsl:if>
    </xsl:template>

    <xsl:template match="/com:model/com:space">
        <!-- Generate the JS namespace constructor documentation -->
        <xsl:value-of select="concat($nl, '/**')" />

        <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />

        <!-- Output @namespace directive -->
        <xsl:value-of select="concat($nl, ' * @namespace')" />

        <!-- Close documentation block -->
        <xsl:value-of select="concat($nl, ' */')" />

        <!-- Generate the JS class constructor -->
        <xsl:value-of select="concat($nl, @name, ' = {};', $nl)" />
    </xsl:template>

    <xsl:template match="/com:model/com:complexType">
        <xsl:variable name="complexTypeDef" select="." />
        <xsl:variable name="fullTypeName">
            <xsl:choose>
                <xsl:when test="@space">
                    <xsl:value-of select="concat(@space, '.', @name)" />
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="@name" />
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <!-- Generate the JS class constructor documentation -->
        <xsl:value-of select="concat($nl, '/**')" />
        
        <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />
	    
        <!-- Output @class directive -->
        <xsl:value-of select="concat($nl, ' * @class')" />

        <xsl:if test="string(@base) != ''">
            <!-- Output @extends directive -->
            <xsl:value-of select="concat($nl, ' * @extends ', @base)" />
        </xsl:if>

        <xsl:if test="string(@abstract) != ''">
            <!-- Output @extends directive -->
            <xsl:value-of select="concat($nl, ' * @abstract')" />
        </xsl:if>
	    
	    <!-- Close documentation block -->
        <xsl:value-of select="concat($nl, ' */')" /> 

        <!-- Generate the JS class constructor -->
        <xsl:value-of select="concat($nl, $fullTypeName)" /> = function(){};
        
        <!-- Output properties -->
        <!-- from facets -->
        <xsl:if test="string(@facets) != ''">
            <xsl:for-each select="tokenize(@facets, '\s+')">
                <xsl:variable name="facetTypeDef" select="$facetTypes[fun:getTypeFullName(.)=string(current())]" />
                <xsl:if test="$facetTypeDef">
                   <xsl:for-each select="$facetTypeDef/com:property">
                        <xsl:sort select="@category" />
                        <xsl:sort select="@name" />

                        <!-- Only output if property not declared/overriden locally
                             TODO: what about facet property clashes?
                         -->
                        <xsl:if test="not($complexTypeDef/com:property[string(@name) != '' and @name=current()/@name])">
                            <xsl:apply-templates select=".">
                                <xsl:with-param name="fullTypeName" select="$fullTypeName" />
                            </xsl:apply-templates>
                        </xsl:if>
                    </xsl:for-each>
                </xsl:if>
            </xsl:for-each>
        </xsl:if>
        
        <xsl:for-each select="com:property[string(@name) != '']">
            <xsl:sort select="@category" />
            <xsl:sort select="@name" />
            
            <xsl:apply-templates select=".">
                <xsl:with-param name="fullTypeName" select="$fullTypeName" />
            </xsl:apply-templates>
        </xsl:for-each>
        
    </xsl:template>
    
    <xsl:template match="com:property">
        <xsl:param name="fullTypeName" />
        
        <xsl:value-of select="concat($nl, '/**')" />
        <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />
        
        <!-- , or space are synonyms with | -->
        <xsl:variable name="type" select="string(@type)" />
        <xsl:variable name="funTypeDef" select="$funTypes[fun:getTypeFullName(.)=$type]" />
        
        <xsl:variable name="typeTag">
            <xsl:choose>
                <xsl:when test="$funTypeDef">
                    <xsl:choose>
                        <xsl:when test="$funTypeDef/com:returns/@type">
                            <xsl:value-of select="$funTypeDef/com:returns/@type" />
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="'undefined'" />
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="$type" />
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <xsl:variable name="typeTagText" select="fn:replace($typeTag, '([^:])\s+([^:])', '$1|$2')" />
        
        <xsl:choose>
            <xsl:when test="$funTypeDef">
                <xsl:value-of select="concat($nl, ' * @returns {', $typeTagText, '}')" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="concat($nl, ' * @type ', $typeTagText)" />
            </xsl:otherwise>
        </xsl:choose>
        
        <xsl:apply-templates select="$funTypeDef/com:returns/com:documentation" mode="process-jsdoc" />
        
        <xsl:choose>
            <xsl:when test="$funTypeDef">
                <!-- Regular Arguments -->
                <xsl:value-of select="concat($nl, ' * @method')" />
                
                <xsl:for-each select="$funTypeDef/com:argument">
                    <xsl:choose>
                        <xsl:when test="@name != 'this'">
                            <xsl:value-of select="concat($nl, ' * @param ')" />
                            <xsl:value-of select="concat('{', fn:replace(@type, '([^:])\s+([^:])', '$1|$2') ,'} ')" />
                            <xsl:if test="count(@required) = 0 or @required='false'">
                                <xsl:value-of select="'['" />
                            </xsl:if>
                            
                            <xsl:value-of select="@name" />
                            
                            <xsl:if test="@default">
                                <xsl:value-of select="concat('=', @default)" />
                            </xsl:if>
                            
                            <xsl:if test="count(@required) = 0 or @required='false'">
                                <xsl:value-of select="']'" />
                            </xsl:if>
                            
                            <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="concat($nl, ' * @this ', fn:replace(@type, '([^:])\s+([^:])', '$1|$2'))" />
                        </xsl:otherwise>
                    </xsl:choose>
                    
                </xsl:for-each>
            </xsl:when>
            <xsl:otherwise>
                <xsl:if test="count(@default) > 0">
                    <xsl:value-of select="concat($nl, ' * @default ', @default)" />
                </xsl:if>
            </xsl:otherwise>
        </xsl:choose>
        
        <xsl:if test="string(@category) != ''">
            <xsl:value-of select="concat($nl, ' * @category ', @category)" />
        </xsl:if>
        
        <xsl:if test="string(@fixed) != ''">
            <xsl:value-of select="concat($nl, ' * @constant')" />
        </xsl:if>
        
        <xsl:value-of select="concat($nl, ' */')" />
       
        <xsl:variable name="equalsTo">
            <xsl:choose>
                <xsl:when test="$funTypeDef">
                    <xsl:value-of select="'function(){}'" />
                </xsl:when>
                <xsl:when test="string(@fixed) != ''">
                    <xsl:value-of select="@fixed" />
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="'undefined'" />
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <!-- Generate the JS property -->
        <xsl:value-of select="concat($nl, $fullTypeName, '.prototype.', @name, ' = ', $equalsTo, ';')" />
    </xsl:template>
    
    <xsl:template match="/com:model/com:atomType"> 
    
        <xsl:variable name="fullTypeName" select="fun:getTypeFullName(.)" />
        
        <!-- Generate the JS class constructor documentation -->
        <xsl:value-of select="concat($nl, '/**')" />
        
        <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />
        
        <!-- Output @class directive -->
        <xsl:value-of select="concat($nl, ' * @class')" />
        <xsl:value-of select="concat($nl, ' * @enum')"  />
        
        <xsl:if test="string(@base) != ''">
           <!-- Output @extends directive -->
           <xsl:value-of select="concat($nl, ' * @extends ', @base)" />
        </xsl:if>
        
        <!-- Close documentation block -->
        
        <xsl:value-of select="concat($nl, ' */')" /> 

        <!-- Generate the JS class constructor -->
        <xsl:value-of select="concat($nl, $fullTypeName)" /> = function(){};
        
        <!-- Output properties -->
        <xsl:for-each select="com:atom">
            <xsl:sort select="@name" />
            
            <xsl:value-of select="concat($nl, '/**')" />
            <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />
            <xsl:value-of select="concat($nl, ' * @value ', @value)" />    
            <xsl:value-of select="concat($nl, ' */')" />
            
            <!-- Generate the JS property -->
            <xsl:value-of select="concat($nl, $fullTypeName, '.prototype.', @name, ' = ', @value, ';')" />
        </xsl:for-each>
    </xsl:template>
    
    <!-- Process Documentation Text -->
    
    <xsl:template match="com:documentation" mode="process-jsdoc" priority="5">
        <xsl:apply-templates select="node()[local-name(.) != 'deprecated']" mode="process-jsdoc" />
        <xsl:apply-templates select="com:deprecated" mode="header" />
    </xsl:template>
    
    <xsl:template match="com:deprecated" mode="header" priority="5">
        <xsl:value-of select="concat($nl, ' * @deprecated ')" />
        <xsl:apply-templates mode="process-jsdoc" />
    </xsl:template>
    
    <xsl:template match="text()" mode="process-jsdoc" priority="5">
        <xsl:param name="mode" select="'xml'" />
        
        <xsl:choose>
            <xsl:when test="$mode = 'xml'">
                <!-- Trim -->
                <xsl:variable name="text" select="." /> 
                <!-- 
                      select="replace(., '^([\r\n]*)(.+?)([\r\n]*)$', ' $2 ')" />
                -->
                               
                <!-- Empty lines become <p>'s -->  
                <xsl:variable name="text2" 
                              select="replace($text, '[\r\n]+\s*$', concat($nl, '&lt;p&gt;'), 'm')" />
                
                <!-- Remove trailing <p> ... -->
                <xsl:variable name="text3" 
                              select="replace($text2, '&lt;p&gt;$', '')" />
                              
                <!-- trim leading spaces -->
                <xsl:value-of select="replace($text3, '[\r\n]+\s*', concat($nl, ' * '))" />
            </xsl:when>
            <xsl:otherwise>
                <!-- don't trim leading spaces or compact multiple consecutive lines -->
                <xsl:value-of select="replace(., '[\r\n]', concat($nl, ' * '))" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="com:link" mode="process-jsdoc" priority="5">
        <!-- Translate to JSDoc link -->
        <xsl:value-of select="concat('{@link ', @to, '}')" />
    </xsl:template>
    
    <xsl:template match="com:example" mode="process-jsdoc" priority="5">
        <xsl:param name="mode" select="'xml'" />
        
        <xsl:value-of select="concat($nl, ' * &lt;', 'p', '&gt;')" />
        
        <xsl:apply-templates mode="process-jsdoc">
            <xsl:with-param name="mode" select="$mode" />
        </xsl:apply-templates>
        
        <xsl:value-of select="concat($nl, ' * &lt;', 'p', '&gt;')" />
    </xsl:template>
    
    <xsl:template match="xhtml:pre" mode="process-jsdoc" priority="5">
        <xsl:param name="mode" select="'xml'" />
        
        <!-- copy element and **change** mode -->
        <xsl:apply-templates select="." mode="copy_begin" />
        
        <xsl:apply-templates mode="process-jsdoc">
            <xsl:with-param name="mode" select="'pre'" />
        </xsl:apply-templates>
        
        <xsl:value-of select="concat($nl, ' * ')" />
        <xsl:apply-templates select="." mode="copy_end" />
    </xsl:template>
    
    <xsl:template match="node()" mode="process-jsdoc" priority="0">
        <xsl:param name="mode" select="'xml'" />
    
        <!-- copy node and **keep** mode -->
        <xsl:apply-templates select="." mode="copy_begin" />
        
        <xsl:apply-templates mode="process-jsdoc">
            <xsl:with-param name="mode" select="$mode" />
        </xsl:apply-templates>
        
        <xsl:apply-templates select="." mode="copy_end" />
    </xsl:template>
    
    <!-- STUFF TO OUTPUT XML TAGS IN TEXT MODE 
         adapted from a snippet in
         http://stackoverflow.com/questions/1162352/converting-xml-to-escaped-text-in-xslt
         -->
    <xsl:template match="*" mode="copy_begin">
        <!-- Begin opening tag -->
        
        <xsl:value-of select="concat($nl, ' * &lt;', name())" />
        
        <!-- Namespaces
        <xsl:for-each select="namespace::*">
            <xsl:text> xmlns</xsl:text>
            <xsl:if test="name() != ''">
                <xsl:text>:</xsl:text>
                <xsl:value-of select="name()"/>
            </xsl:if>
            <xsl:text>='</xsl:text>
            <xsl:call-template name="escape-xml">
                <xsl:with-param name="text" select="."/>
            </xsl:call-template>
            <xsl:text>'</xsl:text>
        </xsl:for-each>
        -->
        
        <!-- Attributes -->
        <xsl:for-each select="@*">
            <xsl:value-of select="concat(' ', name())" />
            <xsl:text>='</xsl:text>
            <xsl:call-template name="escape-xml">
                <xsl:with-param name="text" select="."/>
            </xsl:call-template>
            <xsl:text>'</xsl:text>
        </xsl:for-each>

        <!-- End opening tag -->
        <xsl:text>&gt;</xsl:text>
    </xsl:template>
    
    <xsl:template match="*" mode="copy_end">
        <!-- Closing tag -->
        <xsl:value-of select="concat('&lt;/', name(), '&gt;')" />
    </xsl:template>
    
    <xsl:template match="text()" mode="escape">
        <xsl:call-template name="escape-xml">
            <xsl:with-param name="text" select="."/>
        </xsl:call-template>
    </xsl:template>

    <xsl:template match="processing-instruction()" mode="escape">
        <xsl:text>&lt;?</xsl:text>
        <xsl:value-of select="name()"/>
        <xsl:text> </xsl:text>
        <xsl:call-template name="escape-xml">
            <xsl:with-param name="text" select="."/>
        </xsl:call-template>
        <xsl:text>?&gt;</xsl:text>
    </xsl:template>

    <xsl:template name="escape-xml">
        <xsl:param name="text"/>
        <xsl:if test="$text != ''">
            <xsl:variable name="head" select="substring($text, 1, 1)"/>
            <xsl:variable name="tail" select="substring($text, 2)"/>
            <xsl:choose>
                <xsl:when test="$head = '&amp;'">&amp;amp;</xsl:when>
                <xsl:when test="$head = '&lt;'">&amp;lt;</xsl:when>
                <xsl:when test="$head = '&gt;'">&amp;gt;</xsl:when>
                <xsl:when test="$head = '&quot;'">&amp;quot;</xsl:when>
                <xsl:when test="$head = &quot;&apos;&quot;">&amp;apos;</xsl:when>
                <xsl:otherwise><xsl:value-of select="$head"/></xsl:otherwise>
            </xsl:choose>
            <xsl:call-template name="escape-xml">
                <xsl:with-param name="text" select="$tail"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
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
</xsl:stylesheet>