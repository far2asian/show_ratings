var http = require('http');
const url = require("url");
var request = require("request");
const jsdom = require("jsdom");
const fs = require('fs');
const { JSDOM } = jsdom;

var content = "";
(async function (){
    request( {uri:"https://www.sbs.com.au/ondemand/collection/movies-leaving-soon"},
    async function(error, response, body){
        const dom = new JSDOM(body);
		const document = dom.window.document;
        for (const elem of document.querySelectorAll("[data-testid='tile']")){
        // const num = document.querySelectorAll("[data-testid='tile']").length;
        // document.querySelectorAll("[data-testid='tile']").forEach(async function(elem, index){
            let title_elem = elem.querySelector('h3');
            let title = title_elem.textContent;
            let genre_elem = elem.querySelector("span[class~='ellipsis']");
            let year = elem.querySelector("span span+span").textContent;
            title_elem.textContent = title + " (" + year + ")";
            let video_url = "https://www.sbs.com.au" + elem.querySelector("a").href;
            let video_response = await fetch(video_url);
            let video_body = await video_response.text();
            let video_dom = new JSDOM(video_body);
            const video_doc = video_dom.window.document;
            expiry = video_doc.querySelector("div.MuiContainer-root span span").textContent;
            let rt_path = title.toLowerCase().replaceAll(" ", "_").replaceAll(":","").replaceAll("\'","");
            // console.log(rt_path);
            let rt_url = "https://www.rottentomatoes.com/m/" + rt_path;
            console.log(rt_url);
            let rt_response = await fetch(rt_url);
            let rt_body = await rt_response.text();
            let rt_dom = new JSDOM(rt_body);
            const rt_doc = rt_dom.window.document;
            let scoreboard = rt_doc.getElementById("scoreDetails");
            let audience = "";
            let tomatometer = "";
            if(scoreboard){
                let score_json = JSON.parse(scoreboard.innerHTML);
                // console.log(JSON.stringify(score_json, null, 4));
                audience = score_json["scoreboard"]["audienceScore"]["value"] || "--";
                tomatometer = score_json["scoreboard"]["tomatometerScore"]["value"] || "--";
            }
            else{
                // console.log("Problem with: "+ title);
                // console.log(rt_path);
                // fs.writeFile(title + ".html", rt_body, function(err) {
                //     if(err) {
                //         return console.log(err);
                //     }
                //     console.log("The file was saved!");
                // }); 
                // console.log(scoreboard.innerHTML);
            }
            let info = " A: "+ audience + "% T: "+ tomatometer + "% " + expiry;
            console.log( title + info);
            genre_elem.textContent = info;

        }
        console.log("Completed!");
        content = dom.window.document.getElementsByTagName('html')[0].innerHTML.replaceAll("/ondemand/movie","https://www.sbs.com.au/ondemand/movie");
});
})();

http.createServer(function (req, res) {
    const reqUrl = url.parse(req.url).pathname
    if(reqUrl == "/" || reqUrl == "" ){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(content);
    }
    else if(reqUrl == "/ondemand/static/ac4c223b/js/runtime.js"){
        request( {uri:"https://www.sbs.com.au" + reqUrl},
        function(error, response, body){
            res.end(body);
        });
    }
    else if(reqUrl == "/ondemand/static/ac4c223b/js/client.js"){
        request( {uri:"https://www.sbs.com.au" + reqUrl},
        function(error, response, body){
            res.end(body);
        });
    }    
    else if(reqUrl == "/ondemand/static/ac4c223b/js/662.js"){
        request( {uri:"https://www.sbs.com.au" + reqUrl},
        function(error, response, body){
            res.end(body);
        });
    }    
    else {
        res.end();
    }
}).listen(8080); 