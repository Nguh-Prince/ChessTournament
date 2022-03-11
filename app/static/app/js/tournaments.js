var state = {
    tournaments: [],
    allTournaments: []
}

function loadAllTournaments() {
    $.ajax({
        type: "GET",
        url: `http://localhost:8000/${API_URL}/tournaments/`,
        success: function(data) {
            $("#all-tournaments").html('')
            
            state.allTournaments = data

            for (let tournament of state.allTournaments) {
                card = createElement('div', ['card', ['col-md-4']])
                cardBody = createElement('div', ['card-body'])
                $(card).append(cardBody)

                cardTitle = createElement('div', ['card-title'])
                $(cardBody).append(cardTitle)
                cardTitle.textContent = tournament["name"]

                texts = [`Created by <strong>${tournament["creator_details"]["first_name"]} ${tournament["creator_details"]["last_name"]}</strong>`, `Created on <strong>${ getLocaleTime(tournament["time_created"]) }</strong>`]

                for (let text of texts) {
                    p = createElement('p', ['card-title'])
                    p.innerHTML = text
                    $(cardBody).append(p)
                }
                let buttonConatiner = createElement('div', ['container', 'gy-5'])
                let link = createElement('a', ['btn', 'btn-primary'], {href: `${tournament['id']}/`})

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
                    let button = createElement('button', ['btn', 'btn-primary'])
                    button.textContent = gettext("Enroll")
                    $(cardBody).append(button)

                    $(button).click(function() {
                        if (!playerId) {
                            // show sign in prompt
                            $("#show-sign-in-prompt").click()
                        } else {
                            $.ajax({
                                type: "POST",
                                url: `http://localhost:8000/${API_URL}/tournaments/enroll/`,
                                data: {
                                    player: getCookie("player_id"),
                                    tournament: tournament["id"]
                                },
                                headers: {
                                    "X-CSRFTOKEN": getCookie("csrftoken")
                                }, 
                                success: function() {
                                    displayMessage( gettext("You have been enrolled successfully. Awaiting verification from the tournament's creator.", ['alert-success', 'alert-dismissible']) )
                                    loadAllTournaments()
                                },
                                error: function(data) {
                                    if (data.status == 500) {
                                        displayMessage(ERROR_MESSAGES["500"])
                                    } else if (data.status == 403) {
                                        displayMessage(ERROR_MESSAGES["403"])
                                    } else {
                                        displayMessage( data.responseText )
                                    }
                                    console.log(data.responseText)
                                }
                            })
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
        }, 
        error: function(data) {
            if (data.status == 500) {
                displayMessage( ERROR_MESSAGES["500"] )
            } else if (data.status == 403) {
                displayMessage( ERROR_MESSAGES["403"] )
            } else {
                displayMessage( data.responseText )
            }
        }
    })
}

$(document).ready(function() {
    loadTournaments()
    loadAllTournaments()
    $("#tournaments_link img").attr('src', ICONS.tournaments.active)
})