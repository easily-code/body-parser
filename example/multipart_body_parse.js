const ss = require('serve-static')('./public');
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');

var bp=module.exports=function (uploaddir) {
  return function (req,res,next) {

    var ct=req.headers['content-type'];
    if (!ct||ct.indexOf('mult')<0) {
      next();
      return;
    }
    var boundary,buf,ws,last;
    req.body={};
    boundary='--'+ct.split('=')[1].trim();

    req.on('data',(data)=>{
      addDataToBuf(data);
      parseBuf();
    });
    req.on('end',()=>{
      console.log('end');
      next();
    });

    function addDataToBuf(data){
        if(buf){
          buf=Buffer.concat([buf,data]);
          return;
        }
        buf=Buffer.from(data);
    }
    function parseBuf() {
        var i=buf.indexOf(boundary);
        var remain=boundary.length+10;
        if(buf.length<remain) return;
        if(i==0){
          stopItem();
          i=buf.indexOf('\r\n\r\n');
          openItem(buf.slice(boundary.length+2,i).toString()); //解析header
          buf=buf.slice(i+4);
          parseBuf();   // 递归
        }
        else if(i>0){
        addDataToItem(buf.slice(0,i-2)); // 写文件 或 添加到last['value']
        buf=buf.slice(i);
        parseBuf();
        }
        else if(i<0){
          addDataToItem(buf.slice(0,buf.length-remain));
          buf=buf.slice(buf.length-remain);
        }
    }

    function openItem(str) {
      last={value:''}
      str.replace(/([^\r\n]+)\:([^\r\n]+)/g,function (_,a,b) {
        last[a]=b.trim();
      });
      last['Content-Disposition'].replace(/([^;\=]+)\=(?:\"([^;]+)\")/g,function (_,a,b) {
        last[a.trim()]=b.trim();
      });

      if(last['filename']){        last['fullname']=path.join(uploaddir,uuid.v1()+path.extname(last['filename']));
        ws=fs.createWriteStream(last['fullname']);
      }
    }

    function stopItem(){
      if(last&&last['filename']){
        req.body[last['name']]=last;
        if(ws){
          ws.end();
          ws=null;
        }
      }
    }

    function addDataToItem(data){
      if(!last['filename']){
        last['value']+=data.toString();
        return;
      }
      if(ws){
        var ret=ws.write(Buffer.from(data));
        if (!ret) {
          req.pause();
          ws.once('drain', () => {
            req.resume();
          });
        }
      }
      }
  };
};
require('http').createServer(function (req,res) {
  ss(req,res,function () {
    bp('./public')(req,res,function () {

      res.end(JSON.stringify(req.body));
    });
  });
}).listen(80,function () {
  console.log('listing on 80!');
});
