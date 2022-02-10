var state = {
    games: {}
}

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
            minutes_per_player: $("#new_game_minutes_per_player").val(),
            players: []
        }
        let validationObjects = [
            {
                selector: "#new_game_datetime",
                type: 'string',
                required: true
            },
            {
                selector: "#new_game_classroom",
                type: 'string',
                required: true
            },
            {
                selector: "#new_game_minutes_per_player",
                type: 'number',
                required: true
            }
        ]

        let selectors = ["#new_game_white", "#new_game_black"]
        for (let selector of selectors) {
            let object = {
                playerfixture: $(`${selector}`).val(),
                is_home: selector == "#new_game_white" ? true : false
            }

            let validationObject = {
                selector: selector,
                type: 'number',
                required: true,
                different: selector == "#new_game_white" ? "#blnew_game_ack" : "#new_game_white"
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
                    console.log(JSON.stringify(formData))
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

function showGameDetail(gameId) {
    if (gameId) {
        if (!(gameId in state.games)) {
            $.ajax({
                type: "GET",
                url: `${API_URL}/games/${gameId}/`,
                success: function (data) {
                    state.games['gameId'] = data
                    populateGameModal(data)
                },
                error: function (data) {
                    if (data.status == 500) {
                        displayMessage(ERROR_MESSAGES["500"])
                    } else if (data.status == 403) {
                        displayMessage(ERROR_MESSAGES["403"])
                    } else {
                        displayMessage(data.responseText)
                    }
                }
            })

        } else {
            let game = state.games[gameId]
            populateGameModal(game)
        }
    }
}

function populateGameModal(gameObject) {
    console.log(gameObject)
    $("#game_detail .modal-header").text(gameObject["__str__"])

    $("#game_classroom").val(gameObject["classroom"])

    $("#game_datetime").val(gameObject["time"])

    $("#game_minutes_per_player").val(gameObject["minutes_per_player"])

    for (player in gameObject["players"]) {
        player["is_home"] ? $("#game_white").val(player["playerfixture"]) : $("#game_black").val(player["playerfixture"])
    }
}

$(".display-game").click(function () {
    let cell = $(this).parent()
    let playerObjects = []

    cell.children('input.player').each(function () {
        playerObjects.push({
            id: $(this).attr('id'),
            name: $(this).val()
        })
    })

    $("#game_detail .player>select").each(function () {
        $(this).html('')
        for (let object of playerObjects) {
            let option = createElement('option', [], { value: object.id })
            option.textContent = object.name
            $(this).append(option)
        }
    })

    $("#game_id").val( $(this).attr('data-game-id') )
})
