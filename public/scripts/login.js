document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const loginForm = document.getElementById('loginform');

    async function handleLogin(){
        const usernameE = document.getElementById('uEntry');
        const passwordE = document.getElementById('pEntry');

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;


        const data = { username, password };

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // Redirect to chat room after successful login
            window.location.href = '/index.html';
        } else if (response.status === 401) {
            usernameE.style.color = '#FF0000'
            passwordE.style.color = '#FF0000';
            usernameE.innerHTML = 'Incorrect username or password';
            passwordE.innerHTML = 'Incorrect username or password';
        } else {
            usernameE.style.color = '#FF0000';
            passwordE.style.color = '#FF0000';
            usernameE.innerHTML = 'Incorrect username or password';
            passwordE.innerHTML = 'Incorrect username or password';
        }
    }


    loginButton.addEventListener('click', async (event) => {
        event.preventDefault();
        handleLogin();
    });
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        handleLogin();
    })
    /*passwordform.addEventListener('submit', async (event) => {
        event.addEventListener();
        handleLogin();
    })*/

});
