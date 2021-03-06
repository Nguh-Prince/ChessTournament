var state = {
    tournaments: []
}

$("#new_tournament_name").on("input", function () {
    number_of_participants = $("#new_tournament_number_of_participants")

    if ($(this).val() && Number(number_of_participants.val()) && isPowerOf2(Number(number_of_participants.val()))) {
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
            $(this).parent().append(createErrorMessage(gettext("This field is required")))

        }
        else {
            $(this).removeClass('is-invalid')
            $(this).addClass('is-valid')
            $(this).parent().children('.invalid-feedback').remove()
        }
        if (!Number(number_of_participants.val()) || !isPowerOf2(Number(number_of_participants.val()))) {
            number_of_participants.addClass('is-invalid')
            number_of_participants.parent().children('.invalid-feedback').remove()
            number_of_participants.parent().append(createErrorMessage(gettext("Must be a number that is a power of 2 e.g 4, 8, 16, etc.")))
        } else {
            number_of_participants.removeClass('is-invalid')
            number_of_participants.addClass('is-valid')
            number_of_participants.parent().children('.invalid-feedback').remove()
        }
    }
})

$("#new_tournament_number_of_participants").on("input", function () {
    tournament_name = $("#new_tournament_name")
    value = Number($(this).val())

    if (value && tournament_name.val() && isPowerOf2(value)) {
        $("#submit_new_tournament").removeClass("disabled")
        $(this).parent().children('.invalid-feedback').remove()
        $(this).removeClass('is-invalid')
        // $(this).addClass('is-invalid')

        tournament_name.parent().children('.invalid-feedback').remove()
        tournament_name.removeClass('is-invalid')
        tournament_name.addClass('is-valid')
    } else {
        $("#submit_new_tournament").addClass("disabled")

        if (!Number($(this).val()) || !isPowerOf2(Number($(this).val()))) {
            $(this).addClass('is-invalid')
            $(this).parent().children('.invalid-feedback').remove()
            $(this).parent().append(createErrorMessage(gettext("Must be a number that is a power of 2 e.g 4, 8, 16, etc.")))
        }
        else {
            $(this).removeClass('is-invalid')
            $(this).addClass('is-valid')
            $(this).parent().children('.invalid-feedback').remove()
        }
        if (!tournament_name.val()) {
            tournament_name.addClass('is-invalid')
            tournament_name.parent().children('.invalid-feedback').remove()
            tournament_name.parent().append(createErrorMessage(gettext("This field is required")))
        } else {
            $(tournament_name).removeClass('is-invalid')
            $(tournament_name).addClass('is-valid')
            $(tournament_name).parent().children('.invalid-feedback').remove()
        }
    }
})

$("#submit_new_tournament").click(async function () {
    if (getCookie("player_id")) {
        let formData = {
            name: $("#new_tournament_name").val(),
            total_number_of_participants: $("#new_tournament_number_of_participants").val(),
            creator: getCookie("player_id"),
            number_of_points_for_win: $("#new_tournament_number_of_points_for_win").val(),
            number_of_points_for_loss: $("#new_tournament_number_of_points_for_loss").val(),
            number_of_points_for_draw: $("#new_tournament_number_of_points_for_draw").val(),
        }

        let validationObjects = [
            {
                selector: '#new_tournament_name',
                required: true,
                type: 'string'
            },
            {
                selector: '#new_tournament_number_of_participants',
                required: true,
                type: 'number'
            }
        ]

        if (validateObjects(validationObjects)) {
            let form = new FormData();
            Object.keys(formData).forEach( (key, index) => {
                form[key] = formData[key]
            } )

            let termFiles = $("#new_tournament_terms").prop('files');
            let imageFiles = $("#new_tournament_image").prop('files');

            await getBase64(termFiles[0], formData, "terms")
            await getBase64(imageFiles[0], formData, "image")

            console.log( JSON.stringify(formData) )
            console.log( formData )
            $.ajax({
                type: "POST",
                url: `/${API_URL}/tournaments/`,
                data: formData,
                headers: {
                    "X-CSRFTOKEN": getCookie("csrftoken")
                },
                success: function (data) {
                    displayMessage(gettext("Tournament added successfully"), ["alert-success", "alert-dismissible"])
                    $(".btn-close").click()
                    loadTournaments()
                },
                error: function (data) {
                    displayMessage(data.responseText)
                    console.log(data.responseText)
                }
            })
        }
    } else {
        $("#show-sign-in-prompt").click()
    }
})

