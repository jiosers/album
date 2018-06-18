var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
const formidable = require('formidable');

let albumNames = require('./albums.json');
let photos=require('./photos.json');
let currentPhoto = photos[0].data;


const ERROR=0;
const SUCCESS=1;
function ResData(state,data,msg){
	return {
		state:state,
		data:data,
		msg:msg
	}
}
router.post('/albumList',(req,res,next)=>{
	let resData=new ResData(SUCCESS,albumNames,"操作成功");
	res.send(resData);
})
//新增相册
router.post('/addAlbum',(req,res,next)=>{
	let albumName=req.body.albumName;
	let resData=new ResData(SUCCESS,{},"操作成功");
	let tag=false;
	albumNames.forEach(val=>{
		if(albumName===val.name){
			tag=true;
		}
	})
	if(tag){
		resData.msg="存在相同名字的相册"
		resData.state=ERROR;
	}else{
		albumNames.push({"key":albumNames[albumNames.length-1].key+1,"name":albumName});
		fs.writeFileSync(path.join(__dirname,'albums.json'),JSON.stringify(albumNames));
	}
	res.send(resData);
})
//显示图片
router.get('/img/:name', function(req, res) {
  	fs.createReadStream("imgs/" + req.params.name).pipe(res);
});
//得到图片
router.post('/photoList',(req,res,next)=>{
	const {page,pageSize}=req.body;
	const currentAlbumsId=req.body.currentAlbumsId||albumNames[0].key;
	let data=[];
	photos.forEach(val=>{
		if(val.mapKey==currentAlbumsId){
			data=val.data;
		}
	});
	let realData=data.slice((page-1)*pageSize,page*pageSize)
	let resData=new ResData(SUCCESS,realData,"操作成功");
	resData['total']=data.length
	res.send(resData);
});
//上传图片
router.post('/addImg',(req,res,next)=>{
	const form = new formidable.IncomingForm();
	let resData=new ResData(SUCCESS,{},"操作成功");
	form.uploadDir = "./imgs";
	form.keepExtensions = true;
	form.parse(req, function (error, fields, files) {
		const currentAlbumsId=fields.currentAlbumsId||albumNames[0].key;
		console.log(fields);
		if(error) {
		    resData['state']=ERROR;
		    resData['msg']=error;
		}else{
			resData['state']=SUCCESS;
		  photos.map(val=>{
				if(val.mapKey==currentAlbumsId){
					val.data.push(files.file.path.substring(5));
				}
				return val;
			})
		  fs.writeFileSync(path.join(__dirname,'photos.json'),JSON.stringify(photos));
		}
		res.send(resData);
	});
})
module.exports = router;
