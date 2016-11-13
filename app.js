var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

//Locations of scavenger hunt
//BOSTON
var bostonLat = 42.373017;
var bostonLong = -71.062360;

// //SAN FRANCISCO
// var sanFranLat = 37.732310;
// var sanFranLong = -122.502659;

// //SAN DIEGO
// var sanDeigoLat = 32.801336;
// var san sanDeigoLong = -117.236578;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});
// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    if(events.hasOwnProperty("attachments")){
	    if(typeof events.message.attachments[0] !== undefined){
	    	if(events.message.attachments[0].hasOwnProperty("payload")){
					if(typeof events.message.attachments[0].payload.coordinates !== undefined){
						console.log("ITS WORKING BITCHES!!!");
						console.log(events.message.attachments[0].payload.coordinates.lat);
						console.log(events.message.attachments[0].payload.coordinates.long);
					}
					
				}
			}
		}
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
        	// console.log(event.message);

		    if (!cityMessage(event.sender.id, event.message.text)){
		    	
				// console.log(event.message.quick_reply.payload);
		        sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
		    }
		    if(event.message.quick_reply){
					if(event.message.quick_reply.payload == 'bostoncity'){
						cityMessage(event.sender.id, event.message.quick_reply.payload);
					}
			}
			
		} else if (event.postback) {
		    console.log("Postback received: " + JSON.stringify(event.postback));
		    console.log("Payload value received: " + JSON.stringify(event.postback.payload));
		    if (event.postback.payload == "get_started"){
		    	console.log("User just pressed get started. Info: New User incoming.");
		    	// sendMessage(event.sender.id, {text: "Hi, welcome to the Scavenger Hunt! Which city are you from?"});
		    	citySelect(event.sender.id);
		    }
		    else if (event.postback.payload == "bostoncity"){
		    	cityMessage(event.sender.id, event.postback.payload);
		    }
		    else if (event.postback.payload == "bostongift"){
		    	// Send Boston City location of the gift && maybe double check their location?
		    	giftLocMessage(event.sender.id, event.postback.payload);
		    	// arrivalInquiry(event.sender.id);
		    }
		    else if (event.postback.payload == "calculateDistance"){
		    	arrivalInquiry(event.sender.id);
		    }
		}
    }
    res.sendStatus(200);
});



// -------------------------------- CALCULATE THE DISTANCE IN MILES BETWEEN TWO COORDINATES ----------------
if (typeof(Number.prototype.toRadians) === "undefined") {
  Number.prototype.toRadians = function() {
    return this * Math.PI / 180;
  }
}

function distance(lat1, lon1, lat2, lon2){
	// lat1 = 37.732310;
	// lat2 = 32.801336;
	// lon1 = -122.502659;
	// lon2 = -117.236578;
	var R = 6371e3; // metres
	var φ1 = lat1.toRadians();
	var φ2 = lat2.toRadians();
	var Δφ = (lat2-lat1).toRadians();
	var Δλ = (lon2-lon1).toRadians();

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        	Math.cos(φ1) * Math.cos(φ2) *
        	Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = ((R * c)/1000)/1.6;
	console.log("distance in miles:",d);
	return d;
}
// -------------------------------------------------------------------------------------------------------

// GIFTS
// Each city has a gift. and that gift has a picture, description, and location to it.

// CLUES
// Clues are hints provided to the user to help them find the gift.
// Clues are provided once the user reaches the location of the gift. This also includes sending picture of
// the prize.

// calculate how far user is from gift location
// function howFarFromGift(recipientId, text){

// }


// function to greet first-timers
function greetFirstTimers(){
	request({
		url: 'https://graph.facebook.com/v2.6/me/thread_settings',
		qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
		method: 'POST',
		json: {
			setting_type: call_to_actions,
			thread_state: new_thread,
			call_to_actions:[
			    {
			      payload:"get_started",
			    }
			]
		}
	})
}

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// send message on get started with options to choose city
function citySelect(recipientId){
	message = {
		"text":"Hi, Welcome to Scavenger Hunt! Which city do you live in?",
		    "quick_replies":[
		      {
		        "content_type":"text",
		        "title":"Boston",
		        "payload":"bostoncity"
		      },
		      {
		        "content_type":"text",
		        "title":"San Francisco",
		        "payload":"sanfranciscocity"
		      },
		      {
		        "content_type":"text",
		        "title":"San Diego",
		        "payload":"sandiegocity"
		      }
		    ]
		};
	sendMessage(recipientId, message);
	return true;
}


//send rich message when user selects "boston", "san francisco", or "san diego"
function cityMessage(recipientId, text){

	text = text || "";
	var values = text.split(' ');

	if (values.length === 1 && values[0] === 'bostoncity'){
		
		var bostonUrl = "http://www.bostongreeterservices.com/skyline_boston.jpg";
		message = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": [{
						"title": "City | Boston",
                            "subtitle": "Boston Scavenger Hunt",
                            "image_url": bostonUrl ,
                            "buttons": [{
                                "type": "postback",
                                "title": "Confirm location",
                                "payload": "bostongift",
						}]
					}]
				}
			}
		}

		sendMessage(recipientId, message);

		return true;
	}

	return false;
}

// Location of the gift message
function giftLocMessage(recipientId, text){

	text = text || "";
	if (text === 'bostongift'){
		message = {
			"attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    
                        "title": "Gift location in Boston",
                        "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?center="+bostonLat+","+bostonLong+"&zoom=16&size=764x400&key=AIzaSyB-gIN9zEFn-JiVlkYJ7XKBxiH2RtohjY0",
                        "item_url": "http:\/\/maps.apple.com\/maps?q="+bostonLat+","+bostonLong+"&z=16",
                    	
                    "buttons":[
		              {
		                "type":"postback",
		                "payload":"calculateDistance",
		                "title":"How far am I?"
		              }]
                	}]
            	}
        	}
		};
		sendMessage(recipientId, message);
        return true;
	}

	return false;
}

function arrivalInquiry(recipientId){
	message = {
			"text":"Please share your location:",
		    "quick_replies":[
		      {
		        "content_type":"location",
		      }
		    ]
		};
		sendMessage(recipientId, message);
}

// send rich message with kitten
function kittenMessage(recipientId, text) {
    
    text = text || "";
    var values = text.split(' ');
    
    if (values.length === 3 && values[0] === 'kitten') {
        if (Number(values[1]) > 0 && Number(values[2]) > 0) {
            
            var imageUrl = "https://placekitten.com/" + Number(values[1]) + "/" + Number(values[2]);
            
            message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Kitten",
                            "subtitle": "Cute kitten picture",
                            "image_url": imageUrl ,
                            "buttons": [{
                                "type": "web_url",
                                "url": imageUrl,
                                "title": "Show kitten"
                                }, {
                                "type": "postback",
                                "title": "I like this",
                                "payload": "User " + recipientId + " likes kitten " + imageUrl,
                            }]
                        }]
                    }
                }
            };
    
            sendMessage(recipientId, message);
            
            return true;
        }
    }
    
    return false;
    
};