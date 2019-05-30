console.log('contentscript.js');


chrome.runtime.onMessage.addListener(gotMessage);
var message
function gotMessage(receivedMessage, sender, sendResponse){
    console.log('gotMessage');
    console.log(receivedMessage);
    message = receivedMessage;
    processPage(message);
}

function processPage(message = {messagetype: messageTypes.beginevaluate}){
  console.log('processPage');
  console.log(message);

    //please tell what is my url and what is my content
    console.log("url");
    var url  = window.location.href;     
    console.log(url);
    //this page will hear the Evaluate message as well, so ignore it
    if (message.messagetype !== messageTypes.evaluate){
      let requestmessage = ParsePage()
      console.log('requestmessage');
      console.log(requestmessage);
      //{messageType: "artifact", payload: artifact};
      let artifact = requestmessage.payload;
      console.log('artifact');
      console.log(artifact);
      let format = artifact.format;
      let evaluatemessage = {
          artifact: artifact,        
          messagetype: messageTypes.evaluate
      }
      console.log('chrome.runtime.sendMessage(evaluatemessage)');
      console.log(evaluatemessage);
      
      chrome.runtime.sendMessage(evaluatemessage);
    }
}



function ParsePage(){
    //returns message in format like this {messageType: "artifact", payload: artifact};
    //artifact varies depending on eco-system
    console.log('ParsePage');
    //who I am what is my address?
    let artifact;
    let format;
    let datasource = dataSources.NEXUSIQ;;
    let url = location.href;
    console.log(url);

    if (url.search('www.npmjs.com/package/') >= 0){
      //'https://www.npmjs.com/package/lodash'};
      format = formats.npm;
      datasource = dataSources.NEXUSIQ;
      artifact = parseNPM(format, url);
    }
    
    artifact.datasource = datasource;
    console.log("ParsePage Complete");
    console.log(artifact);
    //now we write this to background as
    //we pass variables through background
    message = {
      messagetype: messageTypes.artifact,       
      payload: artifact
    };
    chrome.runtime.sendMessage(message, function(response){
        //sends a message to background handler
        //what should I do with the callback?
        console.log('chrome.runtime.sendMessage');
        console.log(response);
        console.log(message);
    });
    return message;
};





function parseNPM(format, url) {
  //ADD SIMPLE CODE THAT CHECLS THE URL?
  //note that this changed as of 19/03/19
  //version in URL
  //https://www.npmjs.com/package/lodash/v/4.17.9
  //No version in URL so read DOM
  //https://www.npmjs.com/package/lodash/
  var doc = $('html')[0].outerHTML
  var docelements = $(doc);

  var found
  let newV 
  let elements
  let packageName
  let version
  if (url.search('/v/') >0 ){
    //has version in URL
    var urlElements = url.split('/');
    packageName = urlElements[4]
    version = urlElements[6]

  }else{
    //try to parse the URL
    //Seems like node has changed their selector
    //var found = $('h1.package-name-redundant', doc);
    // found = $('h1.package-name-redundant', doc);
    found = $("h2 span")
    console.log(found);
    if (typeof found !== "undefined" && found !== ""){
      packageName = found.text().trim();        
      // let foundV = $("h2", doc);
      //https://www.npmjs.com/package/jest
      newV = $("h2").next("span")
      if (typeof newV !== "undefined" && newV !== ""){
        newV = newV.text()
        //produces "24.5.0 • "
        let findnbsp = newV.search(String.fromCharCode(160))
        if (findnbsp >=0){
          newV = newV.substring(0,findnbsp)
        }
        version = newV;
      }
      console.log("newV");
      console.log(newV);   

    }
  }
  //  
  //  packageName=url.substr(url.lastIndexOf('/')+1);
  packageName = encodeURIComponent(packageName);
  version = encodeURIComponent(version);
  
  return {format:format, packageName:packageName, version:version}
};
