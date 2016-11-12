var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

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
        if (event.message && event.message.text) {
		    if (!kittenMessage(event.sender.id, event.message.text)) || (!cityMessage(event.sender.id, event.message.text)) {
		        sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
		    }
		} else if (event.postback) {
		    console.log("Postback received: " + JSON.stringify(event.postback));
		    console.log("Payload value received: " + JSON.stringify(event.postback.payload));
		    if (event.postback.payload == "get_started"){
		    	console.log("User just pressed get started. Info: New User incoming.");
		    	sendMessage(event.sender.id, {text: "Hi, welcome to the Scavenger Hunt! Which city are you from?"})
		    }
		}
    }
    res.sendStatus(200);
});

//Locations of scavenger hunt
//BOSTON
var bostonLat = 42.373017;
var bostonLong = -71.062360;

//SAN FRANCISCO
var sanFranLat = 37.732310;
var sanFranLong = -122.502659;

//SAN DIEGO
var sanDeigoLat = 32.801336;
var san sanDeigoLong = -117.236578;


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


//send rich message when user selects "boston", "san francisco", or "san diego"
function cityMessage(recipientId, text){

	text = text || "";
	var values = text.split(' ');

	if (values.length === 1 && (values[0] === 'boston' || values[0] === 'Boston' || values[0] === 'BOSTON')){
		
		var bostonUrl = "https://s-media-cache-ak0.pinimg.com/236x/a7/fa/69/a7fa69dc4681bad6bd419e2bf31a95da.jpg";
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
                                "type": "web_url",
                                "url": bostonUrl,
                                "title": "Show Boston"
                                }, {
                                "type": "postback",
                                "title": "Confirm",
                                "payload": "User " + recipientId + " is from Boston ",
						}]
					}
				}
			}
		}

		sendMessage(recipientId, message);

		return true;
	}

	return false;
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