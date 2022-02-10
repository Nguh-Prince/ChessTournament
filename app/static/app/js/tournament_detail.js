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

function modifyTournamentPlayer(tournamentPlayerId, kickOut = false, enroll = true) {
    if (kickOut && !enroll) {
        alert(gettext("You cannot kickout a player that has not been enrolled"))
    }
    else if (!kickOut && !enroll) {
        alert(gettext("enroll or kickout must be set to true"))
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
            success: function (data) {
                if (kickOut) {
                    displayMessage(gettext("Player kicked out successfully"), ["alert-success", "alert-dismissible"])
                } else if (enroll) {
                    displayMessage(gettext("Player kicked out successfully"), ["alert-success", "alert-dismissible"])
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

$(".add-game").click(function () {
    let fixtureId = $(this).attr('data-fixture-id')
    cell = $(this).parent()
    let playerObjects = []

    cell.children('.player').each(function () {
        let object = {
            id: $(this).attr('id'),
            name: $(this).val()
        }
        playerObjects.push(object)
    })

    if (playerObjects.length == 2) {
        $("#new_game .player").css('visibility', 'visible')
        $("#new_game .player>select").each(function () {
            $(this).html('')
            for (let object of playerObjects) {
                let option = createElement('option', [], { value: object.id })
                option.textContent = object.name
                $(this).append(option)
            }
        })
    } else {
        $("#new_game .player").css('visibility', 'hidden')
    }

    $("#new_game_fixture").val(fixtureId)
})

$("#add-game").click(function () {
    addGameToFixture($("#new_game_fixture").val(), $("#tournament_id").val())
})

function addGameToFixture(fixtureId, tournamentId) {
    if (fixtureId && tournamentId) {
        let formData = {
            classroom: $("#new_game_classroom").val(),
            time: $("#new_game_datetime").val(),
            fixture: fixtureId,
            players: []
        }
        let validationObjects = [
            {
                selector: $("#new_game_datetime"),
                type: 'string',
                required: true
            },
            {
                selector: $("#new_game_classroom"),
                type: 'string',
                required: true
            }
        ]

        let selectors = ["#white", "#black"]
        for (let selector of selectors) {
            let object = {
                playerfixture: $(`${selector}`).val(),
                is_home: selector == "#white" ? true : false
            }

            let validationObject = {
                selector: selector,
                type: 'number',
                required: true,
                different: selector == "#white" ? "#black" : "#white"
            }

            if (validateObject(validationObject)) {
                formData.players.push(object)
            }
        }

        if (validateObjects(validationObjects)) {
            $.ajax({
                url: `${API_URL}/tournaments/${tournamentId}/games/`,
                type: "POST",
                headers: {
                    "X-CSRFTOKEN": getCookie("csrftoken")
                },
                data: JSON.stringify(formData),
                encode: true,
                contentType: "application/json",
                success: function (data) {
                    console.log(data)
                    displayMessage(gettext("Game added successfully"), ['alert-success', 'alert-dismissible'])
                    setTimeout(location.reload, 15000)
                },
                error: function (data) {
                    if (data.status == 500) {
                        displayMessage(ERROR_MESSAGES["500"])
                    }
                    else if (data.status == 403) {
                        displayMessage(ERROR_MESSAGES["403"])
                    }
                    else {
                        displayMessage(data.responseText)
                    }
                }
            })
        }
    }
}

