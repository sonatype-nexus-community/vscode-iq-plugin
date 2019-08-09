
'use strict';
console.log ('popup.js');

var artifact
var nexusArtifact
var hasVulns
var thissettings
var settings
var hasLoadedHistory
var vscode
var resourceSrc
var remediation =  "undefined";
if (typeof chrome !== "undefined"){
    chrome.runtime.onMessage.addListener(gotMessage);
}
resourceSrc  =  document.getElementById('resourceSrc').value;
console.log('resourceSrc', resourceSrc);
const selectHandler = async function(e, tab) {
    //lazy loading of history
    //only do it if the user clicks on the tab
    showLoader();
    const remediationTab  = 2;
    console.log('selectHandler', nexusArtifact, artifact)
    if (tab.newTab.index() === remediationTab && !hasLoadedHistory && artifact.datasource === dataSources.NEXUSIQ){
        $("<p></p>", {
            text: "Please wait while we load the Version History...", 
            "class": "status-message ui-corner-all"
          }).appendTo(".ui-tabs-nav", "#pleasewait").css('color', 'white').fadeOut(2500, function() {
            $(this).remove();
          });
        // let remediation
        if (hasVulns) {
            // remediation = await showRemediation(nexusArtifact, settings)
            console.log('showRemediationViaMessage', nexusArtifact);
            await showRemediationViaMessage(nexusArtifact);
            // let allVersions = await GetAllVersions(nexusArtifact, settings, remediation)
        }else{
            // let allVersions = await GetAllVersions(nexusArtifact, settings, remediation)
            console.log('GetAllVersionsViaMessage', nexusArtifact);
            await GetAllVersionsViaMessage(nexusArtifact);
        }
        hasLoadedHistory = true;
    }
    hideLoader();
};
// Handle the message inside the webview
window.addEventListener('message', event =>  {
    console.log('event', event);
    const message = event.data; // The JSON data our extension sent

    switch (message.command) {
        case 'artifact':
            //display
            let component = (message.component);
            nexusArtifact = component.nexusIQData;
            
            artifact = {
                format: 'npm', 
                packageName: component.name, 
                version: component.version,
                datasource: 'NEXUSIQ',
                hash: component.hash
                };
            console.log('artifact message', component, nexusArtifact, artifact);
            beginEvaluation(nexusArtifact);
            
            break;

        case 'cvedetails':
            //display
            let cvedetails = JSON.parse(message.cvedetails);
            console.log('message.cvedetails', cvedetails);
            showCVEPopup(cvedetails);
            break;
        case 'remediation':
            //display
            let remediationMessage = message.remediation;
            console.log('message.remediation', remediationMessage);
            if (remediationMessage.remediation.versionChanges.length>0){
                remediation = remediationMessage.remediation.versionChanges["0"].data.component.componentIdentifier.coordinates.version;
            }else{
                remediation =  "undefined";
            }
            showRemediationPopup(remediationMessage);
            
            console.log('begin GetAllVersionsViaMessage', nexusArtifact);
            vscode.postMessage({
                command: 'GetAllVersions',
                'nexusArtifact': nexusArtifact
            })
        

            break;
        case 'allversions':
            //display
            console.log('message.allversions', message, remediation, artifact.version);
            let allversions = JSON.parse(message.allversions);
            
            showAllVersionsPopup(allversions, remediation, artifact.version);
            break;
        
    }
});

//var settings;
//var componentInfoData;
$(function () {
    //whenever I open I begin an evaluation immediately
    //the icon is disabled for pages that I dont parse
    console.log( "ready!" );
    //can only be done once per session
    //opens a message channel
    vscode = acquireVsCodeApi();
    //setupAccordion();
    showLoader();
    $('#error').hide();

    let tabOptions = {
        beforeActivate: selectHandler
    }
    $('#tabs').tabs(tabOptions);
    hasLoadedHistory = false
    $("div#dialog").dialog ({
        show : "slide",
        hide : "puff",        
        autoOpen : false,
        closeOnEscape: true,
        width: 425
      });
    


    //begin evaluation sends a message to the background script
    //amd to the content script
    //I may be able to cheat and just get the URL, which simplifies the logic
    //if the URL is not parseable then I will have to go the content script to read the DOM
    //beginEvaluation();
    hideLoader();
    
});



