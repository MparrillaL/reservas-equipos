import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { crearApp } from "../src/app.js";
import { equiposRepository } from "../src/repositories/equiposRepository.js";
import { reservasRepository } from "../src/repositories/reservasRepository.js";
import { usuariosRepository } from "../src/repositories/usuariosRepository.js";

let app;

// Antes de CADA test: datos iniciales limpios y app nueva
beforeEach(() => {
  equiposRepository.reiniciar();
  reservasRepository.reiniciar();
  usuariosRepository.reiniciar();
  app = crearApp();
});

// ---------- Helpers ----------

// Hace GET a una página y saca el token CSRF del HTML con una expresión regular
async function obtenerCsrf(agente, url = "/login") {
  const res = await agente.get(url);
  const coincidencia = res.text.match(/name="_csrf" value="([^"]+)"/);
  return coincidencia[1];
}

// Inicia sesión con un agente (que guardará la cookie) y devuelve la respuesta
async function iniciarSesion(agente, email, password) {
  const _csrf = await obtenerCsrf(agente);
  return agente.post("/login").type("form").send({ email, password, _csrf });
}

// Una fecha siempre futura (dentro de un año), para que el test no caduque
function fechaFutura() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// ---------- Pruebas ----------

describe("Autenticación", () => {
  it("1. registra un usuario válido", async () => {
    const agente = request.agent(app);
    const _csrf = await obtenerCsrf(agente, "/registro");
    const res = await agente
      .post("/registro")
      .type("form")
      .send({
        nombre: "Marta",
        email: "marta@example.com",
        password: "Marta1234",
        _csrf,
      });

    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/login");
    expect(usuariosRepository.obtenerPorEmail("marta@example.com").rol).toBe(
      "usuario",
    );
  });

  it("2. rechaza credenciales incorrectas", async () => {
    const res = await iniciarSesion(
      request.agent(app),
      "ana@example.com",
      "malamala",
    );
    expect(res.status).toBe(401);
  });

  it("3. redirige al login si se accede a una ruta privada sin sesión", async () => {
    const res = await request(app).get("/perfil");
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/login");
  });

  it("4. permite el acceso a una ruta privada con sesión", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const res = await agente.get("/perfil");

    expect(res.status).toBe(200);
    expect(res.text).toContain("ana@example.com");
  });

  it("10. invalida la sesión tras el logout", async () => {
    const agente = request.agent(app);
    const login = await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const cookieAntigua = login.headers["set-cookie"]; // guardamos la cookie de sesión

    const _csrf = await obtenerCsrf(agente, "/perfil");
    await agente.post("/logout").type("form").send({ _csrf });

    // Reutilizamos la cookie ANTIGUA a mano: si la sesión se destruyó en el servidor, no sirve
    const res = await request(app).get("/perfil").set("Cookie", cookieAntigua);
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/login");
  });
});

describe("Autorización y seguridad", () => {
  it("5. impide a un usuario ordinario una operación de admin", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const _csrf = await obtenerCsrf(agente, "/perfil");
    const res = await agente
      .post("/admin/equipos/1/estado")
      .type("form")
      .send({ estado: "fuera_de_servicio", _csrf });

    expect(res.status).toBe(403);
    expect(equiposRepository.obtenerPorId(1).estado).toBe("operativo"); // no ha cambiado
  });

  it("8. impide cancelar una reserva ajena", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const _csrf = await obtenerCsrf(agente, "/perfil");
    const res = await agente
      .post("/reservas/2/cancelar")
      .type("form")
      .send({ _csrf });

    expect(res.status).toBe(403);
    expect(reservasRepository.obtenerPorId(2).estado).toBe("activa");
  });

  it("9. rechaza un cambio de estado sin token CSRF válido", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const res = await agente
      .post("/reservas/1/cancelar")
      .type("form")
      .send({ _csrf: "token-falso" });

    expect(res.status).toBe(403);
    expect(reservasRepository.obtenerPorId(1).estado).toBe("activa");
  });
});

describe("Reservas", () => {
  it("6. crea una reserva válida de un equipo disponible", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "ana@example.com", "Ana12345");
    const _csrf = await obtenerCsrf(agente, "/reservas/nueva");
    const res = await agente
      .post("/reservas")
      .type("form")
      .send({ equipoId: "2", fecha: fechaFutura(), turno: "manana", _csrf });

    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/mis-reservas");
    expect(reservasRepository.obtenerPorUsuario(2)).toHaveLength(2); // tenía 1, ahora 2
  });

  it("7. rechaza una reserva duplicada para el mismo equipo, fecha y turno", async () => {
    const agente = request.agent(app);
    await iniciarSesion(agente, "luis@example.com", "Luis12345");
    const _csrf = await obtenerCsrf(agente, "/reservas/nueva");
    // El equipo 1 ya está reservado por Ana el 2027-01-15 por la mañana (datos iniciales)
    const res = await agente
      .post("/reservas")
      .type("form")
      .send({ equipoId: "1", fecha: "2027-01-15", turno: "manana", _csrf });

    expect(res.status).toBe(409);
  });
});
