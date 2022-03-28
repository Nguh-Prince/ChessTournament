var SECTION = 0

$(document).ready(function () {
    console.log("Doc is ready...")
    getUniqueValues()
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

function getUniqueValues() {
    $.ajax({
        type: "GET",
        url: `http://${getServerHostAndPort()}/get-unique-values`,
        success: function (data) {
            state = data
        },
        error: function () {
            displayMessage(gettext("Error connecting to the server"))
        }
    })
}

THE_PASSWORDS_DO_NOT_MATCH = gettext("The two passwords do not match")

$("#personal-info input, #personal-info select").on("input", function () {
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
    SECTION = ++SECTION % 3

    if (SECTION == 1) {
        $("#user-info").removeClass("hide")
        $("#user-image").addClass("hide")
    } else if (SECTION == 2) {
        $("#user-info").addClass("hide")
        $("#user-image").removeClass('hide')
        $(this).addClass('hide')
        $("#submit").removeClass("hide")
    } else {
        console.log(SECTION)
    }
    $("#card-title").text(CARD_TITLES[SECTION])
})

$("#previous").click(function () {
    SECTION -= 1
    $("#submit").addClass("hide")
    $("#next").removeClass('hide')

    if (SECTION == 0) {
        $("#personal-info").removeClass('hide')
        $("#previous").addClass("hide").addClass("disabled")
        $("#user-info").addClass('hide')
        $("#user-image").addClass('hide')
    } else if (SECTION == 1) {
        $("#personal-info").addClass('hide')
        $("#previous").removeClass("hide").removeClass("disabled")
        $("#user-info").removeClass('hide')
    } else {
        console.log(SECTION)
    }

    $("#card-title").text(CARD_TITLES[SECTION])
})

function validateUnique(jquerySelector) {
    let flag = true
    if (jquerySelector.val()) {
        console.log("Input has a value")
        console.log(jquerySelector.attr("name"))
        if (["phone", 'telegram-username', 'username'].includes(jquerySelector.attr("name"))) {
            console.log("It is a unique attribute")
            let stateKey, attributeName
            switch (jquerySelector.attr('name')) {
                case "phone":
                    stateKey = "phone_numbers"
                    attributeName = gettext("phone number")
                    break;
                case "username":
                    stateKey = "usernames"
                    attributeName = gettext("username")
                    break;
                case 'telegram-username':
                    stateKey = "telegram_usernames"
                    attributeName = gettext("telegram username")
                    break;
            }
            console.log(stateKey)
            console.log(jquerySelector.val())
            if (state[stateKey].includes(jquerySelector.val())) {
                let format = gettext("A person already exists with this %(attribute)s")
                let text = interpolate(format, { 'attribute': attributeName }, true)
                flag = false

                jquerySelector.addClass('is-invalid')

                let feedback = createElement('div', ['invalid-feedback'])
                feedback.textContent = text
                jquerySelector.parent().append(feedback)
            }
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