function showAllVersionsPopup(data, remediation, currentVersion){
    console.log('showAllVersionsPopup', data, remediation, currentVersion)
    createAllversionsHTML(data, remediation, currentVersion);
}
function showRemediationPopup(respData){
    console.log('showRemediationPopup', respData);
     
    let newVersion
    let advice
    if (respData.remediation.versionChanges.length > 0){
        newVersion = respData.remediation.versionChanges[0].data.component.componentIdentifier.coordinates.version;
        console.log('newVersion', newVersion);
        advice = `<span id="remediation">Remediation advice Upgrade to the new version:<strong> ${newVersion}</strong></span>`
    }else{
        advice = `<span id="remediation">No Remediation advice</span>`
    }
    $("#remediation").html(advice); 
    return newVersion;
}
function beginEvaluation(nexusArtifact){
    console.log('beginEvaluation', nexusArtifact);
    //need to run query across the tabs
    //to determine the top tab.
    //I need to call sendMessage from within there as it is async
    //this needs to be notified of the artifact that it gets from the 
    //treeview
    //hard coding for testing purposes
    

    // let thisartifact =  document.getElementById('component').value;
    // console.log('thisartifact', thisartifact);
    
    // artifact = {
    //     format: 'npm', 
    //     packageName: thisartifact.name, 
    //     version: thisartifact.version,
    //     datasource: 'NEXUSIQ'
    //   };
    // thisSettings = JSON.parse(document.getElementById('settings').value);
    // let promise =  await GetSettings(['url', 'username', 'password', 'appId', 'appInternalId'])
    // console.log('promise', promise)
    // settings = BuildSettings(promise.url, promise.username, promise.password, promise.appId, promise.appInternalId)   
    // // let respMessage = syncCallIQ(artifact, settings);
    // // let respMessage = callIQ(artifact, settings);
    let respMessage = TransformArtifact(nexusArtifact);
    gotMessage(respMessage);
    hideLoader();
    
}
function TransformArtifact(nexusArtifact){
    console.log('TransformArtifact', nexusArtifact);
    let retVal = {
            "error":0,
            "response":{
                "componentDetails":[nexusArtifact]                    
                }            
        ,
        "artifact":{
            "format":"npm",
            "packageName": nexusArtifact.component.componentIdentifier.coordinates.packageId,
            "version": nexusArtifact.component.componentIdentifier.coordinates.version,
            "datasource":"NEXUSIQ",
            "hash": nexusArtifact.component.hash
        }
    }
    let respMessage = {
        messagetype: messageTypes.displayMessage,
        message: retVal,
        artifact: artifact
    }
    console.log('respMessage', respMessage);
    return respMessage;
}
function mockResponse(artifact){
    let retVal = {
            "error":0,
            "response":{
                "componentDetails":[
                    {"component":{
                        "hash":"9c056579af0bdbb4322e",
                        "componentIdentifier":{
                            "format":"npm",
                            "coordinates":{
                                "packageId":"lodash",
                                "version":"4.17.9"
                            }
                        }
                    },
                    "matchState":"exact",
                    "catalogDate":"2018-04-24T17:44:40.268Z",
                    "relativePopularity":null,
                    "licenseData":{
                        "declaredLicenses":[{
                            "licenseId":"MIT",
                            "licenseName":"MIT"
                        }],
                        "observedLicenses":[{
                            "licenseId":"Not-Supported",
                            "licenseName":"Not Supported"
                        }]
                    },
                    "securityData":{
                        "securityIssues":[{
                            "source":"cve",
                            "reference":"CVE-2018-16487",
                            "severity":9.8,
                            "url":"http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-16487",
                            "threatCategory":"critical"
                        },
                        {
                            "source":"sonatype",
                            "reference":"sonatype-2017-0580",
                            "severity":6.5,
                            "url":null,
                            "threatCategory":"severe"
                        }]
                    }
                }]
            }
        ,
        "artifact":{
            "format":"npm",
            "packageName":"lodash",
            "version":"4.17.9",
            "datasource":"NEXUSIQ",
            "hash":"9c056579af0bdbb4322e"
        }
    }
    let respMessage = {
        messagetype: messageTypes.displayMessage,
        message: retVal,
        artifact: artifact
    }
    return respMessage;
}

function gotMessage(respMessage, sender, sendResponse){
    console.log('gotMessage-respMessage', respMessage)
    // const respMessage = JSON.parse(message)
    // const respMessage = message
    //this is the callback handler for a message received    
    let hasError = false;
    // ?let promise =  await GetSettings(['url', 'username', 'password', 'appId', 'appInternalId'])
    // settings = BuildSettings(promise.url, promise.username, promise.password, promise.appId, promise.appInternalId)
    // console.log('settings', settings)

    switch(respMessage.messagetype){
        case messageTypes.displayMessage:    
            // alert("displayMessage");
            if (respMessage.message.error){
                showError(respMessage.message.response);
            }else{
                // console.log('coming in here really late.-respMessage', respMessage);
                //need to set the artifact
                artifact = respMessage.artifact;
                // console.log('after content parsed artifact', artifact);
 
                var componentDetails = respMessage.message.response;
                // console.log('componentDetails', componentDetails);
    
                if (artifact.datasource === dataSources.NEXUSIQ){
                    nexusArtifact = componentDetails.componentDetails[0];
                    // console.log('nexusArtifact', nexusArtifact);
                }
                let htmlCreated =  createHTML(respMessage, settings);

            }            
            hideLoader(hasError);
            break;
        case messageTypes.loggedIn:
            
            //logged in so now we evaluate
            console.log('logged in, now evaluate');
            let evalBegan = beginEvaluation();
            hideLoader(hasError);
            break;
        case messageTypes.loginFailedMessage:
            hasError = true;
            //display error
            console.log('display error', respMessage);
            let errorShown = showError(respMessage.message.response);
            hideLoader(hasError);
            break;
        default:
            //do nothing for now    
    }
}

function createAllversionsHTML(data, remediation, currentVersion){
    console.log('createAllversionsHTML', data, remediation, currentVersion);

    // set:
    // <VersionGraph versionData={data} />
    // to #versionGraph
    //$("#versionGraph").html("<VersionGraph versionData={data} />");
}


