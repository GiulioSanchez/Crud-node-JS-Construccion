CREATE DATABASE construccion;
USE construccion;

CREATE TABLE categorias(
  idcategoria INT AUTO_INCREMENT PRIMARY KEY,
  categoria VARCHAR(50) NOT NULL,
  CONSTRAINT uk_categoria UNIQUE (categoria)
) ENGINE = INNODB;

CREATE TABLE materiales(
  idmaterial INT AUTO_INCREMENT PRIMARY KEY,
  idcategoria INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  disponible ENUM('S','N') NOT NULL,
  descripcion VARCHAR(200) NULL,
  CONSTRAINT fk_idcategoria_mat FOREIGN KEY (idcategoria) REFERENCES categorias (idcategoria)
) ENGINE = INNODB;

INSERT INTO categorias (categoria) VALUES
('Cemento y concreto'),
('Acero y estructuras'),
('Acabados'),
('Herramientas');

INSERT INTO materiales (idcategoria, nombre, precio, disponible, descripcion) VALUES
(1, 'Cemento Portland 50kg', 120.50, 'S', 'Cemento gris para uso general en construcción'),
(1, 'Arena fina m³', 450.00, 'S', 'Arena lavada para acabados'),
(2, 'Varilla 3/8" (6m)', 85.30, 'S', 'Varilla corrugada para refuerzo estructural'),
(3, 'Pintura blanca 19L', 580.00, 'N', 'Pintura vinílica para interiores');