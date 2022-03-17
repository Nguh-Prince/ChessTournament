const DateTime = luxon.DateTime

function createElement(htmlTag, classes = null, attributes = null) {
    node = document.createElement(htmlTag)
    if (classes && typeof classes === 'object')
        for (let cssClass of classes) {
            try {
                node.classList.add(cssClass)
            } catch (error) {

            }
        }

    if (attributes && typeof attributes === 'object') {
        for (let key in attributes) {
            node.setAttribute(key, attributes[key])
        }
    }

    return node
}

function createErrorMessage(message, id=null) {
    div = createElement('div', ['invalid-feedback'], id ? {id: id} : null)
    div.textContent = message

    return div
}

const isDate = (date) => {
    return (new Date(date) !== "Invalid Date") && !isNaN(new Date(date))
}

function getLocaleTime(dateTimeISO) {
    // returns time in the format Mmm dd, yyyy, h:mm when passed an ISO string
    dt = DateTime.fromISO(dateTimeISO)
    return dt.setLocale(LOCALE).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
}

function getLocaleDate(dateISO) {
    dt = DateTime.fromISO(dateISO)
    return dt.setLocale(LOCALE).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
}

function createElementFromObject(object) {
    // object must contain a tag attribute (which has a string value)
    // classes attribute (a list consisting of the different css class strings to be applied to the class)
    // and an attributes object (which has the different attributes alongside their values e.g {'id': 'new-div'})
    console.log(object)
    return createElement(object.tag, object.classes, object.attributes)
}

function generateRandomId(length = 6) {
    while (true) {
        let id = (Math.random() + 1).toString(36).substring(12 - length)

        if (!document.getElementById(id)) {
            return id
        }
    }
}

