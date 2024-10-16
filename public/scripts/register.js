document.addEventListener('DOMContentLoaded', () => {
    const submit_button = document.getElementById('submitRegister');

    submit_button.addEventListener('click', async (event) => {
        event.preventDefault();

        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        const data = { username, password };

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok){
            alert('Successfully Registered!');
        }else{
            alert('Something went wrong.')
        }
    });
});