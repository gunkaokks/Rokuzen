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
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (loginProfileLink) {
        if (loggedIn === 'true') {
            const tiposFuncionarios = [1, 2, 3, 4];

            if (tiposFuncionarios.includes(usuario.tipo) || 
                ['master', 'gerente', 'recepcao', 'terapeuta'].includes(usuario.tipo)) {
                loginProfileLink.href = '/HTML/perfilColaborador.html';
            } else {
                loginProfileLink.href = '/HTML/perfil.html';
            }
            loginProfileLink.classList.add('user-logged-in');
        } else {
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
