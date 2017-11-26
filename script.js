(function() {
  'use strict';

  window.addEventListener('message', function(event) {
    if (!isValidOrigin(event.origin)) {
      return;
    }
    if(event.data) {
      if (event.data.verseApiType === 'com.ibm.verse.ping.application.loaded') {
        var loaded_message = {
          verseApiType: 'com.ibm.verse.application.loaded'
        };
        event.source.postMessage(loaded_message, event.origin);
      } else if (event.data.verseApiType === 'com.ibm.verse.action.clicked') {
        if(event.data.verseApiData.context) {
          var externalCount = 0;

          // To
          if (event.data.verseApiData.context.hasOwnProperty("recipientTo")) {
            if (event.data.verseApiData.context.recipientTo.length > 0) {
              externalCount = addNodeEmailAddress("To", event);
            }
          }

          // CC
          if (event.data.verseApiData.context.hasOwnProperty("recipientCC")) {
            if (event.data.verseApiData.context.recipientCC.length > 0) {
              externalCount = addNodeEmailAddress("CC", event);
            }
          }

          // Bcc
          if (event.data.verseApiData.context.hasOwnProperty("recipientBcc")) {
            if (event.data.verseApiData.context.recipientBcc.length > 0) {
              externalCount = addNodeEmailAddress("Bcc", event);
            }
          }

          // subject
      	  var subjectNode = document.getElementById("Subject");
  	      subjectNode.innerText = event.data.verseApiData.context.subject;

          // Attachments
          if (event.data.verseApiData.context.hasOwnProperty("attachments")) {
            if (event.data.verseApiData.context.attachments.length > 0) {
              externalCount = addNodeAttachments(event);
            }
          }

          // json
      	  var jsonNode = document.getElementById("json");
  	      jsonNode.innerText = jsonNode.innerText + "\n" + JSON.stringify(event.data, null, 2);

          if (externalCount > 0) {
            var headerNode = document.getElementById("header");
            var hrTopNode = document.getElementById("hr-top");
            var infoNode = document.createElement("span");
            infoNode.className = "information";
            var infoNodeText = document.createTextNode("[社外の送信先], [添付ファイル] を確認（クリック）してください。");
            infoNode.appendChild(infoNodeText);
            infoNode.id = "info";
            headerNode.insertBefore(infoNode, hrTopNode);
          } else {
            var response_message = {
              verseApiType: 'com.ibm.verse.message.enable.send'
            };
            event.source.postMessage(response_message, event.origin);
          }

        } else {
          console.warn('No context data retrieved from Verse');
        }
      }
    } else {
      console.warn('No data retrieved from Verse');
    }
  }, false);

  function addNodeEmailAddress(recipientType, event) {
    var sender = event.data.verseApiData.context.sender;
    var recipientNode = document.getElementById(recipientType);
    var recipientData = event.data.verseApiData.context["recipient" + recipientType];
    var externalCount = 0;
    for (var value of recipientData) {
      // internal/external
      var senderEmailAddress = sender[0].emailAddress;
      var domain = senderEmailAddress.substr(senderEmailAddress.lastIndexOf("@") + 1);
      var externalFlag = "";
      var nameInput = document.createElement("input");
      var nameLabel = document.createElement("label");
      var nameSpan = document.createElement("span");
      var deliveryDomain = value.emailAddress.substr(value.emailAddress.lastIndexOf("@") + 1);
      if (deliveryDomain === domain) {
        externalFlag = false;
      } else {
        externalFlag = true;
        externalCount++;
        nameInput.setAttribute("type", "checkbox");
        nameInput.setAttribute("id", recipientType + "_cbExternal_" + externalCount);
        nameInput.className = "checkbox-input";
        nameInput.name = "groupExternal";
        nameLabel.setAttribute("for", recipientType + "_cbExternal_" + externalCount);
        nameLabel.id = recipientType + "_nlExternal_" + externalCount;
        nameSpan.className = "checkbox-span";
      }
      
      var emailAddress = value.emailAddress;
      if (emailAddress === "") {
        emailAddress = "No data";
        nameSpan.classList.add("errorSpan");
      }
      if (value.displayName === emailAddress) {
        nameSpan.textContent = emailAddress;
      } else {
        nameSpan.textContent = value.displayName + " <" + emailAddress + ">";
      }
        
      if (externalFlag === false) {
        nameLabel.className = "internalLabel";
        nameLabel.appendChild(nameSpan);
      } else {
        nameLabel.className = "externalLabel";
        nameLabel.appendChild(nameInput);
        nameLabel.appendChild(nameSpan);
      }
      var ctrlPostMessage = function(labelId, nm, id, event) {
        return function(evt) {
          var label = document.getElementById(labelId);
          label.className = "externalLabel_confirmed";

          var checkbox = document.getElementById(id);
          if (checkbox.checked) {
            checkbox.disabled = true;
          }
        
          var response_message = {};
          if (checkOn(nm)) {
            response_message = {
              verseApiType: 'com.ibm.verse.message.enable.send'
            };
            var infoNode = document.getElementById("info");
            infoNode.textContent = "確認が完了しました。";
          } else {
            /*
            response_message = {
              verseApiType: 'com.ibm.verse.message.disable.send'
            };
            */
          }
          event.source.postMessage(response_message, event.origin);
        }
      }
      nameLabel.addEventListener("change", ctrlPostMessage(nameLabel.id, nameInput.name, nameInput.id, event), false);
      recipientNode.appendChild(nameLabel);
    }

    return externalCount;
  }

  function addNodeAttachments(event) {
    var recipientNode = document.getElementById("Attachments");
    var recipientData = event.data.verseApiData.context.attachments;
    var externalCount = 0;
    for (var value of recipientData) {
      // internal/external
      var externalFlag = "";
      var nameInput = document.createElement("input");
      var nameLabel = document.createElement("label");
      var nameSpan = document.createElement("span");

      externalFlag = true;
      externalCount++;
      nameInput.setAttribute("type", "checkbox");
      nameInput.setAttribute("id", "attchments_cbExternal_" + externalCount);
      nameInput.className = "checkbox-input";
      nameInput.name = "groupExternal";
      nameLabel.setAttribute("for", "attchments_cbExternal_" + externalCount);
      nameLabel.id = "attchments_nlExternal_" + externalCount;
      nameSpan.className = "checkbox-span";

      var sizeString = 0;
      if (value.size >= 1048576) {
        sizeString = Math.ceil(value.size / 1048576) + " MB"
      } else if (value.size >= 1024 && value.size < 1048576) {
        sizeString = Math.ceil(value.size / 1024) + " KB"
      } else {
        sizeString = value.size + " byte"
      }
      nameSpan.textContent = value.name + " [" + sizeString + "]";
        
      nameLabel.className = "externalLabel";
      nameLabel.appendChild(nameInput);
      nameLabel.appendChild(nameSpan);

      var ctrlPostMessage = function(labelId, nm, id, event) {
        return function(evt) {
          var label = document.getElementById(labelId);
          label.className = "externalLabel_confirmed";

          var checkbox = document.getElementById(id);
          if (checkbox.checked) {
            checkbox.disabled = true;
          }
        
          var response_message = {};
          if (checkOn(nm)) {
            response_message = {
              verseApiType: 'com.ibm.verse.message.enable.send'
            };
            var infoNode = document.getElementById("info");
            infoNode.textContent = "確認が完了しました。";
          } else {
            /*
            response_message = {
              verseApiType: 'com.ibm.verse.message.disable.send'
            };
            */
          }
          event.source.postMessage(response_message, event.origin);
        }
      }
      nameLabel.addEventListener("change", ctrlPostMessage(nameLabel.id, nameInput.name, nameInput.id, event), false);
      recipientNode.appendChild(nameLabel);
    }

    return externalCount;
  }

  function checkOn(groupName) {
    var result = false;
    var groupCheckboxes = document.getElementsByName(groupName);
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