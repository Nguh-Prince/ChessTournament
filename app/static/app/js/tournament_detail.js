var state = {
    games: {}
}

let dateTimePicker = new SimplePicker()
let dateTimePicker2 = new SimplePicker()

const TABLE_LAYOUT_OPTION = 1
const BRACKETS_LAYOUT_OPTION = 2

const TABLE_LAYOUT_SELECTOR = "#table-layout"
const BRACKETS_LAYOUT_SELECTOR = "#brackets-layout"

$(document).ready(function () {

    if (getCookie("tournament_id")) {
        $.ajax({
            type: "GET",
            url: `/${API_URL}/tournaments/${getCookie("tournament_id")}/`,
            success: function (data) {
                console.log(data)
                pickLayout(TABLE_LAYOUT_OPTION)
                generateRoundsForDisplay(data['fixtures'])
            },
            error: function(data) {
                console.log(data.responseText)
                console.log(`/${API_URL}/tournaments/${getCookie("tournament_id")}/`)
            }
        })
    }
})

$("#layout-select").change(function() {
    console.log("Select's value: " + this.value)
    pickLayout(this.value)
})

function pickLayout(value) {
    console.log(`Picking layout #${value}`)

    let selectedLayout = ''
    switch( parseFloat(value) ) {
        case TABLE_LAYOUT_OPTION:
            selectedLayout = TABLE_LAYOUT_SELECTOR
            break;
        case BRACKETS_LAYOUT_OPTION:
            selectedLayout = BRACKETS_LAYOUT_SELECTOR
            break;
        default:
            selectedLayout = TABLE_LAYOUT_SELECTOR
            break;
    }
    console.log("Selected layout: " + selectedLayout)
    $("#layout-container>div").css('visibility', 'hidden')
    $(selectedLayout).css('visibility', 'visible')
}

async function generateRoundsForDisplay(fixtures) {
    console.log("Generating rounds for display with fixtures: ")
    console.log(fixtures)
    // contains the different rounds found in the tournament along with the fixtures 
    // for each of those rounds
    let tournamentFixturesObject = {}

    for (let i = 0; i < fixtures.length; i++) {
        let fixture = fixtures[i]
        let fixtureCount = i + 1
        let fixtureObject = {}

        let level_number = fixture.level_number
        if (!(level_number in tournamentFixturesObject)) {
            // add the level_number to the object
            tournamentFixturesObject[level_number] = { "rounds": [], "title": fixture.level }
        }

        for (let i = 0; i < 2; i++) {
            let object = {
                name: `Class${fixtureCount * 2 + i}`, winner: false, ID: `${fixtureCount * 2 + i}`
            }

            if (i in fixture['participants']) {
                // get player details
                player = fixture['participants'][i]
                
                if (player['player'] !== null) {
                    object.name = `${player['player']['first_name']} ${player['player']['last_name']}`
                    object.name += player['player']['classroom'] ? ` - ${player['player']['classroom']}` : ''
                    object.winner = player['is_winner']
                    object.ID = player['player']['id']
                } else {
                    object.name = gettext("Unassigned")
                    object.winner = false
                    object.ID = Math.ceil(Math.random()*500)
                }
            }

            // add player object to the fixture object
            fixtureObject[`player${i + 1}`] = object
        }

        // add the fixtureObject to its round
        tournamentFixturesObject[level_number]["rounds"].push(fixtureObject)
    }

    let titles = []
    let rounds = []

    for (let key in tournamentFixturesObject) {
        titles.push(tournamentFixturesObject[key]["title"])
        rounds.push(tournamentFixturesObject[key]["rounds"])
    }

    let count = 0
    let bracketLevels
    let bracketSelector = ".brackets"

    // the bracketLevels in key 1 represent the brackets that will be printed to the left while those in 2 will be printed to the right of the final fixture
    let bracketsForEachHalf = {
        1: [],
        2: []
    }

    for (let round of rounds.reverse()) {
        count++
        if (round.length >= 2) { // i.e. not the finals
            // create two bracket-levels
            bracketLevels = [createElement('div', ['bracket-level'], { id: `level_${count}_1` }), createElement('div', ['bracket-level'], { id: `level_${count}_2` })]
            bracketsForEachHalf[2].push( bracketLevels[1] )
        } else {
            bracketLevels = [createElement('div', ['bracket-level'], { id: `level_${count}` })]
        }

        bracketsForEachHalf[1].push(bracketLevels[0])

        for (let i = 0; i < round.length; i++) {

            // getting the half of this level that will contain the match details
            let subContainer = round.length >= 2 && i >= (round.length) / 2 ? bracketLevels[1] : bracketLevels[0]
            console.log("Number of fixtures in the round: " + round.length)
            console.log(bracketLevels)
            let fixture = round[i]

            let bracketMatchup = createElement('div', ['bracket-matchup'])
            $(subContainer).append(bracketMatchup)

            for (let key in fixture) {
                let bracketTeam = createElement('div', ['bracket-team', fixture[key]['winner'] ? 'winner' : 'loser'] )
                $(bracketMatchup).append(bracketTeam)

                let bracketName = createElement('div', ['bracket-name'])
                bracketName.textContent = fixture[key]['name']
                $(bracketTeam).append(bracketName)
            }
        }
    }

    // append all the bracketLevels in bracketsForEachHalf[1] before those of bracketsForEachHalf[2]
    for (let key in bracketsForEachHalf) {
        for (let level of key == 1 ? bracketsForEachHalf[key] : bracketsForEachHalf[key].reverse() ) {
            $(bracketSelector).append(level)
        }
    }

    return tournamentFixturesObject
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
            url: `/${API_URL}/tournamentplayers/${tournamentPlayerId}/`,
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
                    displayMessage(gettext("Player enrolled successfully"), ["alert-success", "alert-dismissible"])
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
            $(this).append(createElement('option', [], { value: '' }))
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

$("#new_game_datetime_formatted").click(function () {
    let currentDate = new Date()
    dateTimePicker.reset(currentDate)
    dateTimePicker.open()

    dateTimePicker.on('submit', function (date, readableDate) {
        let dt = DateTime.fromJSDate(date)
        $("#new_game_datetime").val(dt.toISO())
        $("#new_game_datetime_formatted").val(dt.setLocale(LOCALE).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY))
    })

    dateTimePicker.on('close', function () {
        let dt = DateTime.fromJSDate(currentDate)
        $("#new_game_datetime").val(dt.toISO())
        $("#new_game_datetime_formatted").val(dt.setLocale(LOCALE).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY))
    })
})

