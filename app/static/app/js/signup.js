var SECTION = 0
var NUMBER_OF_SECTIONS = $(".section").length

$(document).ready(function () {
    console.log("Doc is ready...")
})

var state = {}
// reveal/hide password
$(".fa-eye").click(function () {
    let inputSelector = $(this).parent().parent().children('input').first()
    console.log(inputSelector)

    if (inputSelector.val()) {
        if (inputSelector.attr('type') == 'password') {
            inputSelector[0].type = "text";
        } else {
            inputSelector[0].type = "password";
        }
    }
})

THE_PASSWORDS_DO_NOT_MATCH = gettext("The two passwords do not match")

$("#personal-info input, #personal-info select").on("input", function () {
    console.log("Inputting personal info")
    let flag = true
    // removing previous errors if any
    $(this).removeClass('is-invalid').addClass('is-valid')
    $(this).parent().remove('.is-invalid')

    $(this).parent().children('input.required, select.required').each(function () {
        // removing previous errors if any
        $(this).removeClass('is-invalid').addClass('is-valid')
        $(this).parent().remove('.is-invalid')

        if (!$(this).val()) {
            // append a warning to the container
            $(this).addClass('is-invalid')
            let feedback = createElement('div', ['invalid-feedback'])
            feedback.textContent = gettext("This field is required")
            $(this).parent().append(feedback)
            flag = false
        } else {
            $(this).addClass('is-valid')
        }
    })

    flag = validateUnique($(this)) ? flag : false

    if (flag) {
        // remove the disabled class from the Next button
        $("#next").removeClass("disabled").removeClass("hide")
    } else {
        $("#next").addClass("disabled")
    }
})

$("#user-info input, #user-info select").on("input", function () {
    let flag = true
    // removing previous errors if any
    $(this).removeClass('is-invalid').addClass('is-valid')
    $(this).parent().remove('.is-invalid')
    $(this).parent().children('input.required, select.required').each(function () {
        // removing previous errors if any
        $(this).removeClass('is-invalid').addClass('is-valid')
        $(this).parent().remove('.is-invalid')

        if (!$(this).val()) {
            // append a warning to the container
            $(this).addClass('is-invalid')
            let feedback = createElement('div', ['invalid-feedback'])
            feedback.textContent = gettext("This field is required")
            $(this).parent().append(feedback)
            flag = false
        } else {
            $(this).addClass('is-valid')
        }
    })

    flag = validateUnique($(this)) ? flag : false

    if ($(this).attr('name') === 'confirm-password') {
        flag = validateValueEquals($("#password").val(), $(this)) ? flag : false
        $(this).parent().remove('.invalid-feedback')
        $("#password").removeClass("is-invalid")
        
        if (!flag) {
            $("#password").addClass("is-invalid")
            let feedback = createElement('div', ['invalid-feedback'])
            feedback.textContent = THE_PASSWORDS_DO_NOT_MATCH
            $(this).parent().append(feedback)
        }
    }

    flag ? $("#submit").removeClass('disabled') : flag
})

var CARD_TITLES = [ gettext("Personal information"), gettext("User information"), gettext("Profile image") ]

$("#next").click(function () {
    console.log("Clicked next button")
    $("#personal-info").addClass('hide')
    $("#previous").removeClass("hide").removeClass("disabled")
    SECTION = ++SECTION % NUMBER_OF_SECTIONS
   
    $(".section").addClass('hide')
    $(`.section-${SECTION}`).removeClass('hide')

    if (SECTION == NUMBER_OF_SECTIONS - 1) {
        $(this).addClass('hide')
        $(".submit").removeClass("hide").removeClass("disabled")
    }

    $("#card-title").text(CARD_TITLES[SECTION])
})

$("#previous").click(function () {
    SECTION -= 1
    $("#submit").addClass("hide")
    $("#next").removeClass('hide')
    $(".section").addClass("hide")
    $(`.section-${SECTION}`).removeClass('hide')

    if (SECTION == 0) {
        $(this).addClass("hide")
    } else {
        console.log(SECTION)
    }

    $("#card-title").text(CARD_TITLES[SECTION])
})

function validateUnique(jquerySelector) {
    let flag = true
    if (jquerySelector.val()) {
        jquerySelector.removeClass("is-invalid")
        jquerySelector.parent().children(".invalid-feedback").remove()

        console.log("Input has a value")
        console.log(jquerySelector.attr("name"))
        if (["phone", 'telegram_username', 'username'].includes(jquerySelector.attr("name"))) {
            console.log("It is a unique attribute")
            let queryField
            switch (jquerySelector.attr('name')) {
                case "phone":
                    queryField = "phone"
                    break;
                case "username":
                    queryField = "username"
                    break;
                case 'telegram-username':
                    queryField = "telegram_username"
                    break;
                case 'email':
                    queryField = "email"
                    break;
            }
            console.log(queryField)
            console.log(jquerySelector.val())

            $.ajax({
                type: "POST",
                url: `http://${getServerHostAndPort()}/signup/check/`,
                data: {
                    field: queryField,
                    value: jquerySelector.val()
                },
                headers: {
                    "X-CSRFTOKEN": getCookie("csrftoken")
                },
                success: function(data) {
                    console.log("Field is unique")
                },
                error: function(data) {
                    if (data.status == 400) {
                        console.log(data.responseText)
                        text = JSON.parse(data.responseText)["error"]
                        
                        let feedback = createElement('div', ['invalid-feedback'])

                        feedback.textContent = text
                        console.log(text)

                        jquerySelector.parent().append(feedback)
                        jquerySelector.addClass('is-invalid')
                    }
                    flag = false
                }
            })
        }
    }

    return flag
}

function validateValueEquals(value, jquerySelector, message = gettext(THE_PASSWORDS_DO_NOT_MATCH)) {
    let flag = true

    if (jquerySelector.val() !== value) {
        jquerySelector.addClass('is-invalid')
        let feedback = createElement('div', 'invalid-feedback')
        feedback.textContent = message
        flag = false
    }

    return flag
}

$("#profile-image").change(function() {
    console.log("Profile image has changed")
    const file = this.files
    const image = document.getElementById("profile-image-preview")

    if (file && file[0]) {
        console.log(file[0])

        if ( 'srcObject' in image ) {
            image.srcObject = file
        }
        else {
            image.src = URL.createObjectURL( file[0] )
        }
    }
})