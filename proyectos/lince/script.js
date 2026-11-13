/* =========================================================
   ANDRÉS Y EL LINCE — Motor de la película interactiva
   =========================================================

   CÓMO FUNCIONA (léelo antes de tocar nada):

   1. Todo el árbol narrativo vive dentro del objeto HISTORIA.
   2. Cada "escena" es un video + (opcionalmente) una decisión.
   3. Si una escena NO tiene "decision", el video simplemente
      se reproduce hasta el final y luego se muestra la
      pantalla de FIN (o pasa a la siguiente escena si defines
      "siguiente").
   4. Para agregar más decisiones más adelante, solo debes
      agregar nuevas entradas dentro de HISTORIA.escenas y
      nuevas opciones dentro de "decision.opciones".
      No hay que tocar el resto del código.

   ========================================================= */

const HISTORIA = {

  // Escena por la que arranca la película
  inicio: "decision_01_inicio",

  escenas: {

    // -----------------------------------------------------
    // DECISIÓN 1
    // -----------------------------------------------------
    decision_01_inicio: {
      video: "videos/decision_01_inicio.mp4",

      // ⏱️ SEGUNDO EXACTO en el que debe pausarse el video
      // y mostrar los botones. Ajusta este número al
      // momento real de tu edición (en segundos, puede
      // llevar decimales, ej: 125.5).
      tiempoDecision: 82, // 1:22 — fin de decision_01_inicio.mov

      decision: {
        pregunta: "¿Andrés insiste en saber qué pasó?",
        opciones: [
          { texto: "DESCONFIAR",     siguiente: "decision_01_opcion_A" },
          { texto: "DEJARLO PASAR",  siguiente: "decision_01_opcion_B" }
        ]
      }
    },

    // DESCONFIAR: este video ahora termina llevando directo
    // a la Decisión 2 (CONFIAR / VENGANZA).
    decision_01_opcion_A: {
      video: "videos/decision_01_opcion_A.mp4",

      decision: {
        pregunta: "¿Andrés confía en El Lince o busca venganza?",
        opciones: [
          { texto: "CONFIAR",   siguiente: "decision_02_opcion_A" },
          { texto: "VENGANZA",  siguiente: "decision_02_opcion_B" }
        ]
      }
    },

    decision_01_opcion_B: {
      video: "videos/decision_01_opcion_B.mp4",
      decision: null,
      siguiente: null // aquí se conectará la escena 4B cuando exista
    },

    // -----------------------------------------------------
    // DECISIÓN 2
    // -----------------------------------------------------
    decision_02_opcion_A: {
      video: "videos/decision_02_opcion_A.mp4",
      decision: null,
      siguiente: null // aquí se conectará la siguiente escena cuando exista
    },

    // VENGANZA: este video ("Acto 3 la elección") termina
    // llevando directo a la Decisión 3 (VENGANZA / PERDÓN).
    decision_02_opcion_B: {
      video: "videos/decision_02_opcion_B.mp4",

      decision: {
        pregunta: "¿Andrés se venga o perdona a El Lince?",
        opciones: [
          { texto: "VENGANZA", siguiente: "decision_03_opcion_A" },
          { texto: "PERDÓN",   siguiente: "decision_03_opcion_B" }
        ]
      }
    },

    // -----------------------------------------------------
    // DECISIÓN 3 — finales
    // -----------------------------------------------------
    decision_03_opcion_A: {
      video: "videos/decision_03_opcion_A.mp4", // Final A - Venganza
      decision: null,
      siguiente: null
    },

    decision_03_opcion_B: {
      video: "videos/decision_03_opcion_B.mp4", // Final B - Perdón
      decision: null,
      siguiente: null
    }
  }
};

/* =========================================================
   MOTOR — no necesitas tocar nada de aquí hacia abajo
   para agregar decisiones nuevas.
   ========================================================= */

const video               = document.getElementById("reproductor");
const capaPortada         = document.getElementById("portada");
const capaDecision        = document.getElementById("capa-decision");
const capaFin             = document.getElementById("capa-fin");
const textoDecisionEl     = document.getElementById("texto-decision");
const opcionesDecisionEl  = document.getElementById("opciones-decision");
const btnIniciar          = document.getElementById("btn-iniciar");
const btnReiniciar        = document.getElementById("btn-reiniciar");
const cine                = document.getElementById("cine");

