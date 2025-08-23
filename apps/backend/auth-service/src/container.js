// src/container.js
const createContainer = () => {
  const services = new Map();
  const factories = new Map();

  const register = (name, factory) => {
    factories.set(name, factory);
  };

  const get = (name) => {
    // Return cached instance if exists
    if (services.has(name)) {
      return services.get(name);
    }

    // Get factory and create instance
    const factory = factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found`);
    }

    // Lazy instantiation
    const instance = factory();
    services.set(name, instance); // Cache the instance
    return instance;
  };

  const has = (name) => {
    return factories.has(name);
  };

  const clear = () => {
    services.clear();
    factories.clear();
  };

  return { register, get, has, clear };
};

module.exports = { createContainer };