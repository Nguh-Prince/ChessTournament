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

$(".add-game").click(function() {
    let fixtureId = $(this).attr('data-fixture-id')
    $("#new_game_fixture").val(fixtureId)
})

$("#add-game").click(function() {
    addGameToFixture($("#new_game_fixture").val())
})

function addGameToFixture(fixtureId) {
    if (fixtureId) {
        let formData = {
            classroom: $("#new_game_classroom").val(),
            date: $("#new_game_date").val(),
            period: $("#new_game_period").val(),
            number: $("#new_game_number").val(),
            fixture: fixtureId
        }
        $.ajax({
            type: "POST",
            headers: {
                "X-CSRFTOKEN": getCookie("csrftoken")
            },
            data: formData,
            encode: true,
            success: function(data) {
                displayMessage(gettext("Game added successfully"), ['alert-success', 'alert-dismissible'])
                setTimeout(location.reload, 15000)
            },
            error: function(data) {
                if (data.status == 500) {
                    displayMessage ( ERROR_MESSAGES["500"] )
                }
                else if (data.status == 403) {
                    displayMessage ( ERROR_MESSAGES["403"] )
                }
                else {
                    displayMessage( data.responseText )
                }
            }
        })
    }
}