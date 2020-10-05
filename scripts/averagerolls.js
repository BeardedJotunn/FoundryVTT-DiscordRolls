Hooks.once("init", function () {
    game.settings.register('averagerolls', "Enabled", {
        name: "Enabled",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });
    game.settings.register('averagerolls', "JournalEntry", {
        name: "Create Journal Entry",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });
});

Hooks.once("ready", function () { 
    if (game.settings.get("averagerolls", "Enabled")) {
        startUp();
    }
});

// Adding flags for rolls and average to all users
function startUp() {
    console.log("Resetting session rolls");
    game.users.entries.forEach(user => {
        userid = user.id;
        plantFlag(userid, "sessionAverage", 0);
        plantFlag(userid, "sessionRolls", []);
        if (typeof bringFlag(userid, "lifetimeAverage") == "undefined") {
            plantFlag(userid, "lifetimeAverage", []);
        }
        if (typeof bringFlag(userid, "lifetimeRolls") == "undefined") {
            plantFlag(userid, "lifetimeRolls", 0);
        }
        console.log(userid + " reset for session.");
    })
    if (game.settings.get("averagerolls", "JournalEntry")) {
        updateJournal();
    }
}
 // Resets all flags
function resetRolls() {
    console.log("Resetting all rolls");
    game.users.entries.forEach(user => {
        userid = user.id;
        plantFlag(userid, "sessionAverage", 0);
        plantFlag(userid, "sessionRolls", []);
        plantFlag(userid, "lifetimeAverage", 0);
        plantFlag(userid, "lifetimeRolls", 0);
        console.log(userid + " reset.");
    })
}

// Sets all flags used to null
function cleanUp() {
    console.log("Cleaning up all users");
    game.users.entries.forEach(user => {
        userid = user.id;
        plantFlag(userid, "sessionAverage", null);
        plantFlag(userid, "sessionRolls", null);
        plantFlag(userid, "lifetimeAverage", null);
        plantFlag(userid, "lifetimeRolls", null);
        if (user.isGM) {
            plantFlag(userid, "journalId", null);
        }
        console.log(userid + " cleaned up.");
    })
}

// Get specified flag for userid
function bringFlag(userid, flag) {
    get = game.users.get(userid).getFlag("averagerolls", flag)
    console.log(get);
    if (typeof get == "undefined") {
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

function createJournal() {
    gm = "";
    game.users.entries.forEach(user => {
        if (user.isGM) {
            gm = user;
            break;
        }
    })
    userid = user.id;
    entry = new JournalEntry();
    entry.user = gm;
    entry.name = "Average Rolls";
    entry.data.user = userid;

    content = "AverageRolls";
    game.users.entries.forEach(user => {
        sessAverage = bringFlag(userid, "sessionAverage");
        lifeAverage = bringFlag(userid, "sessionAverage");
        sessionAverage = Math.round((sessAverage + Number.EPSILON) * 100) / 100;
        lifetimeAverage = Math.round((lifeAverage + Number.EPSILON) * 100) / 100;
        content += "\n--------\n" + user.name + "\nSession Average: " + sessionAverage + "\nLifetime Average: " + lifetimeAverage;
    })
    
    entry.data.content = content;
    JournalEntry.create(entry);
}

function updateJournal() {
    entry;
    game.users.entries.forEach(user => {
        if (user.isGM) {
            entry = getJournal(bringFlag(user.id, "journalId"));
            break;
        }
    })
    if (typeof entry == "undefined") {
        return createJournal();
    }
    content = "AverageRolls";
    game.users.entries.forEach(user => {
        sessAverage = bringFlag(userid, "sessionAverage");
        lifeAverage = bringFlag(userid, "sessionAverage");
        sessionAverage = Math.round((sessAverage + Number.EPSILON) * 100) / 100;
        lifetimeAverage = Math.round((lifeAverage + Number.EPSILON) * 100) / 100;
        content += "\n--------\n" + user.name + "\nSession Average: " + sessionAverage + "\nLifetime Average: " + lifetimeAverage;
    })
    
    entry.data.content = content;
    JournalEntry.update(entry);
}

function findJournal() {
    game.journal.entries.forEach(entry => {
        if (entry.name = "Average Rolls") {
            return entry;
        }
    })
}

function getJournal(journalId) {
    entry = game.journal.get(journalId);
    if (typeof entry == "undefined") {
        return findJournal();
    }
    return entry;
}

Hooks.on("createJournalEntry", (entry, options, user) => 
{
    console.log(entry);
    console.log(options);
});

// Hooks the chat message and if it's a D20 roll adds it to the roll flag and calculates averages for user that sent it.
Hooks.on("createChatMessage", (message, options, user) => 
{
    if (!game.settings.get("averagerolls", "Enabled") || !message.isRoll || !message.roll.dice[0].faces == 20) {
        console.log("returning");
        return;
    }
    name = message.user.name;
    result = parseInt(message.roll.result.split(" ")[0]);
    console.log(name + " rolled a " + result);

    sessionRolls = bringFlag(user, "sessionRolls");
    sessionRolls.push(result);
    plantFlag(user, "sessionRolls", sessionRolls);
    sessionSum = sessionRolls.reduce((a, b) => a + b, 0);
    sessionAverage = sessionSum/sessionRolls.length;
    plantFlag(user, "sessionAverage", sessionAverage);
    console.log("Session average for " + message.user.name + " is " + sessionAverage );

    
    lifetimeRolls = bringFlag(user, "lifetimeRolls");
    lifetimeAverage = bringFlag(user, "lifetimeAverage");
    newRolls = lifetimeRolls + 1;
    newAverage = ((lifetimeAverage * lifetimeRolls) + result) / (newRolls);
    plantFlag(user, "lifetimeRolls", newRolls);
    plantFlag(user, "lifetimeAverage", newAverage);
    console.log("Lifetime average for " + message.user.name + " is " + newAverage );

    if (game.settings.get("averagerolls", "JournalEntry")) {
        updateJournal();
    }
});