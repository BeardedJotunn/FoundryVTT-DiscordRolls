Hooks.once("init", function () {
    game.settings.register('averagerolls', "Enabled",
        {
            name: "Enabled",
            scope: "world",
            type: Boolean,
            default: true,
            config: true
        });
    
    /*
    game.settings.register('averagerolls', 'resetRolls', {
        name: "Journal Entry Name",
        hint: "Reset all rolls.",
        scope: "world",
        config: true,
        default: "Average Rolls",
        type: Boolean,
        onChange: () => {
            resetRolls();
        }
    });
    game.users.entries.forEach(user => {
        userid = user.id;
        game.settings.register('averagerolls', userid, {
            name: user.name + " Rolls",
            scope: "world",
            config: true,
            default: [],
            type: Array,
        });
    }) */
});

Hooks.once("ready", function () { 
    startUp();
});

// Adding flags for rolls and average to all users
function startUp() {
    console.log("Resetting session rolls");
    game.users.entries.forEach(user => {
        userid = user.id;
        plantFlag(userid, "sessionAverage", 0);
        plantFlag(userid, "sessionRolls", []);
        /*
        if (bringFlag(userid, "rolls") == undefined) {
            plantFlag(userid, "rolls", []);
        }
        if (bringFlag(userid, "average") == undefined) {
            plantFlag(userid, "average", []);
        }
        */
        console.log(userid + " reset");
    })
}
 // Resets all flags
function resetRolls() {
    console.log("Resetting all rolls");
    game.users.entries.forEach(user => {
        userid = user.id;
        plantFlag(userid, "sessionAverage", 0);
        plantFlag(userid, "sessionRolls", []);
        plantFlag(userid, "lifetimeAverage", 0);
        plantFlag(userid, "lifetimeRolls", []);
        console.log(userid + " reset");
    })
}

// Get specified flag for userid
function bringFlag(userid, flag) {
    get = game.users.get(userid).getFlag("averagerolls", flag)
    console.log(get);
    if (get == undefined) {
        console.log("Couldn't find flag");
    }
    return get;
}

// Set specified flag for userid
function plantFlag(userid, flag, value) {
    return game.users.get(userid).setFlag("averagerolls", flag, value)
}

// Output session average for all users as a chat message
function outputAverages(userid = "") {
    if (!userid == "") {
        user = game.users.get(userid);
        msg = new ChatMessage();
        msg.user = user;
        msg.data.user = userid;
        sessionAverage = bringFlag(userid, "sessionAverage");
        roundedAverage = Math.round((sessionAverage + Number.EPSILON) * 100) / 100;
        msg.data.content = "Session average for " + user.name + " is " + roundedAverage;
        ChatMessage.create(msg);
    } else {
        game.users.entries.forEach(user => {
            userid = user.id;
            msg = new ChatMessage();
            msg.user = user;
            msg.data.user = userid;
            sessionAverage = bringFlag(userid, "sessionAverage");
            roundedAverage = Math.round((sessionAverage + Number.EPSILON) * 100) / 100;
            msg.data.content = "Session average for " + user.name + " is " + roundedAverage;
            ChatMessage.create(msg);
        })
    }
}

Hooks.on("createChatMessage", (message, options, user) => 
{
    if (!game.settings.get("averagerolls", "Enabled") || !message.isRoll || !message.roll.dice[0].faces == 20) {
        console.log("returning");
        return;
    }
    name = message.user.name;
    result = parseInt(message.roll.result.split(" ")[0]);
    console.log(name + " rolled a " + result);

    sessionRolls = bringFlag(user, "sessionRolls")
    sessionRolls.push(result);
    plantFlag(user, "sessionRolls", sessionRolls);
    sessionSum = sessionRolls.reduce((a, b) => a + b, 0);
    sessionAverage = sessionSum/sessionRolls.length;
    plantFlag(user, "sessionAverage", sessionAverage);
    console.log("Session average for " + message.user.name + " is " + sessionAverage );

    
    lifetimeRolls = bringFlag(user, "lifetimeRolls")
    lifetimeRolls.push(result);
    plantFlag(user, "lifetimeRolls", lifetimeRolls);
    sum = lifetimeRolls.reduce((a, b) => a + b, 0);
    lifetimeAverage = sum/lifetimeRolls.length;
    plantFlag(user, "lifetimeAverage", lifetimeAverage);
    console.log("Lifetime average for " + message.user.name + " is " + lifetimeAverage );
    /*
    rolls = game.settings.get("averagerolls", user)
    rolls.push(result);
    plantFlag(user, "rolls", rolls);
    sum = rolls.reduce((a, b) => a + b, 0);
    average = sum/rolls.length;
    plantFlag(user, "average", average);
    console.log("Lifetime average for " + message.user.name + " is " + average );
    */
});