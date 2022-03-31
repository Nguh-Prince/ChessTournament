var state = {
    tournaments: [],
    allTournaments: []
}

function loadAllTournaments() {
    $.ajax({
        type: "GET",
        url: `/${API_URL}/tournaments/`,
        success: function (data) {
            $("#all-tournaments").html('')

            state.allTournaments = data

            console.log("Displaying all tournaments")
            displayAllTournaments(state.allTournaments)
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

function displayAllTournaments(tournamentsList) {
    $("#all-tournaments").html('')

    for (let tournament of tournamentsList) {
        card = createElement('div', ['card', ['col-md-4']])
        cardBody = createElement('div', ['card-body'])
        $(card).append(cardBody)

        cardTitle = createElement('div', ['card-title'])
        $(cardBody).append(cardTitle)
        cardTitle.textContent = tournament["name"]

        texts = [`Created by <strong>${tournament["creator_details"]["first_name"]} ${tournament["creator_details"]["last_name"]}</strong>`, `Created on <strong>${getLocaleTime(tournament["time_created"])}</strong>`]

        for (let text of texts) {
            p = createElement('p', ['card-title'])
            p.innerHTML = text
            $(cardBody).append(p)
        }
        let buttonConatiner = createElement('div', ['container', 'gy-5'])
        let link = createElement('a', ['btn', 'btn-primary'], { href: `${tournament['id']}/` })

        $(cardBody).append(buttonConatiner)
        $(buttonConatiner).append(link)

        link.textContent = gettext("View")

        let playerId = getCookie("player_id")
        let flag = false
        let participating = false
        console.log(playerId)
        if (playerId) { // check if this player is enrolled in this tournament
            for (let participant of tournament.participants) {
                if (participant["player"]["id"] == playerId) {
                    flag = true
                    participating = participant['participating']
                }
            }
        }

        if (!playerId || !flag) { // show enroll button
            let button = playerId ? createElement('button', ['btn', 'btn-primary'], {'data-bs-toggle': 'modal', 'data-bs-target': '#accept-notifications'}) : createElement('button', ['btn', 'btn-primary'])
            button.textContent = gettext("Enroll")
            $(cardBody).append(button)

            $(button).click(function () {
                console.log("Clicked enroll button")
                if (!playerId) {
                    // show sign in prompt
                    $("#show-sign-in-prompt").click()
                } else {
                    console.log("You're logged in")
                    // get the terms and conditions, parse it and put it in the appropriate container
                    if (tournament['terms']) {
                        $("#terms-and-conditions-parent").removeClass('hide')
                        $.ajax({
                            type: "GET",
                            url: tournament["terms"],
                            success: function(data) {
                                console.log(data)
                                console.log(parseMd(data))
                                $("#terms-and-conditions-container").html(parseMd(data))
                            },
                            error: function(data) {
                                console.log(data.responseText)
                                switch(data.status) {
                                    case 400:
                                        displayMessage( data.responseText )
                                        break;
                                    case 403:
                                        displayMessage( ERROR_MESSAGES["403"] )
                                        break;
                                    case 500:
                                        displayMessage( ERROR_MESSAGES["500"] )
                                        break;
                                    default:
                                        displayMessage( `Error occured, code: ${data.status}` )
                                        break;
                                }
                            }
                        })
                    } else {
                        $("#terms-and-conditions-parent").addClass('hide')
                    }
                }
            })

            $(buttonConatiner).append(button)
        }

        else if (!participating) {
            // enrolled but not participating
            let button = createElement('button', ['btn', 'btn-outline-danger'])
            button.textContent = gettext("Pending")

            $(buttonConatiner).append(button)
        }

        $("#all-tournaments").append(card)
    }
}

$(document).ready(function () {
    loadTournaments()
    loadAllTournaments()
    $("#tournaments_link img").attr('src', ICONS.tournaments.active)
})

$("#tournament-search").on('input', function() {
    let value = $.trim(this.value).toUpperCase();

    displayAllTournaments( value ? state.allTournaments.filter( (tournament) => {
        return tournament.name.toUpperCase().includes(value) || tournament.creator_details.name.toUpperCase().includes(value)
    } ) : state.allTournaments )
})

$("#accept-notifications-checkbox").change(function() {
    if ($(this).prop('checked')) {
        if (!("Notification" in window) ) {
            alert( gettext("Your browser does not support notifications") )
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission == "granted") {
                    console.log("Permission granted");
                }
            })
        }
    }
})