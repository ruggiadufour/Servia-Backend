module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'mysql',
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3060),
        database: env('DATABASE_NAME', 'AppServicios_BD'),
        username: env('DATABASE_USERNAME', 'root'),
        password: env('DATABASE_PASSWORD', 'root'),
        ssl: env.bool('DATABASE_SSL', true),
      },
      options: {}
    },
  },
}); 
