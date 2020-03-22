var dataset = [];
var setting = {};

setting.topOffset = 40; // For positioning purposes should be like this
setting.boxHeight = 50; // This gives that little overlap to match the original
setting.flashEnabled = true; // Set to false to disable flash
setting.maxDisplay = 9; // Number of rows to display
setting.transitionTime = 5; // Rank animation time, lower = shorter
setting.fps = 60; // Drawing fps
setting.nameInitials = "last"; // Set name abbreviation rule: "default", "first", "last" or "initials"

var flashFlag = false;
var flashPos;
var maxHit = 0;

document.addEventListener("onOverlayDataUpdate", function(e) {
    update(e.detail);
});

var ranking = new Array();
var prevRank;
var globaltest;

function update(data) {
    var encDiv = document.getElementById("encounter");

    var minRDPS = SavageDPS(parseActFormat("{CurrentZoneName}", data.Encounter));


    // DRAWS TITLE
    encDiv.innerHTML = "<table cellspacing=0 cellpadding=0><tr><td width=65%>" + parseActFormat("{title}", data.Encounter) + "</td>" +
        "<td align='right'>" + parseActFormat("{duration}", data.Encounter) + "</td></tr>" +
        "<tr><td align='left'>" + parseFloat(parseActFormat("{dps}", data.Encounter)).toFixed(1) + "</td>" +
        "<td align='right' style='font-size: 12px'>" + minRDPS + "</td>" + "</tr>" +
        "</table>";

    // RANKING, THIS VAR STORES DATA TO BE DISPLAYED
    ranking = new Array(Object.keys(data.Combatant).length);
    var i = 0;
    maxHit = 0;


    for (var combName in data.Combatant) {
        if (!data.Combatant.hasOwnProperty(combName)) continue;

        ranking[i] = {};
        ranking[i].name = data.Combatant[combName]["name"];
        ranking[i].dps = parseFloat(data.Combatant[combName]["encdps"].replace(/[\.,]+/g), ".").toFixed(0);
        ranking[i].hps = parseFloat(data.Combatant[combName]["enchps"].replace(/[\.,]+/g), ".").toFixed(0);
        ranking[i].dmg = parseInt(data.Combatant[combName]["damage"]);
        ranking[i].dmgp = data.Combatant[combName]["damage%"];
        ranking[i].max = parseInt(data.Combatant[combName]["MAXHIT"].replace(/[\.,]+/g, ""));

        // this is just to grab the correct glow icon
        ranking[i].job = data.Combatant[combName]["Job"];
        if (ranking[i].job == undefined || ranking[i].job == "") {
            ranking[i].job = ranking[i].name;
            if (ranking[i].job.indexOf("-Egi (") != -1) {
                ranking[i].job = ranking[i].job.substring(0, ranking[i].job.indexOf("-Egi ("));
            } else if (ranking[i].job.indexOf("Eos (") == 0) {
                ranking[i].job = "Eos";
            } else if (ranking[i].job.indexOf("Selene (") == 0) {
                ranking[i].job = "Selene";
            } else if (ranking[i].job.indexOf("Carbuncle (") != -1) {
                ranking[i].job = "Carbuncle";
            } else if (ranking[i].job.indexOf(" (") != -1) {
                ranking[i].job = "choco";
            } else if (ranking[i].job.indexOf("Limit Break") != -1) {
                ranking[i].job = "Limit Break";
            } else {
                ranking[i].job = "error";
            }
        }

        // dps may be infinite at zero duration so this makes at least display something later
        if (isNaN(ranking[i].dps)) {
            ranking[i].dps = ranking[i].dmg;
        }

        // saves the max hit here because i'm too lazy to parse from the encounter JSON
        if (ranking[i].max > maxHit) maxHit = ranking[i].max;

        i++;
    }


    // SORT AND UPDATE RANKINGS
    ranking.sort(function(a, b) {
        return b.dmg - a.dmg
    });

    if (prevRank === undefined) {
        prevRank = new Array();
    }

    // GET PREVIOUS RANKING
    for (i = 0; i < ranking.length; i++) {
        ranking[i].prev = -1; // this is "no previous rank"

        // if has previous rank, calculate initial position
        for (var j = 0; j < prevRank.length; j++) {
            if (prevRank[j].name === ranking[i].name) {
                ranking[i].prev = j;
                continue;
            }
        }

        if (ranking[i].name == "YOU") {
            ranking[i].alpha = (ranking[i].prev == -1) ? 0 : 1;
        }
        if (ranking[i].prev == -1 || ranking[i].prev > setting.maxDisplay) { // for people joining the ranks (fade in)
            ranking[i].y = setting.topOffset + setting.boxHeight * (i + 1);
            ranking[i].prev = i;
        } else {
            ranking[i].y = setting.topOffset + setting.boxHeight * ranking[i].prev; // for everyone else (fade out if leaving)
            ranking[i].alpha = 1;
        }


        // If get better deeps, then flashy effect (only when getting to top ranks tho)
        if (ranking[i].name == "YOU" && i < ranking[i].prev && ranking[i].prev < setting.maxDisplay) {
            flashFlag = true;
            flashPos = Math.min(setting.maxDisplay - 1, ranking[i].prev);
            t = 0;
        }
    }
    // UPDATE DATA;
    prevRank = ranking;
}

