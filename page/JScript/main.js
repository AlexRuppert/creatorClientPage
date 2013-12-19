var PROTOCOL = "http";
var MODEL_SERVICE_ADDRESS = "localhost:9092";
var VISUALIZER_SERVICE_ADDRESS = "localhost:9091";
var MODEL_SERVICE_NAME = "i5.las2peer.services.iStarMLModelService.IStarMLModelService";
var VISUALIZER_SERVICE_NAME = "i5.las2peer.services.iStarMLVisualizerService.IStarMLVisualizerService";


var _GET = "get";
var _PUT = "put";
var _POST = "post";
var _DELETE = "DELETE";

$(document).ready(function () {
    initPaths();
});
/**
 * Constructs the base URL address (target to send the request to)
 * @param protocol http or https
 * @param address host and port of the target server
 * @param service service name of the LAS2peer service to use
 * @returns {string}
 */
function buildURLBase(protocol, address, service) {
    return protocol + "://" + address + "/" + service;
}
/**
 * Creates the base URL to access the Model Service
 * @returns {string}
 */
function buildModelURLBase() {
    return buildURLBase(PROTOCOL, MODEL_SERVICE_ADDRESS, MODEL_SERVICE_NAME);
}
/**
 * Creates the base URL to access the Visualizer Service
 * @returns {string}
 */
function buildVisualizerURLBase() {
    return buildURLBase(PROTOCOL, VISUALIZER_SERVICE_ADDRESS, VISUALIZER_SERVICE_NAME);
}
var visURL = "";
var modelURL = "";

var authData;
/**
 * Sets the local login data that is sent to the server with each request
 * Checks if the login data is valid by sending a simple test request
 * @param name
 * @param pass
 */
function login(name, pass) {
    //alert(name+" "+pass);
    authData = B64.encode(name + ":" + pass);

    checkLogin(modelURL, function () {
        /*checkLogin(visURL,function(){
         //alert("ok");
         });*/
        alert("Successfully logged in!");
    });


}
/**
 * Sends a simple request to the server to test, if the login data provided is valid
 * @param url
 * @param callback
 */
function checkLogin(url, callback) {
    $.ajax({
        url: url,
        dataType: "text",
        type: _GET,
        crossDomain: true,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authentication", "Basic " + authData);
        },
        complete: function (xhr, status) {
            if (xhr.status == 401) {
                alert("Not authorized for " + url);
            }
            else if (xhr.status == 200) {

                if (callback && typeof(callback) === "function") {
                    callback();
                }
            }
            else {
                alert("Internal error for " + url);
            }
        }
    });

}


/**
 * Sends a request to the server and invokes a callback method with the server response as a parameter
 * @param baseURL address of server and LAS2peer service
 * @param method HTTP method
 * @param URI URI request String
 * @param content HTTP body content, if POST request
 * @param callback method to invoke with the received response data
 */
function sendRequest(baseURL, method, URI, content, callback) {
    $.ajax({
        url: encodeURI(baseURL + "/" + URI),
        dataType: "text",
        type: method.toLowerCase(),
        data: content,
        contentType: "text/plain; charset=UTF-8",
        crossDomain: true,
        headers: {"Authentication": "Basic " + authData},
        complete: function (xhr, status) {
            if (xhr.status == 401) {
                alert("Not authorized for " + url);
            }
            else if (xhr.status != 200) {
                alert(xhr.status + " : Internal error for " + encodeURI(baseURL + "/" + URI));
            }
        }

    }).done(function (data) {

            if (data && data.indexOf("Error") == 0)//Display Errors
            {
                alert(data);
            }
            if (callback && typeof(callback) === "function") {
                callback(data);
            }
        });
}
/**
 * Sends a request to the Model Service
 * @param method HTTP method
 * @param URI
 * @param content if POST the content of the HTTP body
 * @param callback
 */
function sendModelRequest(method, URI, content, callback) {
    sendRequest(modelURL, method, URI, content, callback);
}
/**
 * Sends a request to the Visualizer Service
 * @param method HTTP method
 * @param URI
 * @param content if POST the content of the HTTP body
 * @param callback
 */
function sendVisualizerRequest(method, URI, content, callback) {
    sendRequest(visURL, method, URI, content, callback);
}
var contentAreaCounter = 0;
/**
 * Registers events for the elements of the user interface
 */
function registerEvents() {
    $('#requests').focus();

    $('#addContentButton').click(function () {//create a new content text box
        contentAreaCounter++;
        var e = $(document.createElement('div'));
        e.addClass("modelItem collection");
        e.html("<div>Content " + contentAreaCounter + "</div> <textarea name='Text1' cols='100' rows='10' class='contentText'></textarea>");
        $('#contents').append(e);

    });


    $('#sendButton').click(function () { //send all typed in requests


        var contents = [];
        var requests = [];
        requests = $('#requests').val().split('\n');

        var selector = $('#contents .contentText');
        selector.each(function (index) {
            var elem = $(this);
            contents.push(elem.val());
        });
        sendRequests(requests, contents);
    });
}
/**
 * Sends all typed in requests synchroniously to the Model Service
 * @param requests array of request strings
 * @param contents array of Strings to send as HTTP bodies
 */
function sendRequests(requests, contents) {

    (function () {
        var index = 0;
        var postCounter = 0;

        function sendNewRequest() {
            if (index < requests.length) {

                var request = requests[index].trim();
                var firstSpace = request.indexOf(" ");
                var method = request.substr(0, firstSpace).trim().toLowerCase();
                var URI = request.substr(firstSpace).trim();


                var content = "";
                if (method == 'post') {
                    content = contents[postCounter++];
                }
                sendModelRequest(method, URI, content, function (data) {
                    var out;
                    out = "\nRequest\n" + method + " " + URI + "\n" + data + "\n" + "  ______________________________________  ";
                    console.log(out);


                    $('#output').val($('#output').val() + out);
                    var psconsole = $('#output');
                    psconsole.scrollTop(
                        psconsole[0].scrollHeight - psconsole.height()
                    );

                    ++index;
                    sendNewRequest();
                });
            }
        }

        sendNewRequest();

    })();


}
/**
 * Read config file and use protocol, host, port and service names defined in there
 */
function initPaths() {
    $('#config').load("pathConfig.xml", "", function () {

        var model = $('#config').find('model')[0];
        var visualizer = $('#config').find('visualizer')[0];
        var protocol = $('#config').find('protocol')[0];

        MODEL_SERVICE_ADDRESS = $(model).attr('path');
        VISUALIZER_SERVICE_ADDRESS = $(visualizer).attr('path');
        MODEL_SERVICE_NAME = $(model).attr('name');
        VISUALIZER_SERVICE_NAME = $(visualizer).attr('name');
        PROTOCOL = $(protocol).attr('name');
        init();


    });
}
/**
 * prepare login, register events
 */
function init() {

    visURL = buildVisualizerURLBase();
    modelURL = buildModelURLBase();
    $('#loginName').val('User A');
    $('#loginPassword').val('userAPass');
    $('#loginButton').click(function () {
        login($('#loginName').val(), $('#loginPassword').val())
    });
    //login("User A","userAPass")

    registerEvents();
}