function createAllversionsHTMLJQuery(data, remediation, currentVersion){
    console.log('createAllversionsHTMLJQuery', data, remediation, currentVersion);
    let strData = ""
    var grid;

    var options = {
        enableColumnReorder: false,
        autoHeight: false,
        enableCellNavigation: false,
        cellHighlightCssClass: "changed",
        cellFlashingCssClass: "remediation-version"
    };
    
    var slickData = [];
   
    var columns = [
        {id: 'version', name: 'version', field: 'version'},
        {id: 'security', name: 'security', field: 'security'},
        {id: 'license', name: 'license', field: 'license'},
        {id: 'popularity', name: 'popularity', field: 'popularity'},
        {id: 'catalogDate', name: 'catalogDate', field: 'catalogDate'},        
        {id: 'majorRevisionStep', name: 'majorRevisionStep', field: 'majorRevisionStep'}
        

    ];
    var colId = 0;
    let rowId = 0;
    let remediationRow = -1;
    let currentVersionRow = -1;
    //let sortedData = sortByProperty(data, 'componentIdentifier.coordinates.version', 'descending')
    data.forEach(element => {
        // console.log('element.componentIdentifier.coordinates.version', element.componentIdentifier.coordinates.version)
        let version = element.componentIdentifier.coordinates.version    
        if (remediation === version) {remediationRow = rowId}
        if (currentVersion === version) {currentVersionRow = rowId}
        let popularity = element.relativePopularity
        let license = (typeof element.policyMaxThreatLevelsByCategory.LICENSE === "undefined" ? 0 : element.policyMaxThreatLevelsByCategory.LICENSE )
        let myDate = new Date(element.catalogDate)
        let catalogDate = myDate.toLocaleDateString()
        let security = element.highestSecurityVulnerabilitySeverity
        let majorRevisionStep = element.majorRevisionStep
        strData += version + ", "
        slickData[rowId] = {
            version: version,
            security: security,
            license: license,
            popularity: popularity,
            catalogDate: catalogDate,
            majorRevisionStep: majorRevisionStep
        };
        // var d = (slickData[rowId] = {});
        // d["version"] = version
        // d["security"] = security
        // d["license"] =  license
        // d["popularity"] =  popularity        
        rowId++;
    });
    // console.log('strData', strData)
    // console.table(slickData)


    grid = new Slick.Grid("#myGrid", slickData, columns, options);
    if (remediationRow >=0){
        console.log('remediationRow', remediationRow)
        grid.scrollRowIntoView(remediationRow);
        grid.flashCell(remediationRow, grid.getColumnIndex("version"), 250);
    
        // $($('.grid-canvas').children()[remediationRow]).addClass('remediation-version');
        // $($('.grid-canvas').children()[remediationRow]).css("background-color", "lawngreen");

        paintRow (remediation, "lawngreen")
        paintRow (currentVersion, "#85B6D5")
    }else{
        grid.scrollRowIntoView(currentVersionRow);
    }

    grid.onViewportChanged.subscribe(function(e, args){
        //event handling code.
        //find the fix
        console.log('grid.onViewportChanged')
        paintRow (remediation, "lawngreen")        
        paintRow (currentVersion, "#85B6D5")
    });
    paintRow (currentVersion, "#85B6D5")
    // $("#remediation").html(strData);
    // $("#myGrid").css('color', 'white');
    
}
function paintRow (currentVersion, color){
    let currentVersionCell = $("div").filter(function() {
        // Matches exact string   
        return $(this).text() === currentVersion;
    });
    let currentVersionCellParent = $(currentVersionCell).parents('div .slick-row')
    // let currentVersionCellParent = $(currentVersionCell).parent;
    currentVersionCellParent.css("background-color", color)
}
function createHTML(message, settings)
{
    console.log('createHTML(message)', message, settings);

    // console.log(componentDetails.length)
    // const thisComponent = componentDetails["0"];
    // console.log('thisComponent')
    // console.log(thisComponent)
    switch (message.artifact.datasource){
        case dataSources.NEXUSIQ:
            var componentDetails = message.message.response;
            console.log('componentDetails', componentDetails);
                
            renderComponentData(message);
            renderLicenseData(message);
            hasVulns = renderSecurityData(message);
            //store nexusArtifact in Global variable
            // let remediation
            // if (hasVulns) {
            //     remediation = await showRemediation(nexusArtifact, settings)
            // }
            // let allVersions = await GetAllVersions(nexusArtifact, settings, remediation)

            break;
        case dataSources.OSSINDEX:
        //from OSSINdex
            console.log('OSSINDEX');            
            renderComponentDataOSSIndex(message);
            renderLicenseDataOSSIndex(message);
            renderSecurityDataOSSIndex(message);
            let advice = 'No remediation advice available'
            $("#remediation").html(advice); 
            break;
        default:
            //not handled
            console.log('unhandled case');
            console.log(message)
    }
};
function renderComponentDataOSSIndex(message){
    console.log('renderComponentData');
    console.log(message);
    $("#format").html(message.artifact.format);
    $("#package").html(unescape(message.artifact.name));
    $("#version").html(message.artifact.version);

    $("#hash").html(message.message.response.description);
    $("#hash_label").html('Description:');
    
    $("#matchstate").html(message.message.response.reference);
    $("#datasource").html(message.artifact.datasource);
    $("CatalogDate_row").addClass("invisible");
    $("RelativePopularity_Row").addClass("invisible");
    $("#catalogdate").html('-');
    $("#relativepopularity").html('-');

    renderSecuritySummaryOSSIndex(message);
    //document.getElementById("matchstate").innerHTML = componentInfoData.componentDetails["0"].matchState;
    // $("#matchstate").html(message.message.response.reference)
}
function renderLicenseDataOSSIndex(message){
    //not supported
    //$("#tabs-2").addClass("invisible");

    $("#declaredlicenses").html("<h3>OSSIndex does not carry license data</h3>")
    $("#licensetable").addClass("invisible");
}
function renderSecurityDataOSSIndex(message){
 
    let securityIssues = message.message.response.vulnerabilities;
    let strAccordion = '';
    console.log('renderSecurityDataOSSIndex')
    console.log(message)
    console.log(securityIssues.length);
    securityIssues.sort((securityIssues1, securityIssues2)=>{
        // console.log(securityIssues1.severity);
        return  securityIssues2.cvssScore - securityIssues1.cvssScore;
    });
    if(securityIssues.length > 0){
        for(var i=0; i < securityIssues.length; i++){
            let securityIssue = securityIssues[i];

            //console.log(securityIssue.reference);
            //console.log(i);
            let vulnerabilityCode = ''
            if(typeof securityIssue.cve === "undefined") {
                vulnerabilityCode = " No CVE ";
            }else{
                vulnerabilityCode = securityIssue.cve
            }
            let className = styleCVSS(securityIssue.cvssScore);
            // let vulnerabilityCode = (typeof securityIssue.cve === "undefined") ? 'No CVE' : securityIssue.cve;
            strAccordion += '<h3><span class="headingreference">' + vulnerabilityCode + '</span><span class="headingseverity ' + className +'">CVSS:' + securityIssue.cvssScore + '</span></h3>';
            // strAccordion += '<h3><span class="headingreference">' + vulnerabilityCode + '</span><span class="headingseverity ' + className +'">CVSS:' + securityIssue.cvssScore + '</span></h3>';
            strAccordion += '<div>';
            strAccordion += '<table class="optionstable">';            
            strAccordion += '<tr><td><span class="label">Title:</span></td><td><span class="data">' + securityIssue.title + '</span></td></tr>';
            strAccordion += '<tr><td><span class="label">Score:</span></td><td><span class="data">' + securityIssue.cvssScore + '</span></td></tr>';
            strAccordion += '<tr><td><span class="label">CVSS 3 Vector:</span></td><td><span class="data">' + securityIssue.cvssVector + '</span></td></tr>';
            strAccordion += '<tr><td><span class="label">Description:</span></td><td><span class="data">' + securityIssue.description + '</span></td></tr>';
            strAccordion += '<tr><td><span class="label">Id:</span></td><td><span class="data">' + securityIssue.id + '</span></td></tr>';
            strAccordion += '<tr><td><span class="label">Reference:</span></td><td><span class="data">' + securityIssue.reference + '</span></td></tr>';
            strAccordion += '</table>';
            strAccordion += '</div>';            
        }
        console.log(strAccordion);
        $("#accordion").html(strAccordion);
        //$('#accordion').accordion({heightStyle: 'content'});
        $('#accordion').accordion({heightStyle: 'panel'});
        // var autoHeight = $( "#accordion" ).accordion( "option", "autoHeight" );
        // $( "#accordion" ).accordion( "option", "autoHeight", false );
        // $("#accordion").accordion();
    }else{
        strAccordion += '<h3>No Security Issues Found</h3>';
        strAccordion += '<div>';
        strAccordion += '</div>';
        $("#accordion").html(strAccordion);
        //$('#accordion').accordion({heightStyle: 'content'});
        $('#accordion').accordion({heightStyle: 'panel'});

    }  

}
function renderComponentData(message){
    console.log('renderComponentData');
    console.log(message);
    var thisComponent = message.message.response.componentDetails["0"];
    let component = thisComponent.component;
    console.log("component");
    console.log(component);
    let format = component.componentIdentifier.format;
    $("#format").html(format);
    let coordinates = component.componentIdentifier.coordinates;
    console.log(coordinates);
    switch(format){
        case formats.npm:
            $("#package").html(coordinates.packageId);
            break
        case formats.maven:
            $("#package").html(coordinates.groupId + ':'+ coordinates.artifactId);
            break;
        case formats.gem:
            $("#package").html(coordinates.name);
            break;
        case formats.pypi:
            $("#package").html(coordinates.name);
            break;
        case formats.nuget:
            $("#package").html(coordinates.packageId);            
            break;
        default:
            $("#package").html('Unknown format');
            break
    };
    console.log(coordinates.version);
    $("#version").html(coordinates.version);
    artifact.hash = component.hash;
    $("#hash").html(component.hash);
    
    //document.getElementById("matchstate").innerHTML = componentInfoData.componentDetails["0"].matchState;
    $("#matchstate").html(thisComponent.matchState)
    $("#catalogdate").html(thisComponent.catalogDate);
    $("#relativepopularity").html(thisComponent.relativePopularity);
    $("#datasource").html(message.artifact.datasource);
    renderSecuritySummaryIQ(message);
}
function renderSecuritySummaryIQ(message){
    let highest = Highest_CVSS_Score(message);
    let className = styleCVSS(highest);
    $("#Highest_CVSS_Score").html(highest).addClass(className);

    let numIssues = Count_CVSS_Issues(message);
    let theCount = ` within ${numIssues} security issues`
    $("#Num_CVSS_Issues").html(theCount);

}
function renderSecuritySummaryOSSIndex(message){
    let highest = Highest_CVSS_ScoreOSSIndex(message);
    let className = styleCVSS(highest);
    $("#Highest_CVSS_Score").html(highest).addClass(className);

    let numIssues = Count_CVSS_IssuesOSSIndex(message);
    let theCount = ` within ${numIssues} security issues`
    $("#Num_CVSS_Issues").html(theCount);

}
function renderLicenseData(message){
    var thisComponent = message.message.response.componentDetails["0"];
    let licenseData = thisComponent.licenseData;
    if(licenseData.declaredLicenses.length > 0){
        if(licenseData.declaredLicenses["0"].licenseId ){
            //$("#declaredlicenses_licenseId").html(licenseData.declaredLicenses["0"].licenseId);
            //<a href="https://en.wikipedia.org/wiki/{{{licenseId}}}_License" target="_blank">https://en.wikipedia.org/wiki/{{{licenseId}}}_License</a>
            let link = "https://en.wikipedia.org/wiki/" + licenseData.declaredLicenses["0"].licenseId + "_License";
            console.log("link");
            console.log(link);
            console.log(licenseData.declaredLicenses["0"].licenseName);
            $("#declaredlicenses_licenseLink").attr("href", link);
            $("#declaredlicenses_licenseLink").html(licenseData.declaredLicenses["0"].licenseId);
            
        }
        //$("#declaredlicenses_licenseLink").html(licenseData.declaredLicenses["0"].licenseId);
        $("#declaredlicenses_licenseName").html(licenseData.declaredLicenses["0"].licenseName);
    }
    if(thisComponent.licenseData.observedLicenses.length > 0){
        $("#observedLicenses_licenseId").html(thisComponent.licenseData.observedLicenses["0"].licenseId);
        //document.getElementById("observedLicenses_licenseLink").innerHTML = componentInfoData.componentDetails["0"].licenseData.observedLicenses["0"].licenseName;
        $("#observedLicenses_licenseName").html(thisComponent.licenseData.observedLicenses["0"].licenseName);
    }
}
function Highest_CVSS_Score(message){
    console.log('Highest_CVSS_Score(beginning)', message);
    var thisComponent = message.message.response.componentDetails["0"];
 
    //document.getElementById("securityData_securityIssues").innerHTML = componentInfoData.componentDetails["0"].component.componentIdentifier.coordinates.securityData_securityIssues;
    let securityIssues = thisComponent.securityData.securityIssues;
    var highestSecurityIssue = Math.max.apply(Math, securityIssues.map(function(securityIssue) { return securityIssue.severity; }))
    console.log('highestSecurityIssue');
    console.log(highestSecurityIssue);
    
    if (typeof highestSecurityIssue === "undefined" || highestSecurityIssue == -Infinity){
        highestSecurityIssue = 'NA'
    }
    console.log('Highest_CVSS_Score(ending)', highestSecurityIssue);
    return highestSecurityIssue;
    
}
function Highest_CVSS_ScoreOSSIndex(message){
    console.log('Highest_CVSS_Score(beginning)', message);
    var thisComponent = message.message.response;
    
    //document.getElementById("securityData_securityIssues").innerHTML = componentInfoData.componentDetails["0"].component.componentIdentifier.coordinates.securityData_securityIssues;
    let securityIssues = thisComponent.vulnerabilities;
    var highestSecurityIssue = Math.max.apply(Math, securityIssues.map(function(securityIssue) { return securityIssue.cvssScore; }))
    console.log('highestSecurityIssue');
    console.log(highestSecurityIssue);
    
    if (typeof highestSecurityIssue === "undefined" || highestSecurityIssue == -Infinity){
        highestSecurityIssue = 'NA'
    }
    console.log('Highest_CVSS_Score(ending)', highestSecurityIssue);
    return highestSecurityIssue;
    
}
function Count_CVSS_IssuesOSSIndex(message){
    console.log('Count_CVSS_Issues(beginning)', message);
    var thisComponent = message.message.response;
 
    //document.getElementById("securityData_securityIssues").innerHTML = componentInfoData.componentDetails["0"].component.componentIdentifier.coordinates.securityData_securityIssues;
    let securityIssues = thisComponent.vulnerabilities;
    var countCVSSIssues = securityIssues.length;

    console.log('Count_CVSS_Issues(ending)', countCVSSIssues);
    return countCVSSIssues;
    
}
function Count_CVSS_Issues(message){
    console.log('Count_CVSS_Issues(beginning)', message);
    var thisComponent = message.message.response.componentDetails["0"];
 
    //document.getElementById("securityData_securityIssues").innerHTML = componentInfoData.componentDetails["0"].component.componentIdentifier.coordinates.securityData_securityIssues;
    let securityIssues = thisComponent.securityData.securityIssues;
    var countCVSSIssues = securityIssues.length;

    console.log('Count_CVSS_Issues(ending)', countCVSSIssues);
    return countCVSSIssues;
    
}
function styleCVSS(severity){
    let className;
    switch (true){
        case (severity >= 10):
            className = "criticalSeverity" 
            break;
        case (severity >= 7):
            className = "highSeverity" 
            break;
        case (severity >= 5):
            className = "mediumSeverity" 
            break;
        case (severity >= 0):
            className = "lowSeverity" 
            break;
        default:
            className = "noneSeverity" 
            break;
    }
    return className;
}
function renderSecurityData(message){
    let retVal = false;
    var thisComponent = message.message.response.componentDetails["0"];
 
    //document.getElementById("securityData_securityIssues").innerHTML = componentInfoData.componentDetails["0"].component.componentIdentifier.coordinates.securityData_securityIssues;
    let securityIssues = thisComponent.securityData.securityIssues;
    let strAccordion = "";
    console.log(securityIssues.length);
    securityIssues.sort((securityIssues1, securityIssues2)=>{
        // console.log(securityIssues1.severity);
        return  securityIssues2.severity - securityIssues1.severity;
    });
    if(securityIssues.length > 0){
        retVal = true;
        console.log(securityIssues);
        for(var i=0; i < securityIssues.length; i++){
            let securityIssue = securityIssues[i];
            console.log(securityIssue);

            //console.log(securityIssue.reference);
            //console.log(i);
            let className = styleCVSS(securityIssue.severity);
            let strVulnerability = securityIssue.reference;
            strAccordion += '<h3><span class="headingreference">' + strVulnerability + '</span><span class="headingseverity ' + className +'">CVSS:' + securityIssue.severity + '</span></h3>';
            strAccordion += '<div>';
            strAccordion += '<table>'
            strAccordion += '<tr>'
            
         
            let strDialog = `<div id="info_${strVulnerability}"><a href="#">${strVulnerability}<img  src="${resourceSrc}/icons8-info-filled-50.png" class="info" alt="Info"></a></div>`
            strAccordion += '<td class="label">Reference:</td><td class="data reference">' + strDialog + '</td>';
            strAccordion += '</tr><tr>'
            strAccordion += '<td class="label">Severity:</td><td class="data">' + securityIssue.severity + '</td>';
            strAccordion += '</tr><tr>'
            strAccordion += '<td class="label">Source:</td><td class="data">' + securityIssue.source + '</td>';
            strAccordion += '</tr><tr>'
            strAccordion += '<td class="label">Threat Category:</td><td class="data">' + securityIssue.threatCategory + '</td>';            
            strAccordion += '</tr><tr>'
            //strAccordion += '<p>url:</p><a href="' + securityIssue.url + '">' + securityIssue.url + '</a>';
            strAccordion += '<td class="label">url:</td><td class="data">' + securityIssue.url + '</td>';
            strAccordion += '</tr>'
            strAccordion += '</table>'
            strAccordion += '</div>';            
        }
        // console.log(strAccordion);
        $("#accordion").html(strAccordion);
        //$('#accordion').accordion({heightStyle: 'content'});
        $('#accordion').accordion({heightStyle: 'panel'});
        // var autoHeight = $( "#accordion" ).accordion( "option", "autoHeight" );
        // $( "#accordion" ).accordion( "option", "autoHeight", false );
        // $("#accordion").accordion();
        //add event listeners
        for(i=0; i < securityIssues.length; i++){
            let securityIssue = securityIssues[i];
            // console.log(securityIssue);

            //console.log(securityIssue.reference);
            //console.log(i);
            let strVulnerability = securityIssue.reference;
            var createButton = document.getElementById(`info_${strVulnerability}`);
            createButton.addEventListener('click', function() { showCVEDetail(strVulnerability); });
            console.log(createButton)
        }


    }else{
        strAccordion += '<h3>No Security Issues Found</h3>';
        $("#accordion").html(strAccordion);
        //$('#accordion').accordion({heightStyle: 'content'});
        $('#accordion').accordion({heightStyle: 'panel'});

    }  


    return retVal;
    //securityurl=<a href="{{{url}}}" target="_blank">url</a>    
}
function showLoader()
{
    $(".loader").fadeIn("slow");
}
function hideLoader(hasError)
{
    //$(".loader").fadeOut("slow");
    document.getElementById("loader").style.display = "none";
    document.getElementById("tabs").style.display = "block";
}


