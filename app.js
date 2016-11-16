var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

//Locations of scavenger hunt
var locationdict = [];
var bostonSelected = false;
var sanFranSelected = false;
var sanDiegoSelected = false;
//BOSTON
var bostonLat = 42.373017;
var bostonLong = -71.062360;

//SAN FRANCISCO
var sanFranLat = 37.732310;
var sanFranLong = -122.502659;

//SAN DIEGO
var sanDeigoLat = 32.801336;
var sanDeigoLong = -117.236578;

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
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if(event.hasOwnProperty("message")){
		    	if(event.message.hasOwnProperty("attachments")){
		    		if(event.message.attachments[0].hasOwnProperty("payload")){
		    			if(event.message.attachments[0].payload.hasOwnProperty("coordinates")){
		    				
		    				lat = event.message.attachments[0].payload.coordinates.lat;
		    				long = event.message.attachments[0].payload.coordinates.long;
		    				console.log("------------------------DICT------------------------");
		    				console.log(event.sender.id);
		    				console.log(locationdict[event.sender.id]);
		    				console.log("----------------------------------------------------");
		    				if(locationdict[event.sender.id][0]){
		    					dist = distance(lat, long, bostonLat, bostonLong);
		    					distanceMessage(event.sender.id, dist);
		    				}
		    				else if(locationdict[event.sender.id][1]){
		    					dist = distance(lat, long, sanFranLat, sanFranLong);
		    					distanceMessage(event.sender.id, dist);
		    				}
		    				else if(locationdict[event.sender.id][2]){
		    					dist = distance(lat, long, sanDeigoLat, sanDeigoLong);
		    					distanceMessage(event.sender.id, dist);
		    				}
		    			}
		    		}
		    	}
		    }
        if (event.message && event.message.text) {

		    if(event.message.quick_reply){

		    	switch(event.message.quick_reply.payload){
		    		case "bostoncity":
		    			cityMessage(event.sender.id, event.message.quick_reply.payload);
		    			break;
		    		case "sanfranciscocity":
		    			cityMessage(event.sender.id, event.message.quick_reply.payload);
		    			break;
		    		case "sandiegocity":
		    			cityMessage(event.sender.id, event.message.quick_reply.payload);
		    			break;
		    		case "othercity":
		    			otherCity(event.sender.id);
		    			break;
		    		default:
		    			console.log("invalid city selected");
		    	}
			}
			else if(event.message.text == "meow" || event.message.text == "Meow" || event.message.text == "MEOW"){
				kittenMessage(event.sender.id, "kitten 300 300");
			}
			else{
				citySelect(event.sender.id);
			}
			
		} else if (event.postback) {

		    switch(event.postback.payload){
		    	case "get_started":
		    		citySelect(event.sender.id);
		    		break;
		    	case "changeloc":
		    		citySelect(event.sender.id);
		    		break;
		    	case "bostongift":
		    		giftLocMessage(event.sender.id, event.postback.payload);
		    		break;
		    	case "sanfrangift":
		    		giftLocMessage(event.sender.id, event.postback.payload);
		    		break;
		    	case "sandiegogift":
		    		giftLocMessage(event.sender.id, event.postback.payload);
		    		break;
		    	case "calculateDistance":
		    		arrivalInquiry(event.sender.id);
		    		break;
		    	case "distanceInquiry":
		    		arrivalInquiry(event.sender.id);
		    		break;
		    	case "arrived":
		    		cluesMessage(event.sender.id);
		    		break;
		    	case "revealgift":
		    		giftMessage(event.sender.id);
		    		break;
		    	case "shareit":
		    		shareIt(event.sender.id);
		    		break;
		    	default:
		    		console.log("something's fucked up in postbacks. shit. fuck. okay, fix it.");

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
	var R = 6371e3; // in metres
	var φ1 = lat1.toRadians();
	var φ2 = lat2.toRadians();
	var Δφ = (lat2-lat1).toRadians();
	var Δλ = (lon2-lon1).toRadians();

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        	Math.cos(φ1) * Math.cos(φ2) *
        	Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = ((R * c)/1000)/1.6;
	d = Math.round(d * 100) / 100;
	return d;
}
// ---------------------------------------------------------------------------------------------------------

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
// now with personalized usernames. WHAAAAAATTTTT?!!!! No wayyyyyy
function citySelect(recipientId){
	var http = require('https');
	var user = [];
    var path = '/v2.6/' + recipientId +'?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=EAATDLl0soNgBAHHI0U8nZBKRHxug8VOaUuC7yuWDfHSgNTmCDbAvfFhWEUdkAT34pSi9ZAo3ChICxhPI24AudXPUoJdITjlSWmMU7SYZBleYHNCoNooDK79TBsbSD3LZAVL1hxQRXpliuOtRWtpu3vy84OZCppLsacYRsDW5PZBwZDZD';
    var options = {
      host: 'graph.facebook.com',
      path: path
    };
    callback = function(response) {
	  var str = '';

	  //another chunk of data has been received, so append it to `str`
	  response.on('data', function (chunk) {
	    str += chunk;
	  });

	  //the whole response has been received, so we just print it out here
	  response.on('end', function () {
	    // console.log(str);
	    user.push(JSON.parse(str));
	    // console.log(user[0].first_name);

	    message = {
		"text":"Hi "+user[0].first_name+", welcome to Scavenger Hunt! Which city do you live in?",
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
		      },
		      {
		        "content_type":"text",
		        "title":"Other",
		        "payload":"othercity"
		      }
		    ]
		};
		sendMessage(recipientId, message);

	  });
	}

	http.request(options, callback).end();
	// Yeah, fucking callback. Ughhhhhhh!
	
	return true;
}

