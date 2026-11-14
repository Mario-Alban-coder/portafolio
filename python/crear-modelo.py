"""Genera el modelo 3D del logo "M en marcha" en formato GLB (glTF binario).

Uso:  python3 crear-modelo.py
Crea modelos/logo-m.glb. No necesita librerías externas.
"""
import json
import math
import os
import struct

AQUI = os.path.dirname(os.path.abspath(__file__))
K = 0.2          # inclinación del logo (la misma que en Illustrator)
ESCALA = 1 / 400  # de unidades del logo a metros


def a3d(x, y, z=0.0):
    """Coordenadas del logo (y hacia abajo) -> espacio 3D (y hacia arriba), con la inclinación."""
    return ((x - 500 + K * (510 - y)) * ESCALA, (510 - y) * ESCALA, z * ESCALA)


def norm(v):
    largo = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / largo for c in v)


class Malla:
    def __init__(self):
        self.pos, self.nor, self.idx = [], [], []

    def vertice(self, p, n):
        self.pos.append(p)
        self.nor.append(norm(n))
        return len(self.pos) - 1

    def cuadro(self, a, b, c, d):
        self.idx += [a, b, c, a, c, d]

    def tubo(self, centros, radio, lados=28):
        """Tubo a lo largo de una línea en el plano z=0 (centros en coordenadas del logo)."""
        pts = [a3d(x, y) for x, y in centros]
        r = radio * ESCALA
        anillos = []
        for i, c in enumerate(pts):
            a, b = pts[max(i - 1, 0)], pts[min(i + 1, len(pts) - 1)]
            t = norm((b[0] - a[0], b[1] - a[1], 0))
            lateral = (-t[1], t[0], 0)  # perpendicular dentro del plano
            anillo = []
            for k in range(lados + 1):
                ang = 2 * math.pi * k / lados
                n = (math.cos(ang) * lateral[0], math.cos(ang) * lateral[1], math.sin(ang))
                anillo.append(self.vertice((c[0] + r * n[0], c[1] + r * n[1], r * n[2]), n))
            anillos.append(anillo)
        for i in range(len(anillos) - 1):
            for k in range(lados):
                self.cuadro(anillos[i][k], anillos[i + 1][k], anillos[i + 1][k + 1], anillos[i][k + 1])

    def esfera(self, cx, cy, radio, lados=28, pisos=18):
        c, r = a3d(cx, cy), radio * ESCALA
        filas = []
        for j in range(pisos + 1):
            lat = math.pi * j / pisos
            fila = []
            for k in range(lados + 1):
                lon = 2 * math.pi * k / lados
                n = (math.sin(lat) * math.cos(lon), math.cos(lat), math.sin(lat) * math.sin(lon))
                fila.append(self.vertice((c[0] + r * n[0], c[1] + r * n[1], c[2] + r * n[2]), n))
            filas.append(fila)
        for j in range(pisos):
            for k in range(lados):
                self.cuadro(filas[j][k], filas[j][k + 1], filas[j + 1][k + 1], filas[j + 1][k])

    def capsula(self, p0, p1, radio):
        self.tubo([p0, p1], radio, lados=20)
        self.esfera(p0[0], p0[1], radio, 20, 12)
        self.esfera(p1[0], p1[1], radio, 20, 12)

    def prisma_redondeado(self, esquinas, radio, fondo):
        """Polígono con esquinas redondeadas, extruido en z (para el play)."""
        contorno = []  # (punto 2D, normal 2D)
        cx = sum(p[0] for p in esquinas) / len(esquinas)
        cy = sum(p[1] for p in esquinas) / len(esquinas)
        n = len(esquinas)
        for i, p in enumerate(esquinas):
            ant, sig = esquinas[i - 1], esquinas[(i + 1) % n]

            def normal_lado(a, b):
                d = norm((b[0] - a[0], b[1] - a[1], 0))
                nl = (d[1], -d[0])
                if nl[0] * ((a[0] + b[0]) / 2 - cx) + nl[1] * ((a[1] + b[1]) / 2 - cy) < 0:
                    nl = (-nl[0], -nl[1])
                return nl

            n0, n1 = normal_lado(ant, p), normal_lado(p, sig)
            a0, a1 = math.atan2(n0[1], n0[0]), math.atan2(n1[1], n1[0])
            while a1 - a0 > math.pi:
                a1 -= 2 * math.pi
            while a1 - a0 < -math.pi:
                a1 += 2 * math.pi
            for s in range(9):
                ang = a0 + (a1 - a0) * s / 8
                nl = (math.cos(ang), math.sin(ang))
                contorno.append(((p[0] + radio * nl[0], p[1] + radio * nl[1]), nl))
        contorno.append(contorno[0])

        # Lados
        delante, detras = [], []
        for (x, y), nl in contorno:
            n3 = norm((nl[0] - K * 0, -nl[1], 0))  # en 3D la y se invierte
            delante.append(self.vertice(a3d(x, y, fondo), n3))
            detras.append(self.vertice(a3d(x, y, -fondo), n3))
        for i in range(len(contorno) - 1):
            self.cuadro(delante[i], delante[i + 1], detras[i + 1], detras[i])
        # Tapas
        for z, nz in ((fondo, 1), (-fondo, -1)):
            centro = self.vertice(a3d(cx, cy, z), (0, 0, nz))
            borde = [self.vertice(a3d(x, y, z), (0, 0, nz)) for (x, y), _ in contorno]
            for i in range(len(borde) - 1):
                tri = [centro, borde[i], borde[i + 1]]
                self.idx += tri if nz < 0 else tri[::-1]


