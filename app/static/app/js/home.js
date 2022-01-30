$("#new_tournament_name").on("input", function () {
    number_of_participants = $("#new_tournament_number_of_participants")

    console.log($(this).val(), number_of_participants.val())
    if ( $(this).val() && number_of_participants.val() && Number( number_of_participants.val() ) ) {
        $("#submit_new_tournament").removeClass("disabled")
    } else {
        $("#submit_new_tournament").addClass("disabled")
    }
})
$("#new_tournament_number_of_participants").on("input", function () {
    tournament_name = $("#new_tournament_name")

    console.log($(this).val(), tournament_name.val())
    if ( $(this).val() && tournament_name.val() && Number( $(this).val() ) ) {
        $("#submit_new_tournament").removeClass("disabled")
    } else {
        $("#submit_new_tournament").addClass("disabled")
    }
})

$("#submit_new_tournament").click(function() {
    formData = {
        name: $("#new_tournament_name").val(),
        number_of_participants: $("#new_tournament_number_of_participants").val()
    }

    $.ajax({
        type: POST,
        url: `${API_URL}/tournaments/`,
        headers: {
            "X-CSRFTOKEN": getCookie("csrftoken")
        }, 
        success: function(data) {
            displayMessage(gettext("Tournament added successfully"), ["alert-success", "alert-dismissible"])
        },
        error: function(data) {
            displayMessage( data.responseText )
        }
    })
})

