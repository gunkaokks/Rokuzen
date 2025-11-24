document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginFuncionarioForm");

    if (!loginForm) {
        console.error("Formulário loginFuncionarioForm não encontrado!");
        return;
    }

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {
            alert("Preencha todos os campos.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/colaboradores/login", {
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
                const tokenPayload = {
                    userId: data.usuario.id,
                    email: data.usuario.email,
                    nome: data.usuario.nome,
                    tipo: data.usuario.tipo
                };

                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.usuario.id);
                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("usuario", JSON.stringify(data.usuario));

                alert(data.mensagem);

                const tipoUsuario = data.usuario.tipo;
                console.log('Tipo do funcionário:', tipoUsuario);

                switch (tipoUsuario) {
                    case 1:
                        window.location.href = "../HTML/administrador.html";
                        break;
                    case 2:
                        window.location.href = "../HTML/gerente.html";
                        break;
                    case 3:
                        window.location.href = "../HTML/recepcao.html";
                        break;
                    case 4:
                        window.location.href = "../HTML/terapeuta.html";
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