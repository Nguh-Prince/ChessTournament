var state = {
    tournaments: [],
    allTournaments: []
}

function loadAllTournaments() {
    $.ajax({
        type: "GET",
        url: `${API_URL}/tournaments/`,
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
                let link = createElement('a', ['btn', 'btn-primary'], {href: `${tournament['id']}/`})
                link.textContent = gettext("View")
                $(cardBody).append(link)

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
})