def bezier(p0, c0, c1, p1, pasos=26):
    pts = []
    for i in range(pasos + 1):
        t = i / pasos
        u = 1 - t
        pts.append(tuple(u ** 3 * p0[k] + 3 * u * u * t * c0[k] + 3 * u * t * t * c1[k] + t ** 3 * p1[k] for k in (0, 1)))
    return pts


# ---------- Piezas del logo ----------
linea = Malla()   # la M: una sola línea (crema)
R = 50
linea.tubo([(240, 770), (240, 250)], R)
linea.esfera(240, 250, R)
linea.tubo(bezier((240, 250), (330, 430), (420, 590), (500, 590)) + bezier((500, 590), (580, 590), (670, 430), (760, 250))[1:], R)
linea.esfera(760, 250, R)
linea.tubo([(760, 250), (760, 615)], R)
linea.esfera(760, 615, R)

acento = Malla()  # REC + PLAY + estela principal (lima)
acento.esfera(240, 772, 64, 36, 24)
acento.prisma_redondeado([(700, 712), (820, 712), (760, 810)], 20, 46)
acento.capsula((0, 330), (150, 330), 13)

estelas = Malla()  # estelas de velocidad (gris)
estelas.capsula((45, 440), (140, 440), 13)
estelas.capsula((-25, 550), (100, 550), 13)


def lineal(hex_):
    """Color sRGB en hexadecimal -> lineal, como lo pide glTF."""
    def canal(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return [round(canal(int(hex_[i:i + 2], 16)), 4) for i in (0, 2, 4)] + [1]


piezas = [
    ("M (una sola linea)", linea, {"name": "Crema", "pbrMetallicRoughness": {"baseColorFactor": lineal("F4F1EB"), "metallicFactor": 0.05, "roughnessFactor": 0.32}}),
    ("REC y PLAY", acento, {"name": "Lima", "pbrMetallicRoughness": {"baseColorFactor": lineal("D9FF45"), "metallicFactor": 0.0, "roughnessFactor": 0.28}, "emissiveFactor": [0.10, 0.13, 0.0]}),
    ("Estelas", estelas, {"name": "Gris", "pbrMetallicRoughness": {"baseColorFactor": lineal("6A6A6A"), "metallicFactor": 0.2, "roughnessFactor": 0.45}}),
]

# ---------- Escribir el GLB ----------
binario = bytearray()
vistas, accesores, mallas, nodos, materiales = [], [], [], [], []


def agregar(datos, destino=None):
    while len(binario) % 4:
        binario.append(0)
    vista = {"buffer": 0, "byteOffset": len(binario), "byteLength": len(datos)}
    if destino:
        vista["target"] = destino
    binario.extend(datos)
    vistas.append(vista)
    return len(vistas) - 1


for nombre, m, material in piezas:
    assert len(m.pos) < 65536, nombre
    v_pos = agregar(b"".join(struct.pack("<3f", *p) for p in m.pos), 34962)
    v_nor = agregar(b"".join(struct.pack("<3f", *n) for n in m.nor), 34962)
    v_idx = agregar(struct.pack("<%dH" % len(m.idx), *m.idx), 34963)
    base = len(accesores)
    accesores += [
        {"bufferView": v_pos, "componentType": 5126, "count": len(m.pos), "type": "VEC3",
         "min": [min(p[k] for p in m.pos) for k in range(3)], "max": [max(p[k] for p in m.pos) for k in range(3)]},
        {"bufferView": v_nor, "componentType": 5126, "count": len(m.nor), "type": "VEC3"},
        {"bufferView": v_idx, "componentType": 5123, "count": len(m.idx), "type": "SCALAR"},
    ]
    materiales.append(material)
    mallas.append({"name": nombre, "primitives": [{"attributes": {"POSITION": base, "NORMAL": base + 1}, "indices": base + 2, "material": len(materiales) - 1}]})
    nodos.append({"name": nombre, "mesh": len(mallas) - 1})

while len(binario) % 4:
    binario.append(0)

gltf = {
    "asset": {"version": "2.0", "generator": "crear-modelo.py - Mario Alban", "copyright": "Mario Alban"},
    "scene": 0,
    "scenes": [{"name": "M en marcha", "nodes": [len(nodos)]}],
    "nodes": nodos + [{"name": "Logo M en marcha", "children": list(range(len(nodos)))}],
    "meshes": mallas, "materials": materiales, "accessors": accesores, "bufferViews": vistas,
    "buffers": [{"byteLength": len(binario)}],
}
texto = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
texto += b" " * (-len(texto) % 4)

salida = os.path.join(AQUI, "..", "modelos", "logo-m.glb")
with open(salida, "wb") as f:
    f.write(struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(texto) + 8 + len(binario)))
    f.write(struct.pack("<I4s", len(texto), b"JSON") + texto)
    f.write(struct.pack("<I4s", len(binario), b"BIN\0") + bytes(binario))

print("logo-m.glb: %.0f KB, %d vértices, %d triángulos" % (
    os.path.getsize(salida) / 1024, sum(len(m.pos) for _, m, _ in piezas), sum(len(m.idx) for _, m, _ in piezas) // 3))
