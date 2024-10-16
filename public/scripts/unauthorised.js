document.addEventListener('DOMContentLoaded', async () => {
    const reasontext = document.getElementById('reasontext').innerHTML

    await fetch('/reason')
    .then(response => response.json())
    .then (data => {
        console.log(data.reason)
        if (data.reason == 'notloggedin'){
            reasontext = `unauthorised - ${data.reason}`
        }
    })
})