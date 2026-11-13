// Modelo 3D del logo: acabados, giro automático y reinicio de la vista.
{
  const visor3d = document.getElementById("modelo-logo");
  const escena = visor3d.closest(".marca3d-escena");
  const botonGiro = document.getElementById("modelo-giro");
  const botonReiniciar = document.getElementById("modelo-reiniciar");
  const botonesAcabado = document.querySelectorAll("[data-acabado]");
  const VISTA_INICIAL = visor3d.getAttribute("camera-orbit");

  // Abierta con doble clic (file://) la página no puede leer el .glb: se usa la copia incluida en js/modelo-logo.js.
  if (location.protocol === "file:") {
    visor3d.src = "data:model/gltf-binary;base64," + MODELO_LOGO_BASE64;
  }

  // Cada acabado define color, metal y rugosidad de los tres materiales del modelo.
  const ACABADOS = {
    original: { Crema: ["#f4f1eb", 0.05, 0.32], Lima: ["#d9ff45", 0, 0.28], Gris: ["#6a6a6a", 0.2, 0.45] },
    lima: { Crema: ["#d9ff45", 0, 0.3], Lima: ["#f4f1eb", 0, 0.3], Gris: ["#f4f1eb", 0, 0.4] },
    cromo: { Crema: ["#e8e8e8", 1, 0.12], Lima: ["#d9ff45", 0.6, 0.2], Gris: ["#9a9a9a", 1, 0.2] },
  };

  function aplicarAcabado(nombre) {
    if (!visor3d.model) return;
    visor3d.model.materials.forEach((material) => {
      const valores = ACABADOS[nombre][material.name];
      if (!valores) return;
      const [color, metal, rugosidad] = valores;
      material.pbrMetallicRoughness.setBaseColorFactor(color);
      material.pbrMetallicRoughness.setMetallicFactor(metal);
      material.pbrMetallicRoughness.setRoughnessFactor(rugosidad);
    });
  }

  botonesAcabado.forEach((boton) => {
    boton.addEventListener("click", () => {
      botonesAcabado.forEach((b) => b.classList.toggle("activo", b === boton));
      aplicarAcabado(boton.dataset.acabado);
    });
  });

  botonGiro.addEventListener("click", () => {
    const girando = visor3d.toggleAttribute("auto-rotate");
    botonGiro.setAttribute("aria-pressed", girando);
  });

  botonReiniciar.addEventListener("click", () => {
    visor3d.cameraOrbit = VISTA_INICIAL;
    visor3d.resetTurntableRotation?.();
    visor3d.jumpCameraToGoal?.();
  });

  // Al girar el modelo por primera vez desaparece la pista "Arrastra para girar".
  visor3d.addEventListener("camera-change", (evento) => {
    if (evento.detail.source === "user-interaction") escena.classList.add("usado");
  });

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    visor3d.removeAttribute("auto-rotate");
    botonGiro.setAttribute("aria-pressed", "false");
  }
}