function syncCallIQ(artifact, settings){
    console.log("evaluate");
    console.log(settings.auth);
    console.log(artifact);
    var requestdata = NexusFormat(artifact);   
    let inputStr = JSON.stringify(requestdata);
    var retVal
    console.log(inputStr);
    var response

    let xhr = new XMLHttpRequest();
    let url = settings.url;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", settings.auth);
    xhr.withCredentials = true; 
    xhr.onload = function (e) {
        let error = 0;
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log('ok - xhr', xhr, xhr.responseText);
                error = 0
                // response = xhr.responseText
                response = JSON.parse(xhr.responseText);

            } else {
                console.log('xhr.status not 200', xhr);
                error = xhr.status;
                response = xhr.responseText;
                // response: "This REST API is meant for system to system integration and can't be accessed with a web browser."
                // responseText: "This REST API is meant for system to system integration and can't be accessed with a web browser."
            }
            retVal = {error: error, response: response};
            console.log(retVal);
            let displayMessage = {
                messagetype: messageTypes.displayMessage,
                message: retVal,
                artifact: artifact
            }
            return(displayMessage);
        }
    };
    xhr.onerror = function (e) {
        console.log('error', e, xhr);
        let response = {errorMessage: xhr.responseText};
        retVal = {error: xhr.status, response: response};
        let displayMessage = {
            messagetype: messageTypes.displayMessage,
            message: retVal,
            artifact: artifact
        }
        return(displayMessage);
    };
    console.log('about to send', inputStr );    
    xhr.send(inputStr );
    console.log('sent', xhr);
}
async function callIQ(artifact, settings){
    console.log("evaluate");
    console.log(settings.auth);
    console.log(artifact);
    var requestdata = NexusFormat(artifact);
    let inputStr = JSON.stringify(requestdata);
    
    
    let url = settings.url;
    console.log('inputStr', inputStr);
    console.log('url', url);
    console.log('settings', settings);
    let name = 'CLMSESSIONID'
    // document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    let response = await axios(url,
        {
            method: "post",
            data: inputStr,
            withCredentials: true,
            auth: {
                username: settings.username,
                password: settings.password
            }
        }        
    );

    console.log('response', response)
    let retVal = response.data;
    console.log('retVal', retVal )
    let displayMessage = {
        messagetype: messageTypes.displayMessage,
        message: retVal,
        artifact: artifact
    }
    console.log(displayMessage);
}