// $("#new_tournament_image").change(function() {
//     console.log("image changing...")
//     readImage(this, '#new_tournament_image_preview')
// })

$(document).ready(function () {
    loadTournaments()
    $("#home_link img").attr('src', ICONS.home.active)
})

function getTournamentDetailLink(tournament_id) {
    return `/home/tournaments/${tournament_id}/`
}

async function addTournamentsToIndexedDB(tournaments) {
    for (let tournament of tournaments) {
        addToStore(tournament.id, tournament, storeNames[1])
    }
}

function loadTournaments() {
    if (getCookie("player_id")) {
        console.log("Player id set")
        $.ajax({
            type: "GET",
            url: `/${API_URL}/players/${getCookie("player_id")}/tournaments/`,
            success: function (data) {
                console.log(data)
                state.tournaments = data

                openDB(addTournamentsToIndexedDB, [data])

                displayTournaments()
            },
            error: function (data) {
                if (data.status == 500) {
                    displayMessage(ERROR_MESSAGES["500"])
                } else if (data.status == 403) {
                    displayMessage(ERROR_MESSAGES["403"])
                } else {
                    displayMessage(data.responseText)
                }

                // load from indexedDB
                getAllItems(storeNames[1]).then( value => {
                    console.log(value)
                    const keys = Object.keys(value);

                    keys.forEach( (key, index) => {
                        state.tournaments.push( value[key] )
                    } )
                } )

                displayTournaments()
            }
        })
    }
}

function displayTournaments() {
    if (state.tournaments.length >= 1) {
        $("#tournaments").html("")
        for (let tournament of state.tournaments) {
            card = createElement('div', ['card', ['col-md-4']])
            if (tournament.image) {
                // create image
                let image = createElement('img', ['card-img-top'], { src: tournament.image, alt: "" })
                $(card).append(image)
            }
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
            let actionButtons = createElement('div', ['container'])
            let link = createElement('a', ['btn', 'btn-primary'], { href: getTournamentDetailLink(tournament.id) })
            link.textContent = gettext("View")
    
            $(cardBody).append(actionButtons)
            $(actionButtons).append(link)
    
            if (tournament["creator"] == getCookie("player_id")) {
                // delete tournament button
                let deleteButton = createElement('button', ['btn', 'btn-danger'], { 'data-bs-target': '#delete-item-prompt', 'data-bs-toggle': 'modal' })
                deleteButton.textContent = gettext("Delete")
                $(actionButtons).append(deleteButton)
    
                $(deleteButton).click(function() {
                    let deleteItemButton = document.getElementById("delete-item-confirmed")
                    deleteItemButton.setAttribute("data-delete-url", `/api/tournaments/${tournament["id"]}/`)
                })
            }
    
            $("#tournaments").append(card)
        }
    }
}

$("#delete-item-confirmed").click(function() {
    console.log("Clicked delete item")
    let url = this.getAttribute("data-delete-url")
    console.log(url)
    if (url) {
        $.ajax({
            url: url,
            type: "DELETE",
            headers: {
                "X-CSRFTOKEN": getCookie("csrftoken")
            },
            success: function(data) {
                displayMessage(gettext("Tournament deleted successfully"), ['alert-success', 'alert-dismissible'])
                loadTournaments()
                loadAllTournaments()
            },
            error: function(data) {
                if (data.status == 500) {
                    displayMessage( ERROR_MESSAGES["500"] )
                } else if (data.status == 403) {
                    displayMessage( ERROR_MESSAGES["403"] )
                } else {
                    displayMessage( data.responseText )
                }
                console.log(data.responseText)
            }
        })
    }
})