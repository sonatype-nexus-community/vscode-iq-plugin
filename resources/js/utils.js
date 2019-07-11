console.log("utils.js");

var formats = {
  npm: "npm"
};

const dataSources = {
  NEXUSIQ: "NEXUSIQ",
  OSSINDEX: "OSSINDEX"
};

var messageTypes = {
  login: "login", //message to send that we are in the process of logging in
  evaluate: "evaluate", //message to send that we are evaluating
  loggedIn: "loggedIn", //message to send that we are in the loggedin
  displayMessage: "displayMessage", //message to send that we have data from REST and wish to display it
  loginFailedMessage: "loginFailedMessage", //message to send that login failed
  beginevaluate: "beginevaluate", //message to send that we are beginning the evaluation process, it's different to the evaluatew message for a readon that TODO I fgogot
  artifact: "artifact" //passing a artifact/package identifier from content to the background to kick off the eval
};

function checkPageIsHandled(url) {
  console.log("checkPageIsHandled");
  console.log(url);
  //check the url of the tab is in this collection
  // let url = tab.url
  let found = false;
  if (
    url.search("https://search.maven.org/") >= 0 ||
    url.search("https://mvnrepository.com/") >= 0 ||
    url.search("https://www.npmjs.com/") >= 0 ||
    url.search("https://www.nuget.org/") >= 0 ||
    url.search("https://rubygems.org/") >= 0 ||
    url.search("https://pypi.org/") >= 0 ||
    url.search("https://packagist.org/") >= 0 ||
    url.search("https://cran.r-project.org/") >= 0 ||
    url.search("https://crates.io/") >= 0 ||
    url.search("https://search.gocenter.io/") >= 0 ||
    url.search("https://github.com/") >= 0 //https://github.com/jquery/jquery/releases/tag/3.0.0
  ) {
    found = true;
  }
  return found;
}

function ParsePageURL(url) {
  //artifact varies depending on eco-system
  //returns an artifact if URL contains the version
  //if not a version specific URL then returns a falsy value
  console.log("ParsePageURL");
  //who I am what is my address?
  let artifact;
  let format;
  console.log(url);

  if (url.search("www.npmjs.com/package/") >= 0) {
    //'https://www.npmjs.com/package/lodash'};
    format = formats.npm;
    artifact = parseNPMURL(url);
  }

  console.log("ParsePageURL Complete");
  console.log(artifact);
  //now we write this to background as
  //we pass variables through background
  return artifact;
}

function BuildEmptySettings() {
  let settings = {
    username: "",
    password: "",
    tok: "",
    hash: "",
    auth: "",
    restEndPoint: "",
    baseURL: "",
    url: "",
    loginEndPoint: "",
    loginurl: ""
  };
  return settings;
}

function NexusFormat(artifact) {
  let format = artifact.format;
  switch (format) {
    case formats.npm:
      requestdata = NexusFormatNPM(artifact);
      break;
    default:
      return;
      break;
  }
  return requestdata;
}

function NexusFormatNPM(artifact) {
  //return a dictionary in Nexus Format
  //return dictionary of components
  componentDict = {
    components: [
      (component = {
        hash: artifact.hash,
        componentIdentifier: {
          format: artifact.format,
          coordinates: {
            packageId: artifact.packageName,
            version: artifact.version
          }
        }
      })
    ]
  };
  return componentDict;
}

function epochToJsDate(ts) {
  // ts = epoch timestamp
  // returns date obj
  return new Date(ts * 1000);
}

function jsDateToEpoch(d) {
  // d = javascript date obj
  // returns epoch timestamp
  console.log(d);
  if (!(d instanceof Date)) {
    throw new TypeError("Bad date passed in");
  } else {
    return (d.getTime() - d.getMilliseconds()) / 1000;
  }
}

function encodeComponentIdentifier(nexusArtifact) {
  let actual = encodeURIComponent(
    JSON.stringify(nexusArtifact.components[0].componentIdentifier)
  );
  console.log(actual);
  return actual;
}

function parseNPMURL(url) {
  //ADD SIMPLE CODE THAT Check THE URL
  //this is run outside of the content page
  //so can not see the dom
  //need to handle when the component has a slash in the name
  //https://www.npmjs.com/package/@angular/animation/v/4.0.0-beta.8
  let format = formats.npm;
  let datasource = dataSources.NEXUSIQ;

  let packageName;
  let version;
  let artifact = "";
  if (url.search("/v/") > 0) {
    //has version in URL
    var urlElements = url.split("/");
    if (urlElements.length >= 8) {
      packageName = urlElements[4] + "/" + urlElements[5];
      version = urlElements[7];
      // packageName = encodeURIComponent(packageName);
      // version = encodeURIComponent(version);
    } else {
      packageName = urlElements[4];
      version = urlElements[6];
      // packageName = encodeURIComponent(packageName);
      // version = encodeURIComponent(version);
    }
    artifact = {
      format: format,
      packageName: packageName,
      version: version,
      datasource: datasource
    };
  } else {
    artifact = "";
  }
  return artifact;
}

function BuildSettings(baseURL, username, password, appId, appInternalId) {
  //let settings = {};
  console.log(
    "BuildSettings",
    baseURL,
    username,
    password,
    appId,
    appInternalId
  );
  let tok = username + ":" + password;
  let hash = btoa(tok);
  let auth = "Basic " + hash;
  let restEndPoint = "api/v2/components/details";
  if (baseURL.substring(baseURL.length - 1) !== "/") {
    baseURL = baseURL + "/";
  }
  let url = baseURL + restEndPoint;
  //login end point
  let loginEndPoint = "rest/user/session";
  let loginurl = baseURL + loginEndPoint;

  //whenDone(settings);
  let settings = {
    username: username,
    password: password,
    tok: tok,
    hash: hash,
    auth: auth,
    restEndPoint: restEndPoint,
    baseURL: baseURL,
    url: url,
    loginEndPoint: loginEndPoint,
    loginurl: loginurl,
    appId: appId,
    appInternalId: appInternalId
  };
  return settings;
}

if (typeof module !== "undefined") {
  module.exports = {
    BuildEmptySettings: BuildEmptySettings,
    checkPageIsHandled: checkPageIsHandled,
    removeCookies: removeCookies,
    NexusFormatMaven: NexusFormatMaven,
    NexusFormatNPM: NexusFormatNPM,
    NexusFormatNuget: NexusFormatNuget,
    NexusFormatPyPI: NexusFormatPyPI,
    NexusFormatRuby: NexusFormatRuby,
    epochToJsDate: epochToJsDate,
    jsDateToEpoch: jsDateToEpoch,
    encodeComponentIdentifier: encodeComponentIdentifier,
    parseMavenURL: parseMavenURL,
    parseNPMURL: parseNPMURL,
    parseNugetURL: parseNugetURL,
    parsePyPIURL: parsePyPIURL,
    parseRubyURL: parseRubyURL,
    parsePackagistURL: parsePackagistURL,
    parseCocoaPodsURL: parseCocoaPodsURL,
    parseCRANURL: parseCRANURL,
    parseGoLangURL: parseGoLangURL,
    parseCratesURL: parseCratesURL,
    ParsePageURL: ParsePageURL
  };
}
