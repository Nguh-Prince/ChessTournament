API_URL = `/api`

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