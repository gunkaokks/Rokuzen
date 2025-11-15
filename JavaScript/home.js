document.addEventListener("DOMContentLoaded", function () {
    const fadeIns = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                } else {
                    entry.target.classList.remove("visible");
                }
            });
        },
        {
            threshold: 0.1, 
        }
    );

    fadeIns.forEach((element) => observer.observe(element));
});

function atualizarLinkLoginPerfil() {
    const loginProfileLink = document.getElementById('loginProfileLink');
    const loggedIn = localStorage.getItem('loggedIn');

    if (loginProfileLink) {
        if (loggedIn === 'true') {
            // Usuário está logado - vai para o perfil
            loginProfileLink.href = '/HTML/perfil.html';
            loginProfileLink.classList.add('user-logged-in');
        } else {
            // Usuário não está logado - vai para o login
            loginProfileLink.href = '/Login/login.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    atualizarLinkLoginPerfil();

    window.addEventListener('storage', function (e) {
        if (e.key === 'loggedIn') {
            atualizarLinkLoginPerfil();
        }
    });
});

function atualizarLinkLoginPerfil() {
    const loginProfileLinks = document.querySelectorAll('#loginProfileLink, .login-profile-link');
    const loggedIn = localStorage.getItem('loggedIn');

    loginProfileLinks.forEach(link => {
        if (loggedIn === 'true') {
            link.href = '/HTML/perfil.html';
            link.classList.add('user-logged-in');
        } else {
            link.href = '/Login/login.html';
            link.classList.remove('user-logged-in');
        }
    });
}
