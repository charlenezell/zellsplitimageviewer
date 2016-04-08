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
    var job=[];
    imageListManager.empty();
    var files = e.dataTransfer.files; // The dropped files
    var title=files[0].name.match(/[^\w\s.]+/);
    if(title){
      document.title=title[0];
    }
    for (var i = 0; i < files.length; i++) { // Loop through them all
      var type = files[i].type;
      if (type.substring(0, 6) !== "image/") // Skip any nonimages
        continue;
      var j=$.Deferred();
      job.push(j);
      imageListManager.add(getBlobURL(files[i]),j);
    }
    mainArea.classList.remove("dragenter"); // Unhighlight droptarget
    imageListManager.dom.style.display = "flex";
    $.when.apply(this,job).done(function(){
      imageListManager.render();
    })
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
      var tw=$(that.dom).width()-5;
      var olw=that.splitPos[0];
      var orw=that.splitPos[1];
      var lm=that.position[0];
      var rm=that.position[1];
      var lw=tw*olw/(olw+orw);
      var rw=tw*orw/(olw+orw);
      var il=$("img",left);
      var ir=$("img",right);
      var oliw=il.width();
      var oriw=ir.width();
      that.render({
        lm:lm*(lw/olw),
        rm:rm*(rw/orw),
        lw:lw,
        rw:rw,
        liw:il.width(oliw*(lw/olw)),
        riw:ir.width(oriw*(rw/orw))
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
  empty:function(){
    imageListManager.list=[];
  },
  add: function(url,def) {
    var img = document.createElement("img"); // Create an <img> element
    img.src = url // Use Blob URL with <img>
    img.onload = function() { // When it loads
      revokeBlobURL(this.src); // But don't leak memory!
      def.resolve();
    }
    imageListManager.list.unshift(img);
  },
  render: function(option) {
    var that=this;
    var c = 0;
    var left = $(".leftImg", this.dom);
    var right = $(".rightImg", this.dom);
    var m;
    if(this.list.length>=2){
      if(this.list[0].width>this.list[1].width){
        left.empty().append(this.list[0]);
        right.empty().append(this.list[1]);
      }else{
        left.empty().append(this.list[1]);
        right.empty().append(this.list[0]);
      }
    }
    var g = $(".imageView").width();
      if(option){
        left.width(option.lw);
        right.width(option.rw);
        $("img",left).css("marginLeft",option.lm).width(option.liw);
        $("img",right).css("marginLeft",option.rm).width(option.riw);
      }else{
        left.width((g - 5) *0.74);
        right.width((g - 5) *0.26);
        that.zoomTo(left,(g - 5) *0.74/1040);
        that.zoomTo(right,(g - 5) *0.26/640);
        $("img",left).css("marginLeft",-(1920-1040)/2*$("img",left).width()/1920);
        $("img",right).css("marginLeft",0);
      }
      that.position=[parseFloat($("img",left).css("marginLeft")),parseFloat($("img",right).css("marginLeft"))];
      that.splitPos=[left.width(),right.width()];
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
}, false);
