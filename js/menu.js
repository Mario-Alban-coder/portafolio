// Menú: se abre como panel de vidrio en tablet y celular, y marca la sección en la que estás.
{
  const encabezado = document.querySelector(".encabezado");
  const boton = encabezado.querySelector(".menu-boton");
  const menu = encabezado.querySelector(".menu");
  const fondo = document.querySelector(".menu-fondo");
  const enlaces = [...menu.querySelectorAll(":scope > a")];

  function abrir(estado) {
    encabezado.classList.toggle("abierto", estado);
    fondo.classList.toggle("visible", estado);
    boton.setAttribute("aria-expanded", estado);
    boton.setAttribute("aria-label", estado ? "Cerrar menú" : "Abrir menú");
  }

  boton.addEventListener("click", () => abrir(!encabezado.classList.contains("abierto")));
  fondo.addEventListener("click", () => abrir(false));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => abrir(false)));

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && encabezado.classList.contains("abierto")) {
      abrir(false);
      boton.focus();
    }
  });

  // Si la ventana vuelve a tamaño escritorio, el panel se cierra solo.
  matchMedia("(min-width: 901px)").addEventListener("change", (consulta) => {
    if (consulta.matches) abrir(false);
  });

  // Resalta en el menú la sección visible en pantalla.
  const secciones = enlaces.map((a) => document.querySelector(a.getAttribute("href")));
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      enlaces.forEach((a, i) => a.classList.toggle("actual", secciones[i] === entrada.target));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  secciones.forEach((seccion) => seccion && observador.observe(seccion));
}
