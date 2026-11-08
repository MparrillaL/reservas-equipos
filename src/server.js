import { crearApp } from './app.js';
import { config } from './config/config.js';   // Si la config es inválida, se lanza el error aquí

// Prepara la aplicación después de cargar y validar la configuración.
const app = crearApp();
// Abre el puerto para aceptar peticiones HTTP.
app.listen(config.port, () => {
  // Confirma en la consola dónde se está ejecutando el servidor.
  console.log(`Servidor en http://localhost:${config.port} (${config.nodeEnv})`);
});