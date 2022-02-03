class Node {
    constructor(data) {
        this.data = data;
        this.left = null;
        this.right = null;
    }
}

class Player {
    constructor(name, username, number) {
        this.name = name
        this.username = username
        this.number = number
    }
}

class Tree {
    constructor() {
        this.root = null
    }
}

function modifyTournamentPlayer(tournamentPlayerId, kickOut=false, enroll=true) {
    if (kickOut && !enroll) {
        alert( gettext("You cannot kickout a player that has not been enrolled") )
    }
    else if (!kickOut && !enroll) {
        alert( gettext("enroll or kickout must be set to true") )
    }
    else if (tournamentPlayerId) {
        $.ajax({
            type: "PATCH",
            url: `${API_URL}/tournamentplayers/${tournamentPlayerId}/`,
            contentType: "application/json",
            data: JSON.stringify({
                kicked_out: kickOut,
                participating: enroll
            }),
            headers: {
                "X-CSRFTOKEN": getCookie("csrftoken")
            },
            success: function(data) {
                if (kickOut) {
                    displayMessage( gettext("Player kicked out successfully"), ["alert-success", "alert-dismissible"] )
                } else if (enroll) {
                    displayMessage( gettext("Player kicked out successfully"), ["alert-success", "alert-dismissible"] )
                }
            }
        })
    }
}

function kickOut(tournamentPlayerId) {
    modifyTournamentPlayer(tournamentPlayerId, true)
}

function enroll(tournamentPlayerId) {
    modifyTournamentPlayer(tournamentPlayerId, false, true)
}