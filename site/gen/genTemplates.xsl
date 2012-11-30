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
	                  select="concat($outBaseUrl, @name, '.html')" />
        
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
        <!-- <div id="main"> -->
	        <div class="bodycopydiv">
	            <ul class="bodycopy">
		            <li class="negrito">
				        <xsl:copy-of select="t:summary/node()" />
				    </li>
			        
			        <li></li>
	                <li></li>
	                
	                <xsl:for-each select="t:example">
	                    <xsl:variable name="resourceName"
	                                  select="replace($template/@exampleMask, '\{0\}', string(position()))" />
	                    
	                    <div class="clear"></div>
	                    <div class="vSpacer"></div>
	                    
	                    <xsl:comment>EXAMPLE <xsl:value-of select="position()" /> BEG</xsl:comment>
	                    
	                    <div class="bodycopytitle"><xsl:value-of select="@title" /></div>
	                    
	                    <div class="chartContent">
	                        <div class="chartDefs">
					            <textarea class="chartDefsTextArea" cols="55" rows="15"><xsl:comment> @RESOURCE@ "<xsl:value-of select="$resourceName" />" </xsl:comment></textarea>
					            
					            <button class="tryMe" onclick='tryMe(this)'>Try me</button>
					        </div>
					        <div class="chartDiv"></div>
					        <div class="clear"></div>
					    </div>
					    
	                    <xsl:comment>EXAMPLE <xsl:value-of select="position()" /> END</xsl:comment>
	                </xsl:for-each>
	                
	                <div class="clear"></div>
                    <div class="vSpacer"></div>
                        
                    <xsl:comment> @RESOURCE@ "<xsl:value-of select="concat($summaryResourceBaseUrl, @name, '.html')" />"  </xsl:comment>
	            </ul>
	        </div>
	    <!-- </div> -->
	    <xsl:comment> @RESOURCE@ "cccExampleFooter.html" </xsl:comment>
    </xsl:template>
</xsl:stylesheet>