(function() {
  'use strict';

  window.addEventListener('message', function(event) {
    if (!isValidOrigin(event.origin)) {
      return;
    }
    /*
    if (event.origin !== "https://mail.notes.ap.collabserv.com"){
      return;
    }
    */
    if(event.data) {
      if (event.data.verseApiType === 'com.ibm.verse.ping.application.loaded') {
        var loaded_message = {
          verseApiType: 'com.ibm.verse.application.loaded'
        };
        event.source.postMessage(loaded_message, event.origin);
      } else if (event.data.verseApiType === 'com.ibm.verse.action.clicked') {
        if(event.data.verseApiData.context) {
          var sender = event.data.verseApiData.context.sender;
          var externalCount = 0;
          // to
          var toNode = document.getElementById("to");
          var to = event.data.verseApiData.context.recipientTo;
          if (to.length > 0) {
            var i = 0;
            for (var value of to) {
              if (i > 0) {
//                var pNode = document.createElement("p");
//                toNode.appendChild(pNode);
              }
              
              // internal/external
              var senderEmailAddress = sender[0].emailAddress;
              var domain = senderEmailAddress.substr(senderEmailAddress.lastIndexOf("@") + 1);
              var externalFlag = "";
              var nameInput = document.createElement("input");
              var nameLabel = document.createElement("label");
              var nameSpan = document.createElement("span");
              if (value.emailAddress.slice(-(domain.length)) === domain) {
                externalFlag = false;
              } else {
                externalFlag = true;
                externalCount++;
                nameInput.setAttribute("type", "checkbox");
                nameInput.setAttribute("id", "cbToExternal_" + externalCount);
                nameInput.className = "checkbox-input";
                nameInput.name = "groupExternal";
                nameLabel.setAttribute("for", "cbToExternal_" + externalCount);
                nameSpan.className = "checkbox-span";
              }

              var emailAddress = value.emailAddress;
              if (emailAddress === "") {
                emailAddress = "No data";
                nameSpan.classList.add("errorSpan");
              }
              nameSpan.textContent = value.displayName + " <" + emailAddress + ">";

              if (externalFlag === false) {
                  nameLabel.className = "internalLabel";
                  nameLabel.appendChild(nameSpan);
              } else {
                  nameLabel.className = "externalLabel";
                  nameLabel.appendChild(nameInput);
                  nameLabel.appendChild(nameSpan);
              }
              var ctrlPostMessage = function(nm, event) {
                return function(evt) {
                  var response_message = {};
                  if (checkOn(nm)) {
                    response_message = {
                      verseApiType: 'com.ibm.verse.message.enable.send'
                    };
                  } else {
                    response_message = {
                      verseApiType: 'com.ibm.verse.message.disable.send'
                    };
                  }
                  event.source.postMessage(response_message, event.origin);
                }
              }
              nameLabel.addEventListener("change", ctrlPostMessage(nameInput.name, event), false);
              toNode.appendChild(nameLabel);
              i++;
            }
          }

          // cc
          var ccNode = document.getElementById("cc");
          var cc = event.data.verseApiData.context.recipientCC;
          if (cc.length > 0) {
            var j = 0;
            for (var value of cc) {
              if (j > 0) {
//                var pNode = document.createElement("p");
//                ccNode.appendChild(pNode);
              }
              
              // internal/external
              var senderEmailAddress = sender[0].emailAddress;
              var domain = senderEmailAddress.substr(senderEmailAddress.lastIndexOf("@") + 1);
              var externalFlag = "";
              var nameInput = document.createElement("input");
              var nameLabel = document.createElement("label");
              var nameSpan = document.createElement("span");
              if (value.emailAddress.slice(-(domain.length)) === domain) {
                externalFlag = false;
              } else {
                externalFlag = true;
                externalCount++;
                nameInput.setAttribute("type", "checkbox");
                nameInput.setAttribute("id", "cbCcExternal_" + externalCount);
                nameInput.className = "checkbox-input";
                nameInput.name = "groupExternal";
                nameLabel.setAttribute("for", "cbCcExternal_" + externalCount);
                nameSpan.className = "checkbox-span";
              }

              var emailAddress = value.emailAddress;
              if (emailAddress === "") {
                emailAddress = "No data";
                nameSpan.classList.add("errorSpan");
              }
              nameSpan.textContent = value.displayName + " <" + emailAddress + ">";

              if (externalFlag === false) {
                  nameLabel.className = "internalLabel";
                  nameLabel.appendChild(nameSpan);
              } else {
                  nameLabel.className = "externalLabel";
                  nameLabel.appendChild(nameInput);
                  nameLabel.appendChild(nameSpan);
              }
              var ctrlPostMessage = function(nm, event) {
                return function(evt) {
                  var response_message = {};
                  if (checkOn(nm)) {
                    response_message = {
                      verseApiType: 'com.ibm.verse.message.enable.send'
                    };
                  } else {
                    response_message = {
                      verseApiType: 'com.ibm.verse.message.disable.send'
                    };
                  }
                  event.source.postMessage(response_message, event.origin);
                }
              }
              nameLabel.addEventListener("change", ctrlPostMessage(nameInput.name, event), false);
              ccNode.appendChild(nameLabel);
              j++;
            }
          }

          // subject
      	  var subjectNode = document.getElementById("subject");
  	      subjectNode.innerText = event.data.verseApiData.context.subject;

          // json
//      	  var jsonNode = document.getElementById("json");
//  	      jsonNode.innerText = jsonNode.innerText + "\n" + JSON.stringify(event.data, null, 2);

          if (externalCount > 0) {
            var headerNode = document.getElementById("header");
            var hrTopNode = document.getElementById("hr-top");
            var infoNode = document.createElement("span");
            infoNode.className = "information";
            var infoNodeText = document.createTextNode("社外の送信先は確認後、チェックマークをを付けてください。");
            infoNode.appendChild(infoNodeText);
            headerNode.insertBefore(infoNode, hrTopNode);
          }

        } else {
          console.warn('No context data retrieved from Verse');
        }
      }
    } else {
      console.warn('No data retrieved from Verse');
    }
  }, false);

  function checkOn( groupName ) {
    var result = false;
    var groupCheckboxes = document.getElementsByName( groupName );
    var checkedCount = 0;
    var uncheckedCount = 0;
    for (var i = 0; i < groupCheckboxes.length; i++ ){
      if (groupCheckboxes[i].checked) {
        checkedCount++;
      } else {
        uncheckedCount++;
      }
    }
    if (uncheckedCount === 0) {
      result = true;
    }
    return result;
  }

  /** 
   * Verify we are listening to the right origin
   * @param {String} currentOrigin - The url which we should listen to
   * @return {Boolean} true if the origin is valid, false otherwise
   */
  function isValidOrigin(currentOrigin) {
    var originsList = [
      "https://mail.notes.na.collabserv.com",
      "https://mail.notes.ap.collabserv.com",
      "https://mail.notes.ce.collabserv.com"
    ];
    for (var i = 0; i < originsList.length; i++) {
      if (originsList[i].indexOf(currentOrigin) !== -1) {
        return true;
      }
    }
    return false;
  }
})();