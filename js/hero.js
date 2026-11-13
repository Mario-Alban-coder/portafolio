// Hero: carrusel de proyectos destacados al estilo de una plataforma de streaming.
{
  const hero = document.querySelector(".hero");
  const slides = [...hero.querySelectorAll(".hero-slide")];
  const minis = [...hero.querySelectorAll(".hero-mini")];
  const botonPausa = hero.querySelector(".hero-pausa");
  const contador = hero.querySelector(".hero-contador b");
  const tiempo = hero.querySelector(".hero-tiempo span");
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURACION = 9; // segundos que se queda cada proyecto

  let actual = 0;
  let pausadoPorUsuario = false;
  let pausadoPorSistema = false; // visor abierto o hero fuera de pantalla

  hero.style.setProperty("--duracion", `${DURACION}s`);

  // Separa cada título en palabras y letras para animarlas una por una.
  slides.forEach((slide) => {
    const titulo = slide.querySelector(".hero-titulo");
    const palabras = titulo.textContent.trim().split(" ");
    let indice = 0;
    titulo.textContent = "";
    palabras.forEach((texto, p) => {
      const palabra = document.createElement("span");
      palabra.className = "palabra";
      [...texto].forEach((caracter) => {
        const letra = document.createElement("span");
        letra.className = "letra";
        letra.textContent = caracter;
        letra.style.setProperty("--i", indice++);
        palabra.append(letra);
      });
      titulo.append(palabra);
      if (p < palabras.length - 1) titulo.append(" ");
    });

    // Eco en contorno: mismas palabras, para que salte de línea igual que el título.
    const eco = document.createElement("span");
    eco.className = "hero-eco";
    eco.setAttribute("aria-hidden", "true");
    palabras.forEach((texto, p) => {
      const palabra = document.createElement("span");
      palabra.className = "palabra";
      palabra.textContent = texto;
      eco.append(palabra);
      if (p < palabras.length - 1) eco.append(" ");
    });
    titulo.append(eco);
  });

  function videoDe(slide) {
    return slide.querySelector(".hero-video");
  }

  function estaPausado() {
    return pausadoPorUsuario || pausadoPorSistema;
  }

  function actualizarPausa() {
    hero.classList.toggle("pausado", estaPausado());
    const video = videoDe(slides[actual]);
    if (estaPausado() || sinMovimiento) video.pause();
    else video.play().catch(() => {});
  }

  function mostrar(indice) {
    const anterior = slides[actual];
    actual = (indice + slides.length) % slides.length;
    const slide = slides[actual];

    slides.forEach((s, i) => {
      s.classList.toggle("activo", i === actual);
      s.setAttribute("aria-hidden", i !== actual);
    });
    minis.forEach((m, i) => m.classList.toggle("activo", i === actual));
    contador.textContent = String(actual + 1).padStart(2, "0");

    if (anterior !== slide) videoDe(anterior).pause();
    const video = videoDe(slide);
    video.preload = "auto";
    video.currentTime = 0;
    actualizarPausa();
  }

  // Avanza solo cuando la barra de progreso del proyecto actual se llena.
  minis.forEach((mini, i) => {
    mini.addEventListener("click", () => {
      if (i !== actual) mostrar(i);
    });
    mini.querySelector(".hero-mini-barra i").addEventListener("animationend", () => mostrar(actual + 1));
  });

  botonPausa.addEventListener("click", () => {
    pausadoPorUsuario = !pausadoPorUsuario;
    botonPausa.setAttribute("aria-pressed", pausadoPorUsuario);
    botonPausa.setAttribute("aria-label", pausadoPorUsuario ? "Reanudar carrusel" : "Pausar carrusel");
    actualizarPausa();
  });

  // Código de tiempo tipo cámara: horas:minutos:segundos:cuadros (24 fps).
  slides.forEach((slide) => {
    videoDe(slide).addEventListener("timeupdate", (evento) => {
      if (slide !== slides[actual]) return;
      const t = evento.target.currentTime;
      const partes = [t / 3600, (t / 60) % 60, t % 60, (t % 1) * 24].map((n) => String(Math.floor(n)).padStart(2, "0"));
      tiempo.textContent = partes.join(":");
    });
  });

  // "Reproducir" abre el proyecto en el visor; "Más info" lleva a su tarjeta en la galería.
  function tarjetaDe(slide) {
    return document.querySelector(`.proyecto[data-titulo="${slide.dataset.proyecto}"]`);
  }

  slides.forEach((slide) => {
    slide.querySelector(".hero-reproducir").addEventListener("click", () => tarjetaDe(slide)?.click());
    slide.querySelector(".hero-info").addEventListener("click", () => {
      const tarjeta = tarjetaDe(slide);
      if (!tarjeta) return;
      document.querySelector('.filtro[data-filtro="todos"]')?.click();
      tarjeta.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth", block: "center" });
      tarjeta.classList.remove("resaltado");
      void tarjeta.offsetWidth; // reinicia la animación si se pulsa otra vez
      tarjeta.classList.add("resaltado");
    });
  });

  // Mientras el visor está abierto o el hero no se ve, el carrusel se detiene.
  const visorProyectos = document.getElementById("visor");
  new MutationObserver(() => {
    pausadoPorSistema = visorProyectos.open || !heroVisible;
    actualizarPausa();
  }).observe(visorProyectos, { attributes: true, attributeFilter: ["open"] });

  let heroVisible = true;
  new IntersectionObserver(([entrada]) => {
    heroVisible = entrada.isIntersecting;
    pausadoPorSistema = visorProyectos.open || !heroVisible;
    actualizarPausa();
  }, { threshold: 0.25 }).observe(hero);

  // Flechas del teclado y deslizar con el dedo.
  hero.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowRight") mostrar(actual + 1);
    if (evento.key === "ArrowLeft") mostrar(actual - 1);
  });

  let inicioX = null;
  hero.addEventListener("pointerdown", (evento) => {
    if (evento.pointerType !== "mouse") inicioX = evento.clientX;
  });
  hero.addEventListener("pointerup", (evento) => {
    if (inicioX === null) return;
    const distancia = evento.clientX - inicioX;
    if (Math.abs(distancia) > 60) mostrar(actual + (distancia < 0 ? 1 : -1));
    inicioX = null;
  });

  mostrar(0);
}
