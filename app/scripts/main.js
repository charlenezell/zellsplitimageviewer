'use strict';
var g=0;
function newWindow(){
  var width = 500;
  var height = 300;
  chrome.app.window.create('index.html', {
    id: 'main'+(g++),
    bounds: {
      width: width,
      height: height,
      left: Math.round((screen.availWidth - width) / 2),
      top: Math.round((screen.availHeight - height)/2)
    }
  });
}
chrome.app.runtime.onLaunched.addListener(function() {
  newWindow();
});

chrome.commands.onCommand.addListener(function(command) {
   if (command == "newwindow") {
     newWindow()
   }
});