function reloadPage() {
    location.reload()
}

$('.score').change(function () {
    let value = Number.parseFloat(($(this).val()))

    let opponentScore = $($(this).attr('data-opponent-score'))

    if (value == TOURNAMENT_WIN) {
        opponentScore.val(TOURNAMENT_LOSS.toFixed(1))
    }
    else if (value == TOURNAMENT_LOSS) {
        opponentScore.val(TOURNAMENT_WIN.toFixed(1))
    } else if (value == TOURNAMENT_DRAW) {
        opponentScore.val(TOURNAMENT_DRAW.toFixed(1))
    }
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
                is_home: selector == "#new_game_white" ? true : false,
                score: $(`${selector}_score`).val()
            }

            let validationObjects = [
                {
                    selector: selector,
                    type: 'number',
                    different: selector == "#new_game_white" ? "#new_game_black" : "#new_game_white"
                },
                {
                    selector: `${selector}_score`,
                    type: 'number',
                    requiredIf: $(`${selector}`).val()
                }
            ]

            if (validateObjects(validationObjects)) {
                formData.players.push(object)
            }
        }

        if (validateObjects(validationObjects)) {
            $.ajax({
                url: `/${API_URL}/tournaments/${tournamentId}/games/`,
                type: "POST",
                headers: {
                    "X-CSRFTOKEN": getCookie("csrftoken")
                },
                data: JSON.stringify(formData),
                encode: true,
                contentType: "application/json",
                success: function (data) {
                    displayMessage(gettext("Game added successfully"), ['alert-success', 'alert-dismissible'])
                    setTimeout(reloadPage, 15000)
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

function showGameDetail(gameId) {
    if (gameId) {
        if (!(gameId in state.games)) {
            $.ajax({
                type: "GET",
                url: `/${API_URL}/games/${gameId}/`,
                success: function (data) {
                    state.games[`${gameId}`] = data
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
    $("#game_detail .modal-header").text(gameObject["__str__"])

    $("#game_classroom").val(gameObject["classroom"])

    $("#game_datetime").val(gameObject["time"])

    $("#game_datetime_formatted").val(getLocaleTime(gameObject["time"]))

    $("#game_minutes_per_player").val(gameObject["minutes_per_player"])

    for (let player of gameObject["players"]) {
        player["is_home"] ? $("#game_white").val(player["playerfixture"]) : $("#game_black").val(player["playerfixture"])
    }
}

function populateFixtureModal(fixtureObject) {
    $("#fixture_detail .modal-header").text(fixtureObject["__str__"])
    let input

    if (fixtureObject["winner"]) {
        // add an input
        input = createElement('input', ['form-control'], {'readonly': true})
    } else {
        // add a select
        input = createElement('select', ['form-control', 'select'])
        let option = createElement('option', [], {value: ""})
        option.textContent = "---"

        $(input).append( createElement('option', [], {value: optionObjects.value}) )
        for (let item of fixtureObject["participants"]) {
            // option = createElement('option', [], {value: })
        }
    }
}

$("#game_datetime_formatted").click(function () {
    let currentDate = new Date()
    dateTimePicker2.reset(currentDate)
    dateTimePicker2.open()

    dateTimePicker2.on('submit', function (date, readableDate) {
        let dt = DateTime.fromJSDate(date)
        $("#game_datetime").val(dt.toISO())
        $("#game_datetime_formatted").val(dt.setLocale(LOCALE).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY))
    })

    dateTimePicker2.on('close', function () {
        let dt = DateTime.fromJSDate(currentDate)
        $("#game_datetime").val(dt.toISO())
        $("#game_datetime_formatted").val(dt.setLocale(LOCALE).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY))
    })
})

$("#edit-game").click(function () {
    let gameId = $("#game_id").val()

    if (gameId) {
        let formData = {
            classroom: $("#game_classroom").val(),
            time: $("#game_datetime").val(),
            minutes_per_player: $("#game_minutes_per_player").val(),
            fixture: $("#game_fixture").val(),
            id: gameId,
            players: []
        }
        let validationObjects = [
            {
                selector: "#game_classroom",
                required: true,
                type: 'string'
            },
            {
                selector: "#game_datetime",
                required: true,
                type: 'date'
            },
            {
                selector: "#game_minutes_per_player",
                required: true,
                type: 'number'
            },
            {
                selector: "#game_fixture",
                required: true,
                type: 'number'
            }
        ]

        $("#game_detail .player>select").each(function () {
            if ($(this).val()) {
                let id = $(this).attr('id')
                formData.players.push({
                    playerfixture: $(this).val(),
                    is_home: id == "game_white",
                    score: $(`#${id}_score`).val()
                })

                validationObjects.push({
                    selector: id,
                    different: id == "#game_white" ? "#game_black" : "#game_white"
                })
            }
        })

        if (validateObjects(validationObjects)) {
            $.ajax({
                type: "PUT",
                url: `/${API_URL}/games/${gameId}/`,
                headers: {
                    "X-CSRFTOKEN": getCookie("csrftoken")
                },
                data: JSON.stringify(formData),
                contentType: "application/json",
                success: function (data) {
                    displayMessage(gettext("Game updated successfully"), ["alert-success", "alert-dismissible"])
                    setTimeout(reloadPage, 5000)
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
        }
    }
})

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
        $(this).append(createElement('option', [], { value: '' }))
        for (let object of playerObjects) {
            let option = createElement('option', [], { value: object.id })
            option.textContent = object.name
            $(this).append(option)
        }
    })

    $("#game_id").val($(this).attr('data-game-id'))
    $("#game_fixture").val($(this).attr('data-fixture-id'))
})

$('.trigger-finish-fixture').click(function () {
    $("#finish-fixture .finish-fixture").attr('data-fixture-id', $(this).attr('data-fixture-id'))
    $("#finish-fixture .finish-fixture").attr('data-winner-selector', $(this).attr('data-winner-selector'))
})

$("#finish-fixture .btn-close").click(function () {
    $("#finish-fixture .finish-fixture").attr('data-fixture-id') = ''
    $("#finish-fixture .finish-fixture").attr('data-winner-selector') = ''
})

$(".finish-fixture").click(function () {
    let fixtureId = $(this).attr('data-fixture-id')
    let winnerSelector = $($(this).attr('data-winner-selector'))

    playerFixtureId = winnerSelector.val()

    if (fixtureId && playerFixtureId) {
        $.ajax({
            type: "PATCH",
            url: `/${API_URL}/playerfixtures/${playerFixtureId}/`,
            data: JSON.stringify({ is_winner: true }),
            headers: {
                "X-CSRFTOKEN": getCookie("csrftoken")
            },
            contentType: "application/json",
            success: function () {
                displayMessage(gettext("Winner set successfully"), ['alert-success', 'alert-dismissible'])
                // set fixture to finished
                $.ajax({
                    type: "PATCH",
                    url: `/${API_URL}/fixtures/${fixtureId}/`,
                    data: JSON.stringify({ finished: true }),
                    headers: {
                        "X-CSRFTOKEN": getCookie("csrftoken")
                    },
                    contentType: "application/json",
                    success: function (data) {
                        displayMessage(gettext("Fixture successfully modified"), ['alert-success', 'alert-dismissible'])
                        location.reload()
                    },
                    error: function (data) {
                        displayMessage(gettext("Error modifying fixture"))
                        if (data.status == 500) {
                            displayMessage(ERROR_MESSAGES["500"])
                        } else if (data.status == 403) {
                            displayMessage(ERROR_MESSAGES["403"])
                        } else {
                            displayMessage(data.responseText)
                        }
                    }
                })
            },
            error: function (data) {
                displayMessage(gettext("Error setting winner"))
                if (data.status == 500) {
                    displayMessage(ERROR_MESSAGES["500"])
                } else if (data.status == 403) {
                    displayMessage(ERROR_MESSAGES["403"])
                } else {
                    displayMessage(data.responseText)
                }
            }
        })
    }
    else if (!playerFixtureId) {
        winnerSelector.parent().addClass('has-error')
        winnerSelector.parent().append(createHelpBlock(gettext("Select a winner before finishing the game")))
    }
})