async function showCVEDetail(cveReference){
    showLoader();
    console.log('showCVEDetail', cveReference)
    console.log('artifact', artifact);
    let nexusArtifact = NexusFormat(artifact);
    console.log('nexusArtifact', nexusArtifact);
    console.log('settings', settings)
    // let myResp3 = await GetCVEDetails(cveReference, nexusArtifact, settings);
    let myResp3 = await GetCVEDetailsViaMessage(cveReference, nexusArtifact, settings);
    hideLoader();
    return;
    //we need to send a message a wait
    console.log('myResp3', myResp3)
    let htmlDetails = myResp3.cvedetail.data.htmlDetails
    
    $("#dialog").html(htmlDetails);  
    
    $('#dialog').dialog("open");
    $('#dialog').dialog("option", "maxHeight", 400);  
    
    
}

function showCVEPopup(myResp3){
    
    //we need to send a message a wait
    //console.log('myResp3', myResp3)
    let htmlDetails = myResp3.htmlDetails;
    console.log('htmlDetails', htmlDetails);
    $("#dialog").html(htmlDetails);  
    
    $('#dialog').dialog("open");
    $('#dialog').dialog("option", "maxHeight", 400);  
}

async function showRemediationViaMessage(nexusArtifact){
    console.log('begin showRemediationViaMessage', nexusArtifact);
    vscode.postMessage({
        command: 'GetRemediation',        
        'nexusArtifact': nexusArtifact
    })
    //return {cvedetail: retVal};
}


