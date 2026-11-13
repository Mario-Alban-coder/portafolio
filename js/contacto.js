// Formulario de contacto: envía los mensajes a tu correo con FormSubmit sin salir de la página.
const formulario = document.getElementById("formulario-contacto");
const estado = formulario.querySelector(".estado-formulario");
const boton = formulario.querySelector('button[type="submit"]');
const textoBoton = boton.querySelector(".boton-texto");
const DESTINO = "https://formsubmit.co/ajax/marjunioralban@gmail.com";

function mostrarEstado(mensaje, tipo) {
  estado.textContent = mensaje;
  estado.className = "estado-formulario " + tipo;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  // Campo trampa: si un bot lo llenó, no se envía nada.
  if (formulario.elements._honey.value) return;

  boton.disabled = true;
  textoBoton.textContent = "Enviando…";
  mostrarEstado("", "");

  try {
    const respuesta = await fetch(DESTINO, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(formulario))),
    });
    const datos = await respuesta.json();

    if (String(datos.success) === "true") {
      formulario.reset();
      mostrarEstado("¡Gracias! Tu mensaje fue enviado. Te responderé muy pronto.", "ok");
    } else if (/activat/i.test(datos.message || "")) {
      // Solo ocurre la primera vez: FormSubmit pide confirmar el correo de destino.
      mostrarEstado("El formulario está pendiente de activación. Revisa la bandeja de marjunioralban@gmail.com y pulsa “Activate Form”.", "error");
    } else {
      throw new Error(datos.message || "Respuesta inesperada");
    }
  } catch (error) {
    mostrarEstado("No se pudo enviar el mensaje. Inténtalo de nuevo o escríbeme directamente a marjunioralban@gmail.com.", "error");
  } finally {
    boton.disabled = false;
    textoBoton.textContent = "Enviar mensaje";
  }
});