// Elementos de la barra de control del clip actual
const controles          = document.getElementById("controles");
const btnPlayPausa       = document.getElementById("btn-play-pausa");
const iconoPlay          = document.getElementById("icono-play");
const iconoPausa         = document.getElementById("icono-pausa");
const tiempoActualEl     = document.getElementById("tiempo-actual");
const tiempoTotalEl      = document.getElementById("tiempo-total");
const barraProgreso      = document.getElementById("barra-progreso");
const progresoRelleno    = document.getElementById("progreso-relleno");
const progresoManija     = document.getElementById("progreso-manija");
const btnPantallaCompleta = document.getElementById("btn-pantalla-completa");
const iconoExpandir      = document.getElementById("icono-expandir");
const iconoContraer      = document.getElementById("icono-contraer");

let escenaActualId = null;
let decisionMostrada = false;

function ocultarTodasLasCapas() {
  capaPortada.classList.add("oculto");
  capaDecision.classList.add("oculto");
  capaFin.classList.add("oculto");
}

// Alguna capa (portada, decisión o fin) está activa ahora mismo?
function hayCapaActiva() {
  return (
    !capaPortada.classList.contains("oculto") ||
    !capaDecision.classList.contains("oculto") ||
    !capaFin.classList.contains("oculto")
  );
}

/* ---------------------------------------------------------
   Pantalla completa (definido aquí arriba para poder usarlo
   dentro de mostrarFin)
   --------------------------------------------------------- */

function estaEnPantallaCompleta() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement
  );
}

