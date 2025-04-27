const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

// Importación del router
const materialesRouter = require('./routers/materiales');

const app = express();

// Configuración de sesión
app.use(session({
  secret: 'construccion_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // En producción debería ser true si se usa HTTPS
    maxAge: 60000  // 1 minuto
  }
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para mensajes flash
app.use((req, res, next) => {
  // Hacer disponibles los mensajes flash en todas las vistas
  res.locals.mensaje = req.session.mensaje || null;
  res.locals.tipo = req.session.tipo || null;
  
  // Limpiar mensajes después de asignarlos
  if (req.session.mensaje) req.session.mensaje = null;
  if (req.session.tipo) req.session.tipo = null;
  
  next();
});

// Configuración del motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/', materialesRouter);

// Middleware para manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', { 
    mensaje: 'Página no encontrada', 
    tipo: 'warning',
    error: { status: 404, stack: '' } 
  });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    mensaje: 'Error interno del servidor', 
    tipo: 'danger',
    error: { status: 500, stack: process.env.NODE_ENV === 'development' ? err.stack : '' } 
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});