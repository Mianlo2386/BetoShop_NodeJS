import Producto from '../schemas/producto.schema.js';
import Promotion from '../schemas/promocion.schema.js';

class ProductoService {

  async obtenerTodos(opciones = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'nombre',
      sortOrder = 'asc',
      categoria,
      subcategoria,
      precioMin,
      precioMax,
    } = opciones;

    const query = { 'audit.isActive': true };

    if (categoria) {
      query.categoria = categoria;
    }

    if (subcategoria) {
      query.subcategoria = subcategoria;
    }

    if (precioMin !== undefined || precioMax !== undefined) {
      query.precio = {};
      if (precioMin !== undefined) {
        query.precio.$gte = precioMin;
      }
      if (precioMax !== undefined) {
        query.precio.$lte = precioMax;
      }
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [productos, total] = await Promise.all([
      Producto.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Producto.countDocuments(query),
    ]);

    return {
      data: productos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async obtenerPorId(id) {
    const producto = await Producto.findByIdActive(id).lean();
    
    if (!producto) {
      return null;
    }

    return producto;
  }

  async buscarPorNombreCategoriaSubcategoria(query) {
    const productos = await Producto.search(query);
    return productos;
  }

  async obtenerReleases(daysAgo = 30) {
    const releases = await Producto.findReleases(daysAgo);
    return releases;
  }

  async obtenerPorCategoria(categoria, opciones = {}) {
    const { page = 1, limit = 50 } = opciones;
    
    const query = { 
      'audit.isActive': true,
      categoria: new RegExp(categoria, 'i'),
    };

    const skip = (page - 1) * limit;

    const [productos, total] = await Promise.all([
      Producto.find(query)
        .sort({ releaseDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Producto.countDocuments(query),
    ]);

    return {
      data: productos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async obtenerPorRangoPrecio(min, max, opciones = {}) {
    const { page = 1, limit = 50 } = opciones;

    const query = {
      'audit.isActive': true,
      precio: {
        $gte: min,
        $lte: max,
      },
    };

    const skip = (page - 1) * limit;

    const [productos, total] = await Promise.all([
      Producto.find(query)
        .sort({ precio: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Producto.countDocuments(query),
    ]);

    return {
      data: productos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async crear(productoData, createdBy = 'system') {
    const producto = new Producto(productoData);
    producto.audit.createdBy = createdBy;
    producto.audit.updatedBy = createdBy;
    await producto.save();
    return producto;
  }

  async actualizar(id, productoData, updatedBy = 'system') {
    const producto = await Producto.findByIdActive(id);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    Object.assign(producto, productoData);
    producto.audit.updatedBy = updatedBy;
    await producto.save();
    return producto;
  }

  async eliminar(id, deletedBy = 'system') {
    const producto = await Producto.findByIdActive(id);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    await producto.softDelete(deletedBy);
    return producto;
  }

  async restaurar(id, restoredBy = 'system') {
    const producto = await Producto.findById(id);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    await producto.restore(restoredBy);
    return producto;
  }

  async obtenerEstadisticas() {
    const stats = await Producto.aggregate([
      { $match: { 'audit.isActive': true } },
      {
        $group: {
          _id: null,
          totalProductos: { $sum: 1 },
          precioPromedio: { $avg: '$precio' },
          precioMin: { $min: '$precio' },
          precioMax: { $max: '$precio' },
          stockTotal: { $sum: '$stock' },
          categorias: { $addToSet: '$categoria' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalProductos: 0,
        precioPromedio: 0,
        precioMin: 0,
        precioMax: 0,
        stockTotal: 0,
        totalCategorias: 0,
      };
    }

    return {
      totalProductos: stats[0].totalProductos,
      precioPromedio: Math.round(stats[0].precioPromedio * 100) / 100,
      precioMin: stats[0].precioMin,
      precioMax: stats[0].precioMax,
      stockTotal: stats[0].stockTotal,
      totalCategorias: stats[0].categorias.filter(c => c).length,
    };
  }

  async obtenerCategorias() {
    const categorias = await Producto.distinct('categoria', { 'audit.isActive': true });
    return categorias.filter(c => c);
  }

  async obtenerSubcategorias(categoria) {
    const query = { 'audit.isActive': true };
    if (categoria) {
      query.categoria = categoria;
    }
    const subcategorias = await Producto.distinct('subcategoria', query);
    return subcategorias.filter(s => s);
  }
}

export default new ProductoService();
