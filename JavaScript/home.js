document.addEventListener("DOMContentLoaded", function () {
    const fadeIns = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible"); // Adiciona a classe ao entrar no viewport
                } else {
                    entry.target.classList.remove("visible"); // Remove a classe ao sair do viewport
                }
            });
        },
        {
            threshold: 0.1, // Define a porcentagem do elemento que precisa estar visível
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
