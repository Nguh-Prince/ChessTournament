$(document).ready(function () {
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
        url: `http://localhost:8000/get-unique-values`,
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

        if (!flag) {
            $("#password").addClass("is-invalid")
            let feedback = createElement('div', ['invalid-feedback'])
            feedback.textContent = THE_PASSWORDS_DO_NOT_MATCH
            $(this).parent().append(feedback)
        }
    }

    flag ? $("#submit").removeClass('disabled') : flag
})

$("#next").click(function () {
    console.log("Clicked next button")
    $("#personal-info").addClass('hide')
    $("#user-info").removeClass('hide')
    $(this).addClass('hide')
    $("#submit").removeClass("hide")
    $("#previous").removeClass("hide").removeClass("disabled")
})

$("#previous").click(function () {
    $("#personal-info").removeClass('hide')
    $("#user-info").addClass('hide')
    $(this).addClass('hide')
    $("#submit").addClass("hide")
    $("#next").removeClass('hide')
    $("#previous").addClass("hide").addClass("disabled")
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