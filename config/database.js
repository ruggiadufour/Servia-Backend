module.exports = ({ env }) => (
  {
    defaultConnection: 'default',
    connections: {
      default: {
        connector: 'bookshelf',
        settings: {
          client: 'mysql',
          host: env('DATABASE_HOST', 'us-cdbr-east-02.cleardb.com'),
          port: env.int('DATABASE_PORT', 3306),
          database: env('DATABASE_NAME', 'heroku_4d58ad1506b5fd4'),
          username: env('DATABASE_USERNAME', 'bb855ac93dd138'),
          password: env('DATABASE_PASSWORD', '8831c6e5'),
          ssl: { 'rejectUnauthorized': false },
        },//mysql://bb855ac93dd138:8831c6e5@us-cdbr-east-02.cleardb.com/heroku_4d58ad1506b5fd4?reconnect=true
        options: {}
      },
    },
  }
); 
/*
{
    "defaultConnection": "default",
    "connections": {
      "default": {
        "connector": "bookshelf",
        "settings": {
          "client": "mysql",
          "host": "${process.env.DATABASE_HOST}",
          "port": "3306",
          "database": "${process.env.DATABASE_NAME}",
          "username": "${process.env.DATABASE_USERNAME}",
          "password": "${process.env.DATABASE_PASSWORD}",
          "ssl": { "rejectUnauthorized": false }
        },
        "options": {}
      }
    }
  }
}*/

/*
{
    defaultConnection: 'default',
    connections: {
      default: {
        connector: 'bookshelf',
        settings: {
          client: 'mysql',
          host: env('DATABASE_HOST', 'us-cdbr-east-02.cleardb.com'),
          port: env.int('DATABASE_PORT', 3306),
          database: env('DATABASE_NAME', 'heroku_4d58ad1506b5fd4'),
          username: env('DATABASE_USERNAME', 'bb855ac93dd138'),
          password: env('DATABASE_PASSWORD', '8831c6e5'),
          ssl: env.bool('DATABASE_SSL', false),
        },//mysql://bb855ac93dd138:8831c6e5@us-cdbr-east-02.cleardb.com/heroku_4d58ad1506b5fd4?reconnect=true
        options: {}
      },
    },
  }
*/