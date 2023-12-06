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
            let scoreboard = await getScoreboard(title, year);
            let audience;
            let tomatometer;
            let score_json;
            if(scoreboard){
                score_json = JSON.parse(scoreboard.innerHTML);
                audience = score_json["scoreboard"]["audienceScore"]["value"] || "--";
                tomatometer = score_json["scoreboard"]["tomatometerScore"]["value"] || "--";
            }
            else{
                console.log("Couldn't find: "+ title);
                continue;
            }
            let info = " T: "+ tomatometer + "% A: "+ audience + "% " + expiry;
            console.log( title_elem.textContent +  info);
            genre_elem.textContent = info;

        }
        console.log("Completed!");
        content = dom.window.document.getElementsByTagName('html')[0].innerHTML.replaceAll("/ondemand/movie","https://www.sbs.com.au/ondemand/movie");
});
})();

async function getScoreboard(title, year){
    let rt_search = "https://www.rottentomatoes.com/search?search=" + encodeURIComponent(title);
    let rt_response = await fetch(rt_search);
    let rt_body = await rt_response.text();
    let rt_dom = new JSDOM(rt_body);
    let rt_doc = rt_dom.window.document;
    let scoreboard;
    for (const elem of rt_doc.querySelectorAll("search-page-media-row")){
        if (elem.getAttribute("releaseyear") == year){
            let rt_url = elem.querySelector("a").href;
            rt_response = await fetch(rt_url);
            rt_body = await rt_response.text();
            rt_dom = new JSDOM(rt_body);
            rt_doc = rt_dom.window.document;
            scoreboard = rt_doc.getElementById("scoreDetails");
            break;
        }
    }
    return scoreboard;
}

http.createServer(function (req, res) {
    const reqUrl = url.parse(req.url).pathname
    if(reqUrl == "/" || reqUrl == "" ){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(content);
    }
    else if(reqUrl.includes( "runtime.js") || reqUrl.includes( "client.js") || reqUrl.includes( "662.js")){
        request( {uri:"https://www.sbs.com.au" + reqUrl},
        function(error, response, body){
            res.end(body);
        });
    }    
    else {
        res.end();
    }
}).listen(8080); 
