var state = {
    tournaments: []
}

$("#new_tournament_name").on("input", function () {
    number_of_participants = $("#new_tournament_number_of_participants")

    if ( $(this).val() && Number(number_of_participants.val()) && isPowerOf2( Number( number_of_participants.val() ) ) ) {
        $("#submit_new_tournament").removeClass("disabled")
        $(this).parent().children('.invalid-feedback').remove()
        $(this).removeClass('is-invalid')
        $(this).addClass('is-invalid')

        number_of_participants.parent().children('.invalid-feedback').remove()
        number_of_participants.removeClass('is-invalid')
        number_of_participants.addClass('is-valid')
    } else {
        $("#submit_new_tournament").addClass("disabled")

        if (!$(this).val()) {
            $(this).addClass('is-invalid')
            $(this).parent().children('.invalid-feedback').remove()
            $(this).parent().append(createErrorMessage( gettext("This field is required") ))

        }  
        else {
            $(this).removeClass('is-invalid')
            $(this).addClass('is-valid')
            $(this).parent().children('.invalid-feedback').remove()
        }
        if (!Number( number_of_participants.val() ) || !isPowerOf2( Number( number_of_participants.val() ) ) ) {
            number_of_participants.addClass('is-invalid')
            number_of_participants.parent().children('.invalid-feedback').remove()
            number_of_participants.parent().append( createErrorMessage( gettext("Must be a number that is a power of 2 e.g 4, 8, 16, etc.") ) )
        } else {
            number_of_participants.removeClass('is-invalid')
            number_of_participants.addClass('is-valid')
            number_of_participants.parent().children('.invalid-feedback').remove()
        }
    }
})

$("#new_tournament_number_of_participants").on("input", function () {
    tournament_name = $("#new_tournament_name")
    value = Number( $(this).val() )

    if ( value && tournament_name.val() && isPowerOf2(value) ) {
        $("#submit_new_tournament").removeClass("disabled")
        $(this).parent().children('.invalid-feedback').remove()
        $(this).removeClass('is-invalid')
        $(this).addClass('is-invalid')
        
        tournament_name.parent().children('.invalid-feedback').remove()
        tournament_name.removeClass('is-invalid')
        tournament_name.addClass('is-valid')
    } else {
        $("#submit_new_tournament").addClass("disabled")

        if (!Number( $(this).val() ) || !isPowerOf2( Number( $(this).val() ) ) ) {
            $(this).addClass('is-invalid')
            $(this).parent().children('.invalid-feedback').remove()
            $(this).parent().append(createErrorMessage( gettext("Must be a number that is a power of 2 e.g 4, 8, 16, etc.") ))
        }  
        else {
            $(this).removeClass('is-invalid')
            $(this).addClass('is-valid')
            $(this).parent().children('.invalid-feedback').remove()
        }
        if (!tournament_name.val() ) {
            tournament_name.addClass('is-invalid')
            tournament_name.parent().children('.invalid-feedback').remove()
            tournament_name.parent().append( createErrorMessage( gettext("This field is required") ) )
        } else {
            $(tournament_name).removeClass('is-invalid')
            $(tournament_name).addClass('is-valid')
            $(tournament_name).parent().children('.invalid-feedback').remove()
        }
    }
})

$("#submit_new_tournament").click(function() {
    formData = {
        name: $("#new_tournament_name").val(),
        total_number_of_participants: $("#new_tournament_number_of_participants").val(),
        creator: getCookie("player_id")
    }

    $.ajax({
        type: "POST",
        url: `${API_URL}/tournaments/`,
        data: formData,
        headers: {
            "X-CSRFTOKEN": getCookie("csrftoken")
        }, 
        success: function(data) {
            displayMessage(gettext("Tournament added successfully"), ["alert-success", "alert-dismissible"])
            $(".btn-close").click()
        },
        error: function(data) {
            displayMessage( data.responseText )
            console.log(data.responseText)
        }
    })
})

$(document).ready(function() {
    loadTournaments()
})

function getTournamentDetailLink(tournament_id) {
    return `/tournaments/${tournament_id}/`
}

function loadTournaments() {
    $.ajax({
        type: "GET",
        url: `${API_URL}/players/${getCookie("player_id")}/tournaments/`,
        success: function(data) {
            $("#tournaments").html('')
            state.tournaments = data

            for (let tournament of state.tournaments) {
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

                let link = createElement('a', ['btn', 'btn-primary'], {href: getTournamentDetailLink(tournament.id)})
                link.textContent = gettext("View")
                $(cardBody).append(link)

                $("#tournaments").append(card)
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