var urlencode=require('urlencode');

var urlParser=module.exports=function (req) {
  var url=req.url.toLowerCase();
      var url=urlencode.decode(url);
      var regexp=/^([^\?]+)(?:\?([^\?#]+))?(?:#[^\#].*)?$/g;
      var arr=regexp.exec(url);
      req.path=arr[1];
      req.params=[];
      req.query={};
      req.path=='/'||
      req.path.replace(/[^\/]+/g,function (a) {
          req.params.push(a);
      });
      if(arr[2]!==undefined){
        arr[2].replace(/([^\&]+)=([^\&]+)?/g,function (a,b,c) {
            req.query[b]=c;
        });
      }
      return req;
  };
