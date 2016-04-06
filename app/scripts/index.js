'use strict';

var getBlobURL = (window.URL && URL.createObjectURL.bind(URL)) ||
  (window.webkitURL && webkitURL.createObjectURL.bind(webkitURL)) ||
  window.createObjectURL;
var revokeBlobURL = (window.URL && URL.revokeObjectURL.bind(URL)) ||
  (window.webkitURL && webkitURL.revokeObjectURL.bind(webkitURL)) ||
  window.revokeObjectURL;


function initDropArea(droptarget) {
  var mainArea = document.querySelector(".mainArea")
  mainArea.ondragenter = function(e) {
    console.log("mainAreaenter")
    mainArea.classList.add("dragenter");
  }
  droptarget.ondragenter = function(e) {
    console.log("tenter")
    var types = e.dataTransfer.types;
    if (!types ||
      (types.contains && types.contains("Files")) ||
      (types.indexOf && types.indexOf("Files") != -1)) {}
  };
  droptarget.ondragleave = function(e) {
    mainArea.classList.remove("dragenter"); // Unhighlight droptarget
  };
  droptarget.ondrop = function(e) {
    var files = e.dataTransfer.files; // The dropped files
    for (var i = 0; i < files.length; i++) { // Loop through them all
      var type = files[i].type;
      if (type.substring(0, 6) !== "image/") // Skip any nonimages
        continue;
      imageListManager.add(getBlobURL(files[i]));
    }
    mainArea.classList.remove("dragenter"); // Unhighlight droptarget
    imageListManager.dom.style.display = "flex";
    imageListManager.render();
  }
}

var imageListManager = {
  zoomTo:function(ctx,percentage){
    var img = $("img", ctx);
    img.width(img.width()*percentage);
  },
  zoomin: function(ctx) {
    var img = $("img", ctx);
    img.width(img.width() + 10);
  },
  zoomout: function(ctx) {
    var img = $("img", ctx);
    img.width(img.width() - 10);
  },
  dom: document.querySelector(".imageView"),
  list: [],
  init: function() {
    var that = this;
     var left = $(".leftImg", that.dom);
      var right = $(".rightImg", that.dom);
      var parent=$(that.dom);
    $(".seperator", that.dom).on("mousedown", function(e) {
      if (that.ctrldown) {
        that.doingSeperator = true;
        that.screenX = e.screenX;
        that.leftWidth=left.width();
      }
    });
    $(that.dom).on("mousemove", function(e) {
      if (that.ctrldown && that.doingSeperator) {
        var delta = that.screenX - e.screenX;
        left.width(that.leftWidth - delta);
        right.width(parent.width()-5-(that.leftWidth - delta));
      }
    }).
    on("mouseup", function(e) {
      that.doingSeperator = false;
      var w=left.width();
      var w2=right.width();
      that.splitPos=[w,w2];
    });
    $(window).on("keydown", function() {
      if (arguments[0].keyCode == 17) {
        that.ctrldown = true;
      }
    }).on("keyup", function() {
      that.ctrldown = false;
    }).on("resize", function() {
      var t=that.splitPos[0]+that.splitPos[1];
      that.render({
        zoomPercentage:($(that.dom).width()-5)*that.splitPos[0]/t/(left.width()),
        leftPercentage:that.splitPos[0]/t,
        rightPercentage:that.splitPos[1]/t
      });
    });
    $(this.dom).on("wheel", ".leftImg,.rightImg", function() {
      if (that.ctrldown) {
        if (window.event.wheelDeltaY > 0) {
          that.zoomin($(this))
        } else {
          that.zoomout($(this))
        }
      }
    }).on("mousedown", ".leftImg,.rightImg", function(e) {
      if (that.ctrldown) {
        that.doingMargin = true;
        that.cur_marginLeft = parseFloat($("img", this).css("marginLeft"));
        that.screenX = e.screenX;
      }
    }).on("mousemove", ".leftImg,.rightImg", function(e) {
      if (that.ctrldown && that.doingMargin) {
        var delta = that.screenX - e.screenX;
        $("img", this).css("marginLeft", that.cur_marginLeft - delta);
      }
    }).on("mouseup", ".leftImg,.rightImg", function() {
      that.doingMargin = false;
      that.position=[parseFloat($("img",left).css("marginLeft")),parseFloat($("img",right).css("marginLeft"))];
    });
  },
  add: function(url) {
    var img = document.createElement("img"); // Create an <img> element
    img.src = url // Use Blob URL with <img>
    img.onload = function() { // When it loads
      revokeBlobURL(this.src); // But don't leak memory!
    }
    imageListManager.list.unshift(img);
  },
  render: function(option) {
    var that=this;
    var c = 0;
    var left = $(".leftImg", this.dom);
    var right = $(".rightImg", this.dom);
    if (this.list[0]) {
      left.empty().append(this.list[0]);
      c++;
    }
    if (this.list[1]) {
      right.empty().append(this.list[1]);
      c++;
    }
    var g = $(".imageView").width();
    if (c >= 2) {
      if(option){
        var l=(g-5)*option.leftPercentage;
        var r=(g-5)*option.rightPercentagePercentage;
        var ml=that.position[0]*option.zoomPercentage;
        var mr=that.position[1]*option.zoomPercentage;
        left.width(l);
        right.width(r);
        that.zoomTo(left,option.zoomPercentage);
        that.zoomTo(right,option.zoomPercentage);
        $("img",left).css("marginLeft",ml);
        $("img",right).css("marginLeft",mr);
        that.windowWidth=$(window).width();
        that.position=[ml,mr];
        that.splitPos=[l,r];
      }else{
        left.width((g - 5) / 2);
        right.width((g - 5) / 2);
      }
    } else if (c > 0) {
      left.width(g);
      $(".seperator", this.dom);
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.body.ondrop = function(e) {
    return false;
  };
  document.body.ondragover = function(e) {
    return false;
  };
  var droptarget = document.querySelector('.dropArea');
  initDropArea(droptarget);
  imageListManager.init();
  imageListManager.windowWidth=$(window).width();
}, false);
