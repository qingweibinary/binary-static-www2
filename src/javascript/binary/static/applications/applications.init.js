var Applications = (function(){
    "use strict";
    
    var tableExist = function(){
        return document.getElementById("applications-table");
    };
    
    function responseHandler(response){
        if (response.hasOwnProperty('error') && response.error.message) {
          $("#applications-ws-container .error-msg").text(response.error.message);
          return;
        } else {

            var applications = response.oauth_apps;
          
            if (!tableExist()) {
                $("#loading").remove();
                // Show a message when the table is empty
                ApplicationsUI.createEmptyTable().appendTo("#applications-ws-container");
                var titleElement = document.getElementById("applications-title").firstElementChild;
                titleElement.textContent = text.localize(titleElement.textContent);
            }
            if (applications.length === 0) {
                  $('#applications-table tbody')
                      .append($('<tr/>', {class: "flex-tr"})
                          .append($('<td/>', {colspan: 6})
                              .append($('<p/>', {class: "notice-msg center", text: text.localize("You have not granted access to any apps.")})
                              )
                          )
                      );
            }
            ApplicationsUI.createTable(applications);
        }
    }
    
    function getNextBatch(){
        ApplicationsData.getApplications();
    }
    
    function initPage(){
        showLoadingImage($('<div/>', {id: 'loading'}).insertAfter('#applications-title'));
        getNextBatch();
    }
    
    function initTable(){
        $("#applications-ws-container .error-msg").text("");
        ApplicationsUI.clearTableContent();
    }

    function cleanPageState(){
        initTable();
    }

    return {
        init: initPage,
        responseHandler: responseHandler,
        clean: cleanPageState
    };
}());