function otherCity(recipientId){
	message = {
	  	"text":"Sorry, we're currently unavailable in your city. If you want to change your city, select \"Change location\" from the menu on left."
	  };
	  sendMessage(recipientId, message);
}


//send $$$ message when user selects "boston", "san francisco", or "san diego"
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
		locationdict[recipientId] = [true,false,false];
		return true;
	}
	else if (values.length == 1 && values[0] === 'sanfranciscocity'){
		var sanfranUrl = "https://img0.etsystatic.com/050/0/10112051/il_570xN.686320458_6vnm.jpg";
		message = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": [{
						"title": "City | San Francisco",
                            "subtitle": "San Francisco Scavenger Hunt",
                            "image_url": sanfranUrl ,
                            "buttons": [{
                                "type": "postback",
                                "title": "Confirm location",
                                "payload": "sanfrangift",
						}]
					}]
				}
			}
		}

		sendMessage(recipientId, message);
		locationdict[recipientId] = [false,true,false];
		return true;
	}
	else if (values.length == 1 && values[0] === 'sandiegocity'){
		var sandiegoUrl = "http://alwayssunnyinsd.com/wp-content/uploads/2013/10/SanDiego.jpg";
		message = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": [{
						"title": "City | San Diego",
                            "subtitle": "San Diego Scavenger Hunt",
                            "image_url": sandiegoUrl ,
                            "buttons": [{
                                "type": "postback",
                                "title": "Confirm location",
                                "payload": "sandiegogift",
						}]
					}]
				}
			}
		}

		sendMessage(recipientId, message);
		locationdict[recipientId] = [false,false,true];
		return true;
	}

	return false;
}

// Location of the gift to Mr. User. He should be on his way to the latest adventure. Wooo!
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
	else if (text === 'sanfrangift'){
		message = {
			"attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    
                        "title": "Gift location in San Francisco",
                        "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?center="+sanFranLat+","+sanFranLong+"&zoom=16&size=764x400&key=AIzaSyB-gIN9zEFn-JiVlkYJ7XKBxiH2RtohjY0",
                        "item_url": "http:\/\/maps.apple.com\/maps?q="+sanFranLat+","+sanFranLong+"&z=16",
                    	
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
	else if (text === 'sandiegogift'){
		message = {
			"attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    
                        "title": "Gift location in San Diego",
                        "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?center="+sanDeigoLat+","+sanDeigoLong+"&zoom=16&size=764x400&key=AIzaSyB-gIN9zEFn-JiVlkYJ7XKBxiH2RtohjY0",
                        "item_url": "http:\/\/maps.apple.com\/maps?q="+sanDeigoLat+","+sanDeigoLong+"&z=16",
                    	
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

// So, AM I HERE YET? Mom, How long is it gonna take?????
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

// "Son, it's gonna take at least xxx many miles" message
function distanceMessage(recipientId, distance){
	message = {
	  	"text":"You are "+distance+ " miles away from the gift location. Once you reach the location, select \"I am here\" by tapping the menu on the left."
	  };
	  sendMessage(recipientId, message);
}

// But once you are there, I've got some CLUES for you. Now get searching!
function cluesMessage(recipientId){
	if(locationdict[recipientId][0]){
		message = {
		  	"attachment": {
	        "type": "template",
	        "payload": {
	            "template_type": "list",
	            "top_element_style": "compact",
	            "elements": [
	                {
	                    "title": "Hint: 1",
	                    "subtitle": "Look for a place called \"Circle Donuts\"",
	                },
	                {
	                    "title": "Hint: 2",
	                    "subtitle": "Go inside the shop and ask for Scavenger Hunt menu",
	                },
	                {
	                    "title": "Hint: 3",
	                    "subtitle": "Receive the gift, smile at the lady and say \"Thank you\"",
	                }
	                ],
	               "buttons": [
		                {
		                    "title": "Reveal the gift",
		                    "type": "postback",
		                    "payload": "revealgift"                        
		                }
		            ]  
	            }
	        }
		  };
		sendMessage(recipientId, message);
	}
	else if(locationdict[recipientId][1]){
		message = {
		  	"attachment": {
	        "type": "template",
	        "payload": {
	            "template_type": "list",
	            "top_element_style": "compact",
	            "elements": [
	                {
	                    "title": "Hint: 1",
	                    "subtitle": "Take the bus to the train station.",
	                },
	                {
	                    "title": "Hint: 2",
	                    "subtitle": "Take the train. Never come back.",
	                },
	                {
	                    "title": "Hint: 3",
	                    "subtitle": "Receive the gift of ultimate freedom. You\'re welcome.",
	                }
	                ],
	               "buttons": [
		                {
		                    "title": "Reveal the gift",
		                    "type": "postback",
		                    "payload": "revealgift"                        
		                }
		            ]  
	            }
	        }
		  };
		sendMessage(recipientId, message);
	}
	else if(locationdict[recipientId][2]){
		message = {
		  	"attachment": {
	        "type": "template",
	        "payload": {
	            "template_type": "list",
	            "top_element_style": "compact",
	            "elements": [
	                {
	                    "title": "Hint: 1",
	                    "subtitle": "Look for an iPhone repair shop.",
	                },
	                {
	                    "title": "Hint: 2",
	                    "subtitle": "Go inside, smash your phone.",
	                },
	                {
	                    "title": "Hint: 3",
	                    "subtitle": "Exchange it for a new one.",
	                }
	                ],
	               "buttons": [
		                {
		                    "title": "Reveal the gift",
		                    "type": "postback",
		                    "payload": "revealgift"                        
		                }
		            ]  
	            }
	        }
		  };
		sendMessage(recipientId, message);
	}
}

// And this is what your gift looks like. GIFT? Did someone say GIFT? Where?
function giftMessage(recipientId){
	if(locationdict[recipientId][0]){
		var bostonGiftUrl = "http://www.withsprinklesontop.net/wp-content/uploads/2012/01/DSC_0406x900.jpg";
		message = {
			"attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    
                        "title": "This is your gift!",
                        "image_url": bostonGiftUrl,
	                	"buttons": [
			                {
			                    "title": "Tell your friends!",
			                    "type": "postback",
			                    "payload": "shareit"                        
			                }
			            ]
			        }]
                	
            	}
        	}
		};
		sendMessage(recipientId, message);
	}
	else if(locationdict[recipientId][1]){
		var sanfranGiftUrl = "http://newheightsboise.com/wp-content/uploads/2016/01/50623-Freedom.jpg";
		message = {
			"attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    
                        "title": "This is your gift!",
                        "image_url": sanfranGiftUrl,
	                	"buttons": [
				                {
				                    "title": "Tell your friends!",
				                    "type": "postback",
				                    "payload": "shareit"                        
				                }
				            ]
				        }]
                	
            	}
        	}
		};
		sendMessage(recipientId, message);

	}
	else if(locationdict[recipientId][2]){
		var sandiegoGiftUrl = "http://cdn.mos.cms.futurecdn.net/b474f04dc5fe5e3af3ad0069d0940938-650-80.jpg";
		message = {
			"attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    
                        "title": "This is your gift!",
                        "image_url": sandiegoGiftUrl,
                		"buttons": [
			                {
			                    "title": "Tell your friends!",
			                    "type": "postback",
			                    "payload": "shareit"                        
			                }
			            ]
			        }]
                	
            	}
        	}
		};
		sendMessage(recipientId, message);
	}
}

function shareIt(recipientId){
	message = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"Let your friends know what you found today!",
		        "buttons":[
		          {
		            "type":"web_url",
		            "url":"https://www.instagram.com/",	// Facebook won't let me use the iPhone hooks and Android Intents links
		            "title":"Share on Instagram"
		          },
		        ]
		      }
		    }
		};
		sendMessage(recipientId, message);
}

// send rich message with kitten ------  Because why not?
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