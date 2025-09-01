// src/container.js
const createContainer = () => {
  const services = new Map();
  const factories = new Map();
  const options = new Map();

  const register = (name, factory, opts = {}) => {
    factories.set(name, factory);
    options.set(name, opts);
  };

  const get = (name) => {
    const opts = options.get(name) || {};
    
    // Return cached singleton if exists
    if (opts.singleton && services.has(name)) {
      return services.get(name);
    }

    // Get factory and create instance
    const factory = factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found`);
    }

    // Lazy instantiation - pass container to factory if it's a function
    const instance = typeof factory === 'function' ? factory(containerInstance) : factory;
    
    if (opts.singleton) {
      services.set(name, instance);
    }
    
    return instance;
  };

  const has = (name) => {
    return factories.has(name);
  };

  const clear = () => {
    services.clear();
    factories.clear();
    options.clear();
  };

  const containerInstance = { register, get, has, clear };
  return containerInstance;
};

class Container {
  constructor() {
    return createContainer();
  }
}

module.exports = { Container, createContainer };