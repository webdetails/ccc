<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:t="urn:webdetails/tmp/2012"
    xmlns:fun="localfunctions"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    exclude-result-prefixes="t fun xsl xhtml">
    
    <xsl:output method="xhtml" indent="no" />
    <xsl:output method="xhtml" omit-xml-declaration="yes" indent="yes" name="html" />
    
    <xsl:strip-space elements="*"/>
    
    <xsl:param name="outBaseUrl"  select="''" />
    <xsl:param name="summaryResourceBaseUrl"  select="''" /><!-- ../../dist/summary/ -->
    
    <xsl:variable name='nl'><xsl:text>&#xa;</xsl:text></xsl:variable>
    
    <!-- MAIN TEMPLATE - The flow Starts Here -->
	<xsl:template match="/">
	   <xsl:apply-templates select="t:templates/t:template" />    
	</xsl:template>
	
	<xsl:template match="t:template">
	    <xsl:variable name="filename" 
	                  select="concat($outBaseUrl, lower-case(replace(replace(@name, '\s+', '-'), '[^0-9a-zA-Z-_]', '-')), '.html')" />
        
        <xsl:result-document href="{$filename}" format="html">
            <xsl:message>
                <xsl:value-of select="$filename" />
            </xsl:message>
            
            <xsl:apply-templates select="." mode="process">
                <xsl:with-param name="filename" select="$filename" />
            </xsl:apply-templates>
        </xsl:result-document>
    </xsl:template>
    
    <xsl:template match="t:template" mode="process">
        <xsl:param name="filename" />
        
        <xsl:variable name="template" select="." />
        
        <xsl:comment> @RESOURCE@ "cccExampleHeader.html" </xsl:comment>
     
        <p>
            <xsl:copy-of select="t:summary/node()" />
        </p>
	          
        <xsl:for-each select="t:example">
            <xsl:variable name="resourceName"
                          select="replace($template/@exampleMask, '\{0\}', string(position()))" />
                  
                  <xsl:comment>EXAMPLE <xsl:value-of select="position()" /> BEG</xsl:comment>
                  <xsl:variable name="exampleId" select="lower-case(replace(replace(@title, '\s+', '-'), '[^0-9a-zA-Z-_]', '-'))" />
                  <h2 id="{$exampleId}"><xsl:value-of select="@title" /></h2>
                  <div class="chartContent">
                      <div class="chartDiv"></div>
                      <div class="chartDefs">
		                  <textarea class="chartDefsTextArea" cols="55" rows="15"><xsl:comment> @RESOURCE@ "<xsl:value-of select="$resourceName" />" </xsl:comment></textarea>
		                  <button class="tryMe" onclick='tryMe(this)'>Update Chart</button>
		              </div>
		          </div>
		          
		          <xsl:comment>EXAMPLE <xsl:value-of select="position()" /> END</xsl:comment>
        </xsl:for-each>
              
        <xsl:comment> @RESOURCE@ "<xsl:value-of 
            select="concat($summaryResourceBaseUrl, lower-case(replace(replace(@name, '\s+', '-'), '[^0-9a-zA-Z-_]', '-')), '.html')" />"  </xsl:comment>
        
	    <xsl:comment> @RESOURCE@ "cccExampleFooter.html" </xsl:comment>
    </xsl:template>
</xsl:stylesheet>