var t = 0;


// Draws stuff by clearing everything every time, so it may be slow as shit on lower end pcs
function draw() {

    var combDiv = document.getElementById("combatant");

    // Clears everything before drawing
    while (combDiv.firstChild) {
        combDiv.removeChild(combDiv.firstChild);
    }

    var myRank = -1;
    for (i = 0; i < ranking.length; i++) {
        if (ranking[i].name == "YOU") {
            myRank = i;
        }
    }

    // if is scrub and does not even get in the top ranks
    var isLast = (myRank >= setting.maxDisplay - 1);

    // the actual drawing part
    for (i = 0; i < ranking.length; i++) {

        var box = document.createElement("div");
        box.className = "combBox";

        if (i == setting.maxDisplay - 1 && myRank != -1 && isLast) { // show at last on the list even if not on top ranks
            i = myRank;
            ranking[i].y = setting.topOffset + setting.boxHeight * (setting.maxDisplay - 1);
            ranking[i].alpha += (1 - ranking[i].alpha) / setting.transitionTime;

        } else if (i >= setting.maxDisplay) {
            if (ranking[i].prev < setting.maxDisplay) { // fade out
                ranking[i].y += ((setting.topOffset + setting.boxHeight * setting.maxDisplay) - ranking[i].y) / setting.transitionTime;
                ranking[i].alpha += (0 - ranking[i].alpha) / setting.transitionTime;
            } else {
                ranking[i].alpha = 0;
            }
        } else {
            ranking[i].y += ((setting.topOffset + setting.boxHeight * i) - ranking[i].y) / setting.transitionTime;
            if (ranking[i].prev < setting.maxDisplay) {
                ranking[i].alpha = 1;
            } else {
                ranking[i].alpha += (1 - ranking[i].alpha) / setting.transitionTime;
            }

        }

        box.innerHTML = " <img src='images/glow/" + ranking[i].job + ".png' >";
        box.innerHTML += "<div class='playerName" + ((i == myRank) ? " me" : "") + "'>" + processName(ranking[i].name) + "</div>" +
            "<br>";

        // writing the damage
        if (ranking[i].dps > 0) {
            box.innerHTML += "<div class='dmg'>" + ranking[i].dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                "</div><br>";
        } else {
            if (ranking[i].dmg > 0) {
                box.innerHTML += "<div class='dmg' style='font-style:italic'>" + ranking[i].dmg + "</div><br>";
            } else {
                box.innerHTML += "<div class='dmg'>&nbsp;</div><br>"
            }
        }

        box.innerHTML += "<div class='newPercent' >" + ranking[i].dmgp + "</div><br>";


        // COLOR SETTING
        var tank = ["Gld", "Gla", "Pld", "Mrd", "War", "Drk", "Gnb"];
        var dps = ["Pgl", "Mnk", "Lnc", "Drg", "Arc", "Brd", "Rog", "Nin", "Acn", "Smn", "Thm", "Blm", "Mch", "Sam", "Rdm", "Blu", "Dnc"];
        var healer = ["Cnj", "Whm", "Sch", "Ast"];

        var maxOpacity = (i == myRank) ? 0.4 : 0.3;
        var minOpacity = (i == myRank) ? 0.1 : 0.0;
        var themeColor = "200,0,200";

        if (healer.indexOf(ranking[i].job) != -1) {
            themeColor = "107,240,86";
        } else if (dps.indexOf(ranking[i].job) != -1) {
            themeColor = "200,3,8";
        } else if (tank.indexOf(ranking[i].job) != -1) {
            themeColor = "41,112,243";
        } else if (ranking[i].job.indexOf("Limit Break") != -1) {
            themeColor = "243,102,8";
        }

        box.style.background = "linear-gradient(rgba(" + themeColor + "," + maxOpacity +
            ((i == myRank) ? "),rgba(" + themeColor + "," : "),rgba(0,0,0,") + minOpacity + "))";
        box.style.border = "1px solid rgba(" + themeColor + ", " + maxOpacity + ")";

        box.style.top = ranking[i].y;
        box.style.opacity = ranking[i].alpha;

        var rank = document.createElement("div");
        rank.className = "rank";
        rank.innerHTML = (i + 1);
        box.appendChild(rank);
        combDiv.appendChild(box);

    }

    // draws flashy effect
    if (setting.flashEnabled && flashFlag && !isLast) {
        flash1 = document.getElementById("flash1");
        flash2 = document.getElementById("flash2");

        flash1.style.top = setting.topOffset + setting.boxHeight * flashPos - 50;
        flash2.style.top = setting.topOffset + setting.boxHeight * flashPos - 50;
        flash1.style.left = -20;


        if (t < 15) {
            flash1.style.opacity = t / 15;
            flash2.style.opacity = t / 15;
            flash2.style.width = 700;
            flash2.style.left = 70 * t - flash2.style.width / 2;
        } else {
            flash1.style.opacity = 1 - (t - 15) / 35;
            flash2.style.opacity = 1 - (t - 15) / 35;
        }

        t++;
        if (t >= 50) {
            flash1.style.opacity = 0;
            flash2.style.opacity = 0;
            t = 0;
            flashFlag = false;
            flashPos = 999;
        }
    }

}