function salirDePantallaCompleta() {
  if (!estaEnPantallaCompleta()) return;
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

function cargarEscena(idEscena) {
  const escena = HISTORIA.escenas[idEscena];

  if (!escena) {
    console.error(`No existe la escena "${idEscena}" en HISTORIA.escenas`);
    return;
  }

  escenaActualId = idEscena;
  decisionMostrada = false;

  ocultarTodasLasCapas();
  ocultarControles();

  video.src = escena.video;
  video.currentTime = 0;
  video.load();

  const promesa = video.play();
  if (promesa !== undefined) {
    promesa.catch(() => {
      // Autoplay bloqueado por el navegador: no pasa nada,
      // el usuario puede darle play manualmente.
    });
  }
}

function mostrarDecision(escena) {
  const { decision } = escena;

  textoDecisionEl.textContent = decision.pregunta;
  opcionesDecisionEl.innerHTML = "";

  decision.opciones.forEach((opcion) => {
    const boton = document.createElement("button");
    boton.className = "boton-decision";
    boton.textContent = opcion.texto;
    boton.addEventListener("click", () => {
      cargarEscena(opcion.siguiente);
    });
    opcionesDecisionEl.appendChild(boton);
  });

  video.pause();
  capaDecision.classList.remove("oculto");
  ocultarControles();
}

function mostrarFin() {
  capaFin.classList.remove("oculto");
  ocultarControles();
  // El recorrido terminó: si estábamos en pantalla completa,
  // salimos para volver a ver la pestaña normal del navegador.
  salirDePantallaCompleta();
}

// Revisa en cada frame de reproducción si ya se llegó
// al segundo de la decisión (para escenas con tiempoDecision).
video.addEventListener("timeupdate", () => {
  actualizarBarraProgreso();

  const escena = HISTORIA.escenas[escenaActualId];
  if (!escena || !escena.decision || decisionMostrada) return;
  if (escena.tiempoDecision === undefined) return;

  if (video.currentTime >= escena.tiempoDecision) {
    decisionMostrada = true;
    mostrarDecision(escena);
  }
});

// Cuando el video termina:
// - si la escena tiene una decisión pendiente (con o sin
//   tiempoDecision definido) y aún no se mostró, se muestra
//   justo al terminar el clip.
// - si no, pasa a la siguiente escena o muestra FIN.
video.addEventListener("ended", () => {
  const escena = HISTORIA.escenas[escenaActualId];
  if (!escena) return;

  if (escena.decision && !decisionMostrada) {
    decisionMostrada = true;
    mostrarDecision(escena);
    return;
  }

  if (escena.siguiente) {
    cargarEscena(escena.siguiente);
  } else {
    mostrarFin();
  }
});

// Controles con teclado: espacio = play/pausa
document.addEventListener("keydown", (evento) => {
  if (evento.code === "Space" && !capaPortada.classList.contains("oculto") === false) {
    evento.preventDefault();
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }
});

btnIniciar.addEventListener("click", () => {
  cargarEscena(HISTORIA.inicio);
});

btnReiniciar.addEventListener("click", () => {
  ocultarTodasLasCapas();
  capaPortada.classList.remove("oculto");
});

/* =========================================================
   BARRA DE CONTROL DEL CLIP ACTUAL
   =========================================================

   Solo controla el video que está sonando en este momento
   (el <video> siempre tiene cargado únicamente el clip
   actual, nunca el que sigue), así que nunca se puede ver
   ni adelantar hacia la escena siguiente: sencillamente no
   existe todavía en el reproductor.

   Aparece con el mouse encima del video y se oculta:
   - al quitar el mouse del área de video
   - después de unos segundos sin moverlo
   - automáticamente si aparece la portada, una decisión o el FIN
   ========================================================= */

function formatearTiempo(segundos) {
  if (!isFinite(segundos) || segundos < 0) segundos = 0;
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${String(seg).padStart(2, "0")}`;
}

function actualizarBarraProgreso() {
  if (!video.duration) return;
  const porcentaje = (video.currentTime / video.duration) * 100;
  progresoRelleno.style.width = `${porcentaje}%`;
  progresoManija.style.left = `${porcentaje}%`;
  tiempoActualEl.textContent = formatearTiempo(video.currentTime);
  tiempoTotalEl.textContent = formatearTiempo(video.duration);
}

function actualizarIconoPlayPausa() {
  if (video.paused) {
    iconoPlay.style.display = "block";
    iconoPausa.style.display = "none";
  } else {
    iconoPlay.style.display = "none";
    iconoPausa.style.display = "block";
  }
}

let temporizadorOcultarControles = null;

function mostrarControles() {
  if (hayCapaActiva()) return; // no mostrar sobre portada/decisión/fin
  controles.classList.add("visible");
  clearTimeout(temporizadorOcultarControles);
  temporizadorOcultarControles = setTimeout(() => {
    controles.classList.remove("visible");
  }, 3000);
}

function ocultarControles() {
  clearTimeout(temporizadorOcultarControles);
  controles.classList.remove("visible");
}

cine.addEventListener("mousemove", () => {
  mostrarControles();
});

cine.addEventListener("mouseleave", () => {
  ocultarControles();
});

controles.addEventListener("mouseenter", () => {
  clearTimeout(temporizadorOcultarControles);
});

controles.addEventListener("mouseleave", () => {
  mostrarControles();
});

btnPlayPausa.addEventListener("click", () => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
});

video.addEventListener("play", actualizarIconoPlayPausa);
video.addEventListener("pause", actualizarIconoPlayPausa);
video.addEventListener("loadedmetadata", actualizarBarraProgreso);

// --- Interacción con la barra de progreso (clic y arrastre) ---

let arrastrandoBarra = false;

function moverPlayheadDesdeEvento(evento) {
  const rect = barraProgreso.getBoundingClientRect();
  const clienteX = evento.touches ? evento.touches[0].clientX : evento.clientX;
  let ratio = (clienteX - rect.left) / rect.width;
  ratio = Math.min(1, Math.max(0, ratio));
  if (video.duration) {
    video.currentTime = ratio * video.duration;
    actualizarBarraProgreso();
  }
}

barraProgreso.addEventListener("mousedown", (evento) => {
  arrastrandoBarra = true;
  moverPlayheadDesdeEvento(evento);
});

window.addEventListener("mousemove", (evento) => {
  if (arrastrandoBarra) {
    moverPlayheadDesdeEvento(evento);
  }
});

window.addEventListener("mouseup", () => {
  arrastrandoBarra = false;
});

// Soporte táctil básico (para pantallas táctiles)
barraProgreso.addEventListener("touchstart", (evento) => {
  arrastrandoBarra = true;
  moverPlayheadDesdeEvento(evento);
});

barraProgreso.addEventListener("touchmove", (evento) => {
  if (arrastrandoBarra) moverPlayheadDesdeEvento(evento);
});

barraProgreso.addEventListener("touchend", () => {
  arrastrandoBarra = false;
});

/* =========================================================
   PANTALLA COMPLETA (control desde la barra de controles)
   ========================================================= */

function actualizarIconoPantallaCompleta() {
  if (estaEnPantallaCompleta()) {
    iconoExpandir.style.display = "none";
    iconoContraer.style.display = "block";
  } else {
    iconoExpandir.style.display = "block";
    iconoContraer.style.display = "none";
  }
}

function alternarPantallaCompleta() {
  if (!estaEnPantallaCompleta()) {
    if (cine.requestFullscreen) {
      cine.requestFullscreen();
    } else if (cine.webkitRequestFullscreen) {
      // Safari
      cine.webkitRequestFullscreen();
    }
  } else {
    salirDePantallaCompleta();
  }
}

btnPantallaCompleta.addEventListener("click", alternarPantallaCompleta);

document.addEventListener("fullscreenchange", actualizarIconoPantallaCompleta);
document.addEventListener("webkitfullscreenchange", actualizarIconoPantallaCompleta);

// Atajo de teclado: tecla "f" para alternar pantalla completa
document.addEventListener("keydown", (evento) => {
  if (evento.key === "f" || evento.key === "F") {
    alternarPantallaCompleta();
  }
});
