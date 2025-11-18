document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM carregado - procurando formulário...");

    const loginForm = document.getElementById("loginFuncionarioForm");

    if (!loginForm) {
        console.error("Formulário loginFuncionarioForm não encontrado!");
        return;
    }

    console.log("Formulário encontrado, adicionando event listener...");

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        console.log("Tentando login com:", { email, senha });

        if (!email || !senha) {
            alert("Preencha todos os campos.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                }),
            });

            const data = await response.json();
            console.log('Resposta do servidor:', data);

            if (data.mensagem && data.mensagem.includes('sucesso')) {
                // Salvar dados no localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("sessaoId", data.sessaoId);
                localStorage.setItem("usuario", JSON.stringify(data.usuario));
                localStorage.setItem("nome", data.usuario.nome);
                localStorage.setItem("email", data.usuario.email);
                localStorage.setItem("tipo", data.usuario.tipo);

                alert(data.mensagem);

                const tipoUsuario = data.usuario.tipo;
                console.log('Tipo do funcionário:', tipoUsuario);

                switch (tipoUsuario) {
                    case 'terapeuta':
                        console.log('Redirecionando terapeuta para terapeuta.html');
                        window.location.href = "../HTML/terapeuta.html";
                        break;

                    case 'gerente':
                    case 'master':
                        console.log('Redirecionando gerente/master para administrador.html');
                        window.location.href = "../HTML/administrador.html";
                        break;

                    case 'recepcao':
                        console.log('Redirecionando recepcionista para recepcao.html');
                        window.location.href = "../HTML/recepcao.html";
                        break;

                    default:
                        alert('Tipo de usuário não permitido para esta área.');
                        break;
                }
            } else {
                alert(data.erro || "Login falhou");
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Erro ao tentar fazer login. Verifique se o servidor está rodando.");
        }
    });
});