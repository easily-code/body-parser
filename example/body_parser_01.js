var reqParse=require('./req-parse');
module.exports=function () {
  return function (req,res,next) {
    var ct=req.headers['content-type'];
    if(req.method.toLowerCase()=='post'&&
    (ct=='application/json'||
    ct=='application/x-www-form-urlencoded')){
      var arr=[];
      req.on('data',(data)=>{
        arr.push(data)
      });
      req.on('end',()=>{
        var data=Buffer.concat(arr).toString();
        if (ct=='application/json'){req.body=JSON.parse(data); next();return;}
        var url={'url':'/?'+data};
        reqParse(url);
        req.body=url.query;
        next();
        return;
      });
    }
    else next();
  };
};
