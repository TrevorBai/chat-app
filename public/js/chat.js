const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin //61
    
    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    // console.log(newMessageHeight, visibleHeight, containerHeight, $messages.scrollTop, scrollOffset)

    if (containerHeight - newMessageHeight <= scrollOffset + visibleHeight) {
        $messages.scrollTop = containerHeight // Push scrollbar to the bottom
    }
}

socket.on('message', (data) => {
    console.log(data)
    const html = Mustache.render(messageTemplate, {
        username: data.username,
        message: data.text,
        createdAt: moment(data.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (messageObject) => {
    console.log(messageObject)
    const html = Mustache.render(locationMessageTemplate, {
        username: messageObject.username,
        url: messageObject.url,
        createdAt: moment(messageObject.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable submitting second time
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        // reenable submitting again
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (message) => {
            console.log(message)
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, error => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})