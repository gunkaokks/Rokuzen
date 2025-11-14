document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.querySelector("#loginForm input[name='email']").value;
            const senha = document.querySelector("#loginForm input[name='senha']").value;

            console.log('Tentando login:', { email, senha });

            if (!email || !senha) {
                alert("Por favor, preencha email e senha.");
                return;
            }

            fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                }),
            })
                .then(response => {
                    console.log('Status da resposta:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Resposta completa do login:', data);

                    if (data.mensagem && data.mensagem.includes('sucesso')) {
                        localStorage.setItem("loggedIn", "true");
                        localStorage.setItem("sessaoId", data.sessaoId);
                        localStorage.setItem("usuario", JSON.stringify(data.usuario));
                        localStorage.setItem("nome", data.usuario.nome);
                        localStorage.setItem("email", data.usuario.email);
                        localStorage.setItem("tipo", data.usuario.tipo);

                        alert(data.mensagem);
                        console.log('Redirecionando para index.html');
                        if (document.referrer && document.referrer.includes('index.html')) {
                            window.location.href = document.referrer; // Volta para a página anterior (index)
                        } else {
                            window.location.href = "../index.html"; // Fallback
                        }

                    } else if (data.erro) {
                        alert(data.erro);
                    } else {
                        alert("Erro: tente novamente mais tarde");
                    }
                })
                .catch(error => {
                    console.error("Erro ao fazer login:", error);
                    alert("Erro: tente novamente mais tarde.");
                });
        });
    }

    // Cadastro

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const nome = document.querySelector("#signupForm input[name='nome']").value;
            const email = document.querySelector("#signupForm input[name='email']").value;
            const telefone = document.querySelector("#signupForm input[name='telefone']").value;
            const senha = document.querySelector("#signupForm input[name='senha']").value;

            console.log('Dados do cadastro:', { nome, email, telefone, senha });

            if (!nome || !email || !telefone || !senha) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            if (senha.length < 6) {
                alert("A senha deve ter pelo menos 6 caracteres.");
                return;
            }

            fetch("http://localhost:3000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome: nome,
                    email: email,
                    telefone: telefone,
                    senha: senha
                }),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Resposta do cadastro:', data);

                    if (data.mensagem === 'Usuário criado com sucesso!') {
                        alert(data.mensagem);
                        signupForm.reset();
                        signupForm.style.display = 'none';
                        loginForm.style.display = 'block';
                        document.getElementById('title').innerHTML = 'Login';

                    } else {
                        alert((data.erro || "Cadastro falhou"));
                    }
                })
                .catch(error => {
                    console.error("Erro ao cadastrar:", error);
                    alert("Erro ao tentar cadastrar.");
                });
        });
    }

    const sessaoId = localStorage.getItem("sessaoId");
    if (sessaoId) {
        fetch(`http://localhost:3000/verificar-sessao/${sessaoId}`)
            .then(response => response.json())
            .then(data => {
                if (data.logado) {
                    window.location.href = "/HTML/Administrador.html";
                }
            })
            .catch(error => {
                console.error("Erro ao verificar sessão:", error);
                localStorage.removeItem("sessaoId");
                localStorage.removeItem("usuario");
            });
    }
});

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

const signupBtn = document.getElementById("signupBtn");
const signinBtn = document.getElementById("signinBtn");

const signupBtn2 = document.getElementById("signupBtn2");
const signinBtn2 = document.getElementById("signinBtn2");

const title = document.getElementById("title");

signupBtn.onclick = function () {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    title.innerHTML = "Login";
};

signinBtn.onclick = function () {
    signupForm.style.display = "block";
    loginForm.style.display = "none";
    title.innerHTML = "Cadastro";
};

signupBtn2.onclick = signupBtn.onclick;
signinBtn2.onclick = signinBtn.onclick;