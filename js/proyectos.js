// Proyectos: filtros por categoría.
const proyectos = document.querySelectorAll(".galeria .proyecto");
document.querySelectorAll(".filtro").forEach((filtro) => {
  filtro.addEventListener("click", () => {
    document.querySelectorAll(".filtro").forEach((f) => {
      f.classList.toggle("activo", f === filtro);
      f.setAttribute("aria-pressed", f === filtro);
    });
    const elegido = filtro.dataset.filtro;
    proyectos.forEach((proyecto) => {
      const categorias = proyecto.dataset.categoria.split(" ");
      const visible = elegido === "todos" || categorias.includes("todos") || categorias.includes(elegido);
      proyecto.classList.toggle("oculto", !visible);
      if (visible) {
        proyecto.classList.add("entrando");
        requestAnimationFrame(() => requestAnimationFrame(() => proyecto.classList.remove("entrando")));
      }
    });
  });
});

// Proyectos: vista previa del video al pasar el mouse.
document.querySelectorAll(".proyecto video").forEach((video) => {
  const proyecto = video.closest(".proyecto");
  proyecto.addEventListener("pointerenter", () => {
    video.play().then(() => proyecto.classList.add("reproduciendo")).catch(() => {});
  });
  proyecto.addEventListener("pointerleave", () => {
    video.pause();
    proyecto.classList.remove("reproduciendo");
  });
});

// Proyectos: visor para ver videos, diseños, el podcast y la película interactiva.
const visor = document.getElementById("visor");
const visorContenido = visor.querySelector(".visor-contenido");
const visorVersiones = visor.querySelector(".visor-versiones");

function crearVideo(src) {
  const video = document.createElement("video");
  video.src = src;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  return video;
}

function mostrarEnVisor(proyecto) {
  const { tipo, src, titulo, desc, versiones, portada } = proyecto.dataset;
  visorContenido.innerHTML = "";
  visorVersiones.innerHTML = "";

  if (tipo === "interactivo") {
    const marco = document.createElement("iframe");
    marco.src = src;
    marco.title = titulo;
    marco.allow = "autoplay; fullscreen";
    marco.allowFullscreen = true;
    visorContenido.append(marco);
  } else if (tipo === "audio") {
    // La estructura del reproductor está en index.html (plantilla "plantilla-audio").
    const bloque = document.getElementById("plantilla-audio").content.firstElementChild.cloneNode(true);
    bloque.querySelector("img").src = portada;
    bloque.querySelector("h3").textContent = proyecto.querySelector(".proyecto-titulo").textContent;
    bloque.querySelector("audio").src = src;
    visorContenido.append(bloque);
  } else if (tipo === "imagen") {
    const imagen = document.createElement("img");
    imagen.src = src;
    imagen.alt = titulo;
    visorContenido.append(imagen);
  } else if (versiones) {
    // Varias versiones del mismo video: botones para cambiar entre ellas.
    const lista = versiones.split(";").map((v) => v.split("|"));
    visorContenido.append(crearVideo(lista[0][1]));
    lista.forEach(([nombre, archivo], i) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "filtro" + (i === 0 ? " activo" : "");
      boton.textContent = nombre;
      boton.addEventListener("click", () => {
        visorVersiones.querySelectorAll(".filtro").forEach((b) => b.classList.toggle("activo", b === boton));
        visorContenido.replaceChildren(crearVideo(archivo));
      });
      visorVersiones.append(boton);
    });
  } else {
    visorContenido.append(crearVideo(src));
  }

  visor.querySelector(".visor-titulo").textContent = titulo;
  visor.querySelector(".visor-desc").textContent = desc || "";
  visor.showModal();
}

document.querySelectorAll(".proyecto[data-tipo]").forEach((proyecto) => {
  proyecto.addEventListener("click", () => mostrarEnVisor(proyecto));
});

visor.querySelector(".visor-cerrar").addEventListener("click", () => visor.close());
visor.addEventListener("click", (evento) => {
  if (evento.target === visor) visor.close();
});
visor.addEventListener("close", () => {
  if (visor.open) return; // ya se abrió otro proyecto: no hay que vaciarlo
  visorContenido.innerHTML = "";
  visorVersiones.innerHTML = "";
});
