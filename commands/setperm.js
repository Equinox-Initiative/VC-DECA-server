const Discord = require('discord.js');
var admin = require('firebase-admin');
const https = require('https');

var db = admin.database().ref();

module.exports = {
	name: 'setperm',
    description: 'Set db perms for a certain user.',
    dev: true,
	execute(snapshot, message, args) {
        var found = false;
        if (message != null) {
            // Discord message
            if (args.length >= 3) {
                https.get('https://vc-deca.firebaseio.com/users/.json', (resp) => {
                    let data = '';
                    resp.on('data', (chunk) => {
                      data += chunk;
                    });
                    resp.on('end', () => {
                        var json = JSON.parse(data)
                        Object.keys(json).forEach((key) => {
                            if (json[key]["name"] == args[0] + " " + args[1]) {
                                found = true;
                                var user = json[key]
                                for (var i = 2; i < args.length; i++) {
                                    if (JSON.stringify(user["perms"]).indexOf(args[i]) < 0) {
                                        db.child("users").child(key).child("perms").push().set(args[i]);
                                        message.channel.send("Added perm: " + args[i])
                                        console.log("Added perm: " + args[i]);
                                    }
                                    else {
                                        message.channel.send("User already has perm: " + args[i])
                                        console.log("User already has perm: " + args[i]);
                                    }
                                }
                            }
                        });
                        if (!found) {
                            message.channel.send("Failed to find " + args[0] + " " + args[1])
                        }
                    });
                  });
            }
            else {
                message.channel.send('Command Usage: ```?setperm [firstName] [lastName] [perm1] [perm2] ...```');
            }
        }
        else if (snapshot != null) {
            // VC DECA App ChatMessage
        }
        else {
            // Console time
        }
	},
};