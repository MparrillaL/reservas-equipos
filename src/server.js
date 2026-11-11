import { crearApp } from "./app.js";
import { config } from "./config/config.js"; // Si la config es inválida, se lanza el error aquí y el proceso no arranca

// Prepara la aplicación después de cargar y validar la configuración.
// Separar "construir la app" (app.js) de "arrancar a escuchar" (server.js) permite que
// Supertest pruebe la aplicación entera (rutas, middlewares...) sin abrir un puerto real.
const app = crearApp();

// Abre el puerto para aceptar peticiones HTTP.
app.listen(config.port, () => {
  // Confirma en la consola dónde se está ejecutando el servidor.
  console.log(
    `Servidor en http://localhost:${config.port} (${config.nodeEnv})`,
  );
});
