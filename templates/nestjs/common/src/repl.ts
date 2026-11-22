import { repl } from '@nestjs/core';
import { AppModule } from './app.module.js';

// `start:repl`: consola interactiva con los providers de la app.
await repl(AppModule);
