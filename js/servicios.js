// Servicios: brillo que sigue al cursor en cada tarjeta.
document.querySelectorAll(".servicio").forEach((tarjeta) => {
  tarjeta.addEventListener("pointermove", (evento) => {
    const caja = tarjeta.getBoundingClientRect();
    tarjeta.style.setProperty("--x", evento.clientX - caja.left + "px");
    tarjeta.style.setProperty("--y", evento.clientY - caja.top + "px");
  });
});

// "Cotizar": lleva al formulario con el servicio ya elegido.
document.querySelectorAll("[data-servicio]").forEach((enlace) => {
  enlace.addEventListener("click", () => {
    const formulario = document.getElementById("formulario-contacto");
    formulario.elements.servicio.value = enlace.dataset.servicio;
    setTimeout(() => formulario.elements.nombre.focus({ preventScroll: true }), 600);
  });
});
