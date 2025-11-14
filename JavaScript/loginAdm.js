document.getElementById("loginFuncionarioForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    if (email && senha) {
        alert("Login efetuado (simulado)");
        window.location.href = "/PainelFuncionario/dashboard.html";
    } else {
        alert("Preencha todos os campos.");
    }
});