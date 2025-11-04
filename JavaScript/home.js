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
