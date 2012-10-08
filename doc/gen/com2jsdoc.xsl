<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:com="urn:webdetails/com/2012"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:xhtml="http://www.w3.org/1999/xhtml">
    
    <xsl:output method="text" />
    
    <!-- New Line character -->
    <xsl:variable name='nl'><xsl:text>&#xd;&#xa;</xsl:text></xsl:variable>
    
	<xsl:template match="/com:model">
		<xsl:apply-templates select="com:complexType" />
	</xsl:template>
	
	<xsl:template match="com:complexType">
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
        
        <!-- Generate the JS class constructor documentation 
        -->
        <xsl:value-of select="concat($nl, '/**')" />
        
        <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />
	    
	    <!-- Output @class directive -->
	    <xsl:value-of select="concat($nl, ' * @class')" />
	    
	    <xsl:if test="string(@base) != ''">
	       <!-- Output @extends directive -->
           <xsl:value-of select="concat($nl, ' * @extends ', @base)" />
	    </xsl:if>
	    
	    <!-- Close documentation block -->
        <xsl:value-of select="concat($nl, ' */')" /> 

        <!-- Generate the JS class constructor -->
        <xsl:value-of select="concat($nl, $fullTypeName)" /> = function(){};
        
        
        
        <!-- Output properties -->
        <xsl:for-each select="com:property">
           <xsl:sort select="@name" />
           <xsl:value-of select="concat($nl, '/**')" />
           <xsl:apply-templates select="com:documentation" mode="process-jsdoc" />           
           <xsl:value-of select="concat($nl, ' * @type ', @type)" />
           
           <xsl:if test="count(@default) > 0">
                <xsl:value-of select="concat($nl, ' * @default ', @default)" />
           </xsl:if>
           
           <xsl:value-of select="concat($nl, ' */')" />
           
           <!-- Generate the JS property -->
           <xsl:value-of select="concat($nl, $fullTypeName, '.prototype.', @name)" /> = undefined;
        </xsl:for-each>
        
    </xsl:template>
    
    
    <!-- Process Documentation Text -->
    
    <xsl:template match="com:documentation" mode="process-jsdoc" priority="5">
        <xsl:apply-templates select="node()" mode="process-jsdoc" />
    </xsl:template>
    
    <xsl:template match="text()" mode="process-jsdoc" priority="5">
        <xsl:param name="mode" select="'xml'" />
        
        <xsl:choose>
            <xsl:when test="$mode = 'xml'">
                <!-- Empty lines become <p>'s -->  
                <xsl:variable name="text" 
                              select="replace(., '[\r\n]+\s*$', concat($nl, '&lt;p&gt;'), 'm')" />
                
                <!-- Remove trailing <p> ... -->
                <xsl:variable name="text2" 
                              select="replace($text, '&lt;p&gt;$', '')" />
                              
                <!-- trim leading spaces -->
                <xsl:value-of select="replace($text2, '[\r\n]+\s*', concat($nl, ' * '))" />
            </xsl:when>
            <xsl:otherwise>
                <!-- don't trim leading spaces -->
                <xsl:value-of select="replace(., '[\r\n]+', concat($nl, ' * '))" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="com:link" mode="process-jsdoc" priority="5">
        <!-- Translate to JSDoc link -->
        <xsl:value-of select="concat('{@link ', @href, '}')" />
    </xsl:template>
    
    <xsl:template match="xhtml:pre" mode="process-jsdoc" priority="5">
        <xsl:param name="mode" select="'xml'" />
        
        <!-- copy element and **change** mode -->
        <xsl:apply-templates select="." mode="copy_begin" />
        
        <xsl:apply-templates mode="process-jsdoc">
            <xsl:with-param name="mode" select="'pre'" />
        </xsl:apply-templates>
        
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
        <xsl:text>&lt;</xsl:text>
        <xsl:value-of select="name()"/>

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
            <xsl:text> </xsl:text>
            <xsl:value-of select="name()"/>
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
        <xsl:text>&lt;/</xsl:text>
        <xsl:value-of select="name()"/>
        <xsl:text>&gt;</xsl:text>
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
    
</xsl:stylesheet>