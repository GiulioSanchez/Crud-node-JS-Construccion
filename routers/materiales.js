const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Funciones de validación
function validarMaterial(material) {
  const errores = [];
  
  // Validar categoría
  if (!material.idcategoria || isNaN(parseInt(material.idcategoria))) {
    errores.push('La categoría es inválida');
  }
  
  // Validar nombre
  if (!material.nombre || material.nombre.trim() === '') {
    errores.push('El nombre es requerido');
  } else if (material.nombre.length < 3 || material.nombre.length > 100) {
    errores.push('El nombre debe tener entre 3 y 100 caracteres');
  }
  
  // Validar precio
  if (!material.precio) {
    errores.push('El precio es requerido');
  } else {
    const precioNum = parseFloat(material.precio);
    if (isNaN(precioNum) || precioNum <= 0 || precioNum > 999999.99) {
      errores.push('El precio debe ser un número mayor a 0 y menor a 1,000,000');
    }
  }
  
  // Validar disponibilidad
  if (!material.disponible || (material.disponible !== 'S' && material.disponible !== 'N')) {
    errores.push('La disponibilidad debe ser S o N');
  }
  
  // Validar descripción (opcional pero con restricciones si se proporciona)
  if (material.descripcion && material.descripcion.length > 200) {
    errores.push('La descripción no puede exceder los 200 caracteres');
  }
  
  return errores;
}

// Ruta principal - Mostrar todos los materiales
router.get('/', async(req, res) => {
  try {
    const consulta = `
      SELECT 
        M.idmaterial,
        C.categoria,
        M.nombre,
        M.precio,
        M.disponible,
        M.descripcion
      FROM materiales M
      INNER JOIN categorias C ON M.idcategoria = C.idcategoria`;
    const [materiales] = await db.query(consulta);
    
    // Asegurar que precio sea un número para cada material
    materiales.forEach(material => {
      material.precio = parseFloat(material.precio);
    });
    
    res.render('index', {materiales});
  } catch (error) {
    console.error(error);
    req.session.mensaje = 'Error al cargar los materiales';
    req.session.tipo = 'danger';
    res.status(500).send('Error al cargar los materiales');
  }
});

// Ruta para mostrar el formulario de creación
router.get('/create', async(req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categorias');
    res.render('create', {categorias, material: {}, errores: []});
  } catch (error) {
    console.error(error);
    req.session.mensaje = 'Error al cargar las categorías';
    req.session.tipo = 'danger';
    res.redirect('/');
  }
});

// Ruta para procesar la creación de un material
router.post('/create', async(req, res) => {
  try {
    const {categoria, nombre, precio, disponible, descripcion} = req.body;
    const nuevoMaterial = { 
      idcategoria: categoria, 
      nombre, 
      precio, 
      disponible, 
      descripcion: descripcion || null 
    };
    
    // Validar datos
    const errores = validarMaterial(nuevoMaterial);
    
    if (errores.length > 0) {
      const [categorias] = await db.query('SELECT * FROM categorias');
      return res.render('create', {
        categorias,
        material: nuevoMaterial,
        errores
      });
    }
    
    // Insertar en la base de datos
    await db.query(
      'INSERT INTO materiales (idcategoria, nombre, precio, disponible, descripcion) VALUES (?, ?, ?, ?, ?)',
      [categoria, nombre, precio, disponible, descripcion]
    );
    
    req.session.mensaje = 'Material creado exitosamente';
    req.session.tipo = 'success';
    
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.session.mensaje = 'Error al crear el material';
    req.session.tipo = 'danger';
    res.redirect('/create');
  }
});

// Ruta para eliminar un material
router.get('/delete/:id', async(req, res) => {
  try {
    const idEliminar = req.params.id;
    
    // Validar que el ID sea un número
    if (!idEliminar || isNaN(parseInt(idEliminar))) {
      req.session.mensaje = 'ID de material inválido';
      req.session.tipo = 'danger';
      return res.redirect('/');
    }
    
    // Verificar que el material existe
    const [material] = await db.query('SELECT * FROM materiales WHERE idmaterial = ?', [idEliminar]);
    
    if (material.length === 0) {
      req.session.mensaje = 'El material no existe o ya fue eliminado';
      req.session.tipo = 'warning';
      return res.redirect('/');
    }
    
    // Eliminar el material
    await db.query('DELETE FROM materiales WHERE idmaterial = ?', [idEliminar]);
    
    req.session.mensaje = 'Material eliminado exitosamente';
    req.session.tipo = 'success';
    
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.session.mensaje = 'Error al eliminar el material';
    req.session.tipo = 'danger';
    res.redirect('/');
  }
});

// Ruta para mostrar el formulario de edición
router.get('/edit/:id', async(req, res) => {
  try {
    const idMaterial = req.params.id;
    
    // Validar que el ID sea un número
    if (!idMaterial || isNaN(parseInt(idMaterial))) {
      req.session.mensaje = 'ID de material inválido';
      req.session.tipo = 'danger';
      return res.redirect('/');
    }
    
    const [materiales] = await db.query('SELECT * FROM materiales WHERE idmaterial = ?', [idMaterial]);
    
    if (materiales.length === 0) {
      req.session.mensaje = 'El material no existe';
      req.session.tipo = 'warning';
      return res.redirect('/');
    }
    
    const [categorias] = await db.query('SELECT * FROM categorias');
    
    res.render('edit', {
      categorias,
      material: materiales[0],
      errores: []
    });
  } catch (error) {
    console.error(error);
    req.session.mensaje = 'Error al cargar el material para edición';
    req.session.tipo = 'danger';
    res.redirect('/');
  }
});

// Ruta para procesar la actualización de un material
router.post('/edit/:id', async(req, res) => {
  try {
    const idMaterial = req.params.id;
    
    // Validar que el ID sea un número
    if (!idMaterial || isNaN(parseInt(idMaterial))) {
      req.session.mensaje = 'ID de material inválido';
      req.session.tipo = 'danger';
      return res.redirect('/');
    }
    
    const {categoria, nombre, precio, disponible, descripcion} = req.body;
    const materialActualizado = { 
      idcategoria: categoria, 
      nombre, 
      precio, 
      disponible, 
      descripcion: descripcion || null 
    };
    
    // Validar datos
    const errores = validarMaterial(materialActualizado);
    
    if (errores.length > 0) {
      const [categorias] = await db.query('SELECT * FROM categorias');
      return res.render('edit', {
        categorias,
        material: { ...materialActualizado, idmaterial: idMaterial },
        errores
      });
    }
    
    // Actualizar en la base de datos
    await db.query(
      'UPDATE materiales SET idcategoria = ?, nombre = ?, precio = ?, disponible = ?, descripcion = ? WHERE idmaterial = ?',
      [categoria, nombre, precio, disponible, descripcion, idMaterial]
    );
    
    req.session.mensaje = 'Material actualizado exitosamente';
    req.session.tipo = 'success';
    
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.session.mensaje = 'Error al actualizar el material';
    req.session.tipo = 'danger';
    res.redirect(`/edit/${req.params.id}`);
  }
});

module.exports = router;