function ajaxRequest(type, url, headers = null, successCallback = null, errorCallback = null) {
    $.ajax({
        type: type,
        url: url,
        headers: headers,
        success: successCallback,
        error: errorCallback
    })
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function ajaxGet(url, headers, successCallback, errorCallback) {
    ajaxRequest("GET", url, headers, successCallback, errorCallback)
}

function ajaxPost(url, headers, successCallback, errorCallback) {
    // add csrftoken to header
    if (headers && !"X-CSRFTOKEN" in headers) {
        headers["X-CSRFTOKEN"] = getCookie("csrftoken")
    } else if (!headers) {
        headers = {
            "X-CSRFTOKEN": getCookie("csrftoken")
        }
    }

    ajaxRequest(url, headers, successCallback, errorCallback)
}

function createFormModal(title, formUrl = '', formMethod = "GET") {
    let modal = createElement('div', ['modal'], {
        'tabindex': "-1",
        id: generateRandomId()
    })
    let modalDialog = createElement('div', ['modal-dialog']);
    modal.appendChild(modalDialog)
    let modalContent = createElement('div', ['modal-content']);
    modalDialog.appendChild(modalContent)
    let modalHeader = createElement('div', ['modal-header']);
    modalContent.appendChild(modalHeader)
    let modalTitle = createElement('h5', ['modal-title'], {
        textContent: title
    });
    modalHeader.appendChild(modalTitle)
    let btnClose = createElement('button', ['btn-close'], {
        type: "button",
        'data-bs-dismiss': "modal",
        'aria-label': "Close"
    })
    modalHeader.appendChild(btnClose)

    let form = createElement('form', [], {
        method: formMethod,
        action: formUrl
    });
    modalContent.appendChild(form)

    let modalBody = createElement('div', ['modal-body']);
    form.appendChild(modalBody)

    let modalFooter = createElement('div', ['modal-footer']);
    form.appendChild(modalFooter)

    let array = [{
        classes: ['btn', 'btn-secondary'],
        attributes: {
            type: "button",
            "data-bs-dismiss": "modal"
        }
    },
    {
        classes: ['btn', 'btn-primary'],
        attributes: {
            type: "submit"
        }
    }
    ]

    for (let object of array) {
        button = createElement('button', object.classes, object.attributes)
        modalFooter.appendChild(button)
    }

    return modal
}

function toast(message) {
    let toast = createElement('div', ['toast', 'show', 'toast-container', 'p-3'], {
        role: "alert",
        "aria-live": "assertive",
        "aria-atomic": "true"
    })
    let toastHeader = createElement('div', ['toast-header']);
    toast.appendChild(toastHeader)
    let strong = createElement('strong', ['me-auto']);
    strong.textContent = "LFD"
    let btnClose = createElement('button', ['btn-close'], {
        'data-bs-dismiss': "toast",
        "aria-label": "Close"
    })
    toastHeader.appendChild(strong);
    toastHeader.appendChild(btnClose)

    toastBody = createElement('div', ['toast-body'])
    toastBody.textContent = message;
    toast.appendChild(toastBody)

    $("#toasts").append(toast)
    return toast
}

API_URL = "api"

function format_time(number) {
    if (number <= 9) {
        return '0'.concat(number)
    } else return ''.concat(number)
}

function getDateString(dateObject) {
    month = format_time(dateObject.getMonth() + 1)
    day = format_time(dateObject.getDate())
    return dateObject.getFullYear() + "-" + month + "-" + day
}

function getCurrentTime() {
    now = new Date()
    return format_time(now.getHours()) + ":" + format_time(now.getMinutes())
}

function getCurrentDate() {
    return getDateString(new Date())
}

function splitName(name) {
    // takes a name as argument and returns an array of [first_name, middle_names, last_name]
    let names = name.split(' ');
    let numberOfNames = names.length

    let first_name = null,
        last_name = null,
        middle_names = null

    names[0] ? first_name = names[0] : first_name = null
    numberOfNames >= 2 ? last_name = names[numberOfNames - 1] : last_name = null

    if (numberOfNames > 2) {
        middle_names = ''
        for (let i = 1; i < numberOfNames - 1; i++) {
            middle_names = middle_names + names[i]

            i < numberOfNames - 2 ? middle_names = middle_names + " " : middle_names
            // add a space if it is not the last middle name
        }
    }

    return [first_name, middle_names, last_name]
}

$("textarea.auto-resize").each(function () {
    this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function () {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
});

$("input.name-update").change(function () {
    let nameInput = $(this).attr('data-name-input')
    if (nameInput) {
        let name = $(`#${this.list.id} option[value='${this.value}']`).text()
        $(nameInput).val(name)
        $(nameInput).text(name)
    }
})

// removing the error class from a parent each time an input is focused
$('input').focus(function () {
    $(this).parent().removeClass('has-error')
})

// inputs value's must come from option values in its list attribute
$("input.list-only").change(function () {
    let inputValue = $(this).val()

    if (this.list) {
        let flag = false

        $(`#${this.list.id} option`).each(function () {
            if (this.value == inputValue)
                flag = true
        })

        if (!flag) {
            span = createElement("span")
            span.textContent = gettext("This value is not found on the list")
            $(this).parent().append("span").addClass('has-error')
        }
    }
})

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function createHelpBlock(message) {
    let span = createElement('span', ['help-block'])
    span.textContent = message

    return span
}

function validateObject(object) {
    // object must have the following attributes
    // selector: a valid css selector for the input
    // type: string representing the accepted data type for this attribute
    // required: boolean 
    // in: css selector for a datalist or select where this input's value must come from
    // notIn: css selector for a datalist or select where this input'value should not be found
    // different: css selector for an input element (textarea, input, select, etc) that should not have the same value as this object
    // requiredIf: boolean, implies the element's value is required
    // errorContainer: a css selector for where to append the error message, if not provided parent is used

    let value = $(object.selector).val()
    let flag = true
    let messages = []

    if (object.in && object.notIn && $(`${object.in}`)[0] == $(`${object.notIn}`)[0]) {
        alert(gettext("The in and notIn selectors of this object are the same"))
    }

    if (!value && (object.required || object.requiredIf) ) {
        messages.push(gettext("This field is required"))
        console.log(object)
        flag = false
    } else {
        object.type == "number" ? value = parseFloat(value) : 1

        if (object.type == "number") {
            if (isNaN(parseFloat(value))) {
                let message = gettext("Expected a number")

                messages.push(message)
                flag = false
            }
            else if ("min" in object && value < object.min) {
                let message = gettext("The value of this field must be greater than %s")
                message = interpolate(message, [object.min])

                messages.push(message)
                flag = false
            }
        }

        if (object.type == "date" && value) {
            if (!isDate(value)) {
                let message = gettext("This is not a valid date ")

                messages.push(message)
                flag = false
            }
        }
        else if (value && object.type == "name") {
            names = splitName(value)
            console.log(names)

            if (!names[0] || !names[2]) {
                let message = gettext("At least two names are required")

                messages.push(message)

                flag = false
            }
        }
        else if (value && typeof value !== object.type) {
            let message = gettext("Expected %s, got a value of %s")
            message = interpolate(message, [object.type, typeof value])

            messages.push(message)

            flag = false
        }

        if (object.in) {
            if (value && !$(`${object.in} option[value='${value}']`).val()) {
                message = gettext("This value does not exist on the list %s")
                message = interpolate(message, [object.in])

                messages.push(message)
                flag = false
            }
        }
        if (object.notIn) {
            if (value && $(`${object.notIn} option[value='${value}']`).val()) {
                message = gettext("This value already exists in the list %s")
                message = interpolate(message, [object.notIn])

                messages.push(message)
                flag = false
            }
        }
        if (object.different) {
            if ( value && $(`${object.different}`).val() == value ) {
                message = gettext( "The value of this input must be different from that of %s" )
                message = interpolate(message, [object.different])

                messages.push(message)
                flag = false
            }
        }
    }

    // removing other error messages from the container
    "errorContainer" in object ? $(object.errorContainer).children('.help-block').remove() : $(object.selector).parent().children('.help-block').remove()

    if (!flag) {
        for (let message of messages) {
            let helpBlock = createElement("span", ['help-block'])
            helpBlock.textContent = message
            console.log(helpBlock)

            if ("errorContainer" in object) {
                $(object.errorContainer).append(helpBlock)
                $(object.errorContainer).addClass('has-error')
            } else {
                $(object.selector).parent().append(helpBlock)
                $(object.selector).parent().addClass('has-error')
            }
        }
    }

    return flag
}

function validateObjects(objectList) {
    // a list of objects to be validated
    // each object must have the following attributes
    // selector: a valid css selector for the input
    // type: string representing the accepted data type for this attribute
    // required: boolean 
    // in: css selector for a datalist or select where this input's value must come from
    // errorContainer: a css selector for where to append the error message, if not provided parent is used

    let flag = true

    for (let object of objectList) {
        (validateObject(object)) == false ? flag = false : 1
    }

    return flag
}

function displayMessage(message, classes = ['alert-danger', 'alert-dismissible'], timeout = 10000) {
    let alert = createElement('div', ['alert'].concat(classes), { role: "alert" })
    $(alert).append(message)

    button = createElement('button', ['btn-close'], { "data-bs-dismiss": "alert", "aria-label": "Close" })
    $(alert).append(button)

    $("#messages").append(alert)

    if (timeout) {
        // closing the message after timeout milliseconds
        setTimeout(function () {
            $(button).click()
        }, timeout)
    }
}

function deleteItem(url) {
    $.ajax({
        type: "DELETE",
        url: url,
        headers: {
            "X-CSRFTOKEN": getCookie("csrftoken")
        },
        success: function () {
            alert(gettext("Item deleted successfully"))
            location.reload()
        },
        error: function (data) {
            if (data.status == 500) {
                displayMessage(gettext("Error connecting to the server"))
            } else {
                for (error in data.error) {PaymentMethodChangeEvent
                    displayMessage(error)
                }
            }
        }
    })
}

function isPowerOf2(number) {
    if (Number(number)) {
        return Math.log2(number) % 1 == 0
    }
    return false
}

ERROR_MESSAGES = {
    "500": gettext("Error connecting to the server"),
    "403": gettext("You are not authorized to access this resource")
}

$('.form-control').on('input', function () {
    console.log("Inputting input")
    $(this).parent().children('span.help-block').remove()
    $(this).parent().removeClass('has-error')
})

var state = {}

function getServerHostAndPort() {
    return self.location.host
}