async function showRemediation(nexusArtifact, settings){
    console.log('showRemediation', nexusArtifact, settings)
    console.log('settings', settings)
    ///api/v2/components/remediation/application/{applicationInternalId}
    let servername = settings.baseURL;
    let url = `${servername}api/v2/components/remediation/application/${settings.appInternalId}`
    //CAMERON 28/05/19 - no support for Chrome in VSCode
    // chrome.cookies.remove({url: settings.baseURL, name: "CLMSESSIONID"});  
    let response = await axios(url,
        {
            method: "post",
            data: nexusArtifact.component,
            withCredentials: true,
            auth: {
                username: settings.username,
                password: settings.password
            }
        }        
    );
    let respData = response.data;
    showRemediationPopup(respData);
    
    
}
async function GetSettings(keys){
    
    console.log('GetSettings', keys, thisSettings)
    let settings = thisSettings;  
    console.log(settings);  
    let promise = new Promise((resolve, reject) => {
        let items = {
            'username': thisSettings.iqUser,
            'password': thisSettings.iqPassword,
            'url': thisSettings.iqUrl,
            'appId': thisSettings.iqApplicationPublicId,
            'appInternalId': thisSettings.iqApplicationId  
        };
        console.log('items', items);
        resolve(items);
    });    
    return promise;
}

async function GetAllVersions(nexusArtifact, settings, remediation){
    console.log('GetAllVersions', nexusArtifact);
    let retVal
    // let promise =  await GetSettings(['url', 'username', 'password', 'appId'])
    // let settings = BuildSettings(promise.url, promise.username, promise.password, promise.appId)

    // let comp = "%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22commons-collections%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22commons-collections%22%2C%22version%22%3A%223.2.1%22%7D%7D"
    let comp = encodeURI(JSON.stringify(nexusArtifact.component.componentIdentifier));
    // console.log('nexusArtifact', nexusArtifact);
    console.log('comp', comp);
    // let timestamp = "1554129430974"
    var d = new Date();
    var timestamp = d.getDate();
    
    // let hash = "761ea405b9b37ced573d"
    let hash = nexusArtifact.component.hash;
    let matchstate = "exact"
    // let report = "2d9054219bd549db8700d3bfd027d7fd"
    //let settings = BuildSettings("http://iq-server:8070/", "admin", "admin123")
    let servername = settings.baseURL;
    // let url = `${servername}rest/ci/componentDetails/application/${appId}/allVersions?componentIdentifier=${comp}&hash=${hash}&matchState=${matchstate}&reportId=${report}&timestamp=${timestamp}`
    let url = `${servername}rest/ide/componentDetails/application/${settings.appId}/allVersions?componentIdentifier=${comp}&hash=${hash}&matchState=${matchstate}&timestamp=${timestamp}&proprietary=false`
    // let url = `${servername}rest/ide/componentDetails/application/${appId}/allVersions?componentIdentifier=%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22commons-fileupload%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22commons-fileupload%22%2C%22version%22%3A%221.3.1%22%7D%7D&hash=c621b54583719ac03104&matchState=exact&proprietary=false HTTP/1.1`
    let response = await axios.get(url, {
        auth: {
            username: settings.username,
            password: settings.password
        }
    });
    let data = response.data;
    
    let currentVersion = nexusArtifact.component.componentIdentifier.coordinates.version;
    createAllversionsHTML(data, remediation, currentVersion);
    
}
async function GetAllVersionsViaMessage(nexusArtifact){
    console.log('begin GetAllVersionsViaMessage', nexusArtifact);
    vscode.postMessage({
        command: 'GetAllVersions',
        'nexusArtifact': nexusArtifact
    })
    //return {cvedetail: retVal};
}


async function GetCVEDetailsViaMessage(cve, nexusArtifact, settings){
    console.log('begin GetCVEDetailsViaMessage', cve, nexusArtifact, settings);
    vscode.postMessage({
        command: 'GetCVEDetails',
        'cve': cve,
        'nexusArtifact': nexusArtifact
    })
    //return {cvedetail: retVal};
}

async function GetCVEDetails(cve, nexusArtifact, settings){
    console.log('begin GetCVEDetails', cve, nexusArtifact, settings);
    // let url="http://iq-server:8070/rest/vulnerability/details/cve/CVE-2018-3721?componentIdentifier=%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22springfox-swagger-ui%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22io.springfox%22%2C%22version%22%3A%222.6.1%22%7D%7D&hash=4c854c86c91ab36c86fc&timestamp=1553676800618"
    let servername = settings.baseURL;// + (settings.baseURL[settings.baseURL.length-1]=='/' ? '' : '/') ;//'http://iq-server:8070'
    //let CVE = 'CVE-2018-3721'
    let timestamp = Date.now()
    let hash = nexusArtifact.components[0].hash;//'4c854c86c91ab36c86fc'
    // let componentIdentifier = '%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22springfox-swagger-ui%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22io.springfox%22%2C%22version%22%3A%222.6.1%22%7D%7D'
    let componentIdentifier = encodeComponentIdentifier(nexusArtifact)
    let vulnerability_source
    if (cve.search('sonatype')>=0){
        vulnerability_source = 'sonatype'
    }
    else{
        //CVE type
        vulnerability_source = 'cve'
    }
    //servername has a slash
    
    let url=`${servername}rest/vulnerability/details/${vulnerability_source}/${cve}?componentIdentifier=${componentIdentifier}&hash=${hash}&timestamp=${timestamp}`

    let data = await axios.get(url, {
        auth: {
            username: settings.username,
            password: settings.password
        }
    });
    console.log('data', data);
    let retVal
    retVal =  data;
    return {cvedetail: retVal};
    // var response = await fetch(url, {
    //     method: 'GET',
    //     headers: {"Authorization" : settings.auth}
    //     } );
    // var body = await response.json(); // .json() is asynchronous and therefore must be awaited
    // console.log(body);    
    
     
    // try
    // {
    //     let resp = await fetch(url, {
    //         method: 'GET',
    //         headers: {"Authorization" : settings.auth}
    //         })
    //         .then(response => {
    //             return response.json()
    //         })
    //         .then(data => {
    //             retVal =  data
    //             console.log('retVal', retVal)
    //         })
    //         .catch(function(err){
    //             console.log('Fetch Error:-S', err);
    //             throw err;
    //         });
    // }
    // catch(err){
    //     //an error was found
    //     //retval is null
    //     //not json
    //     retval = {error:500, message: "Error parsing json or calling service"}
    // }
    // return {cvedetail: retVal};
    // console.log('complete GetCVEDetails');
}
function showError(error)
{
    console.log('showError');
    console.log(error);
    let displayError;
    // $("#error").text(error);
    // $("#error").removeClass("hidden");
    //OSSINdex responds with HTML and not JSON if there is an error
    let errorText
    if (typeof error.statusText !== "undefined"){
        errorText = error.statusText;
    }
    if (errorText.search('<html>')>-1){
        if (typeof error.responseText !== "undefined"){
            let errorText = error.responseText;
            var el = document.createElement( 'html' );
            el.innerHTML = errorText;
    
            displayError = el.getElementsByTagName( 'title' ); // Live NodeList of your anchor elements
            }
        else{
            displayError = "Unknown error"
        }
    }else{
        displayError = errorText;
    }
    $("#error").html(displayError);
    $("#error").fadeIn("slow");
    $('#error').show();

}
function hideError()
{
    $("#error").fadeOut("slow");
    $('#error').hide();

}
function ChangeIconMessage(showVulnerable)  {
    if(showVulnerable) {
        // send message to background script
        chrome.runtime.sendMessage({ "messagetype" : "newIcon", "newIconPath" : "images/IQ_Vulnerable.png" });
    }
    else{
        // send message to background script
        chrome.runtime.sendMessage({ "messagetype" : "newIcon",  "newIconPath" : "images/IQ_Default.png"});    
    }
}
function setupAccordion(){
    console.log('setupAccordion');
    $('#accordion').find('.accordion-toggle').click(function(){
        //Expand or collapse this panel
        $(this).next().slideToggle('fast');
        //Hide the other panels
        $(".accordion-content").not($(this).next()).slideUp('fast');
    });
}
function sortByProperty(objArray, prop, direction){
    if (arguments.length<2) throw new Error("ARRAY, AND OBJECT PROPERTY MINIMUM ARGUMENTS, OPTIONAL DIRECTION");
    if (!Array.isArray(objArray)) throw new Error("FIRST ARGUMENT NOT AN ARRAY");
    const clone = objArray.slice(0);
    const direct = arguments.length>2 ? arguments[2] : 1; //Default to ascending
    const propPath = (prop.constructor===Array) ? prop : prop.split(".");
    clone.sort(function(a,b){
        for (let p in propPath){
                if (a[propPath[p]] && b[propPath[p]]){
                    a = a[propPath[p]];
                    b = b[propPath[p]];
                }
        }
        // convert numeric strings to integers
        a = a.match(/^\d+$/) ? +a : a;
        b = b.match(/^\d+$/) ? +b : b;
        return ( (a < b) ? -1*direct : ((a > b) ? 1*direct : 0) );
    });
    return clone;
};

