document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error('Elemento com ID "loginForm" não encontrado.');
        return;
    }

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.querySelector("input[name='email']").value;
        const senha = document.querySelector("input[name='senha']").value;

        fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, senha }),
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);  // Verifique o que está sendo retornado

                if (data.success) {
                    localStorage.setItem("loggedIn", "true");
                    localStorage.setItem("nome", data.nome);
                    localStorage.setItem("email", email);
                    localStorage.setItem("senha", senha);

                    alert(data.message);
                    window.location.href = "/HTML/Administrador.html";
                } else {
                    alert("Login falhou: " + data.message);
                }
            })
            .catch(error => {
                console.error("Erro ao fazer login:", error);
                alert("Erro ao tentar fazer login.");
            });
    });
});