// Miniparse
function parseActFormat(str, dictionary) {
    var result = "";

    var currentIndex = 0;
    do {
        var openBraceIndex = str.indexOf('{', currentIndex);
        if (openBraceIndex < 0) {
            result += str.slice(currentIndex);
            break;
        } else {
            result += str.slice(currentIndex, openBraceIndex);
            var closeBraceIndex = str.indexOf('}', openBraceIndex);
            if (closeBraceIndex < 0) {
                // parse error!
                console.log("parseActFormat: Parse error: missing close-brace for " + openBraceIndex.toString() + ".");
                return "ERROR";
            } else {
                var tag = str.slice(openBraceIndex + 1, closeBraceIndex);
                if (typeof dictionary[tag] !== 'undefined') {
                    result += dictionary[tag];
                } else {
                    console.log("parseActFormat: Unknown tag: " + tag);
                    result += "ERROR";
                }
                currentIndex = closeBraceIndex + 1;
            }
        }
    } while (currentIndex < str.length);

    return result;
}


// Transforms a name into initials
function processName(name) {
    if (name == "YOU") return "YOU";

    if (setting.nameInitials == "last") {
        return name.split(' ')[0];
    } else {
        return name;
    }
}


function updateTest() {
    update(dataset[0]);
    dataset.push(dataset.shift());
}

drawTimer = setInterval("draw()", 1000 / setting.fps);
