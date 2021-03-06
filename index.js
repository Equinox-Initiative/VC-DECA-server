var admin = require('firebase-admin');
var readline = require('readline');
const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const csv = require('csv-parser');  
const fs = require('fs');

const client = new Discord.Client();
client.commands = new Discord.Collection();

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://vc-deca.firebaseio.com"
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); 

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
var db = admin.database().ref();

client.login(botconfig.token);

client.on("ready", () => {
    console.log(`${client.user.username} is online!`);
    client.channels.get('639004912977707028').send(new Discord.RichEmbed()
        .setAuthor('VC DECA Bot')
        .setColor('#0073CE')
        .setDescription(`${client.user.username} is online!`)
    );
});

client.on("message", (message) => {
    if (!message.content.startsWith(botconfig.dev_prefix + botconfig.prefix) || message.author.bot) return;
    // Parse user input
    const args = message.content.slice((botconfig.dev_prefix + botconfig.prefix).length).split(/ +/);
    const command = args.shift().toLowerCase();
    // Check if command exists
    if (!client.commands.has(command)) {
        console.log(`Command ${command} does not exist`);
        return;
    };
    client.commands.get(command).execute(null, message, args);
    if (botconfig.dev_prefix != "") {
        message.channel.send(new Discord.RichEmbed().setFooter('NOTE: This is a Dev Command. Some things may be broken.'));
    }
});

db.child("chat").on("child_added", (snapshot) => {
    console.log(snapshot.key)
    db.child("chat").child(snapshot.key).on("child_added", (chatshot) => {
        if (!botconfig["notify"]) return;
        var message = chatshot.val();
        console.log(message.author + ": " + message.message);
        if (message.message != null) {
            if (message.type == "text") {
                client.channels.get('639004912977707028').send(new Discord.RichEmbed()
                    .setAuthor(message.author, message.profileUrl)
                    .setDescription(message.message)
                    .setFooter(snapshot.key)
                    .setTimestamp()
                );
            }
            else {
                client.channels.get('639004912977707028').send(new Discord.RichEmbed()
                    .setAuthor(message.author, message.profileUrl)
                    .setDescription("Image Upload")
                    .setThumbnail(message.message)
                    .setFooter(snapshot.key)
                    .setTimestamp()
                );
            }
        }
        // Don't send notifications for nsfw messages
        if (message.nsfw) return;
        // Send notification
        if (snapshot.key == "global") {
            admin.messaging().send({
                topic: "GLOBAL_CHAT",
                notification: {
                    title: `[General Chat] ${message.author}`,
                    body: message.message
                }
            }).then((response) => {
                console.log('Successfully sent message in GENERAL:', response);
                client.channels.get('639004912977707028').send(response);
            });
        }
        else if (snapshot.key == "dev") {
            admin.messaging().send({
                topic: "DEV",
                notification: {
                    title: `[Dev Env] ${message.author}`,
                    body: message.message
                }
            }).then((response) => {
                console.log('Successfully sent message in DEV:', response);
                client.channels.get('639004912977707028').send(response);
            });
        }
        else if (snapshot.key == "officer") {
            admin.messaging().send({
                topic: "OFFICER_CHAT",
                notification: {
                    title: `[Officer Chat] ${message.author}`,
                    body: message.message
                }
            }).then((response) => {
                console.log('Successfully sent message in OFFICER:', response);
                client.channels.get('639004912977707028').send(response);
            });
        }
        else if (snapshot.key == "leader") {
            admin.messaging().send({
                topic: "LEADER_CHAT",
                notification: {
                    title: `[Leader Chat] ${message.author}`,
                    body: message.message
                }
            }).then((response) => {
                console.log('Successfully sent message in LEADER:', response);
                client.channels.get('639004912977707028').send(response);
            });
        }
        else {
            admin.messaging().send({
                topic: snapshot.key,
                notification: {
                    title: `[${snapshot.key}] ${message.author}`,
                    body: message.message
                }
            }).then((response) => {
                console.log(`Successfully sent message in ${snapshot.key}:`, response);
                client.channels.get('639004912977707028').send(response);
            });
        }
        // Check if message contains bot command
        if (!message.message.toLowerCase().startsWith(botconfig.dev_prefix + botconfig.prefix) || message.role == "Bot") return;
        if (botconfig.dev_prefix != "" && (botconfig.devs.indexOf(message.author) == -1)) return;
        const args = message.message.slice((botconfig.dev_prefix + botconfig.prefix).length).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!client.commands.has(command)) {
            console.log(`Command ${command} does not exist`);
            return;
        };
        if (client.commands.get(command).dev && botconfig.devs.indexOf(message.author) == -1) {
            db.child("chat").child(snapshot.key).push().set({
                "author": "VC DECA Bot",
                "color": "#0073CE",
                "date": "",
                "message": "Hey, you can't access that command!",
                "nsfw": false,
                "profileUrl": "https://github.com/Equinox-Initiative/VC-DECA-flutter/blob/master/images/logo_white/ios/iTunesArtwork@3x.png?raw=true",
                "role": "Bot",
                "type": "text",
                "userID": "bot1"
            });
            return;
        }
        client.commands.get(command).execute(chatshot, null, args);
    });
});

rl.on('line', (input) => {
    // Parse user input
    const args = input.split(/ +/);
    const command = args.shift().toLowerCase();
    // Check if command exists
    if (!client.commands.has(command)) {
        console.log(`Command ${command} does not exist`);
        return;
    };
    client.commands.get(command).execute(null, null, args);
});

// Push Notificaton Handler
db.child("notifications").on("child_added", (snapshot) => {
    var notification = snapshot.val();
    console.log(`New Notification: ${notification.title} - ${notification.body}`)
    client.channels.get('639004912977707028').send(new Discord.RichEmbed()
        .setColor('#f59b42')
        .setAuthor(notification.title)
        .setDescription(notification.body)
        .setFooter('NOTIFICATION')
        .setTimestamp()
    );
    notification.topic.forEach(element => {
        if (element != "") {
            console.log(element)
            admin.messaging().send({
                topic: element,
                notification: {
                    title: notification.title,
                    body: notification.body
                }
            }).then((response) => {
                console.log('Successfully sent message:', response);
                client.channels.get('639004912977707028').send(response);
            });
        }
    });
    db.child("notifications").child(snapshot.ref.path.pieces_[1]).set(null);
});

// db.child("users").on("child_added", (snapshot) => {
//     var user = snapshot.val();
//     if (user.title == null) {
//         db.child("users").child(snapshot.key).child("title").set("")
//     }
// });