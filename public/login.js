document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (!email || !password) {
        errorMessage.textContent = "Both fields are required.";
        return;
    }
    errorMessage.textContent = "";
    fetch('/access/user/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: email, password: password })
    })
    .then(res => res.json())
    .then(res => {
        console.log(res);
        if(res.success){
            alert('Login Success');
            sessionStorage.setItem('nas-token', res.token);
            sessionStorage.setItem('nas-role', res.role);
            if(res.role === 'admin') window.location.href = '/admin/dashboard.html';
            else window.location.href = '/';
        }
        else{
            alert(res.message);
        }
    })
    .catch(err => alert(err.message));
});
