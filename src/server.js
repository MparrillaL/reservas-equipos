import { crearApp } from './app.js';
import { config } from './config/config.js';   // Si la config es inválida, se lanza el error aquí

const app = crearApp();
app.listen(config.port, () => {
  console.log(`Servidor en http://localhost:${config.port} (${config.nodeEnv})`);
});