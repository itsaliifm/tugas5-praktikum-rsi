import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Review Kantin API',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3000' }],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Masukkan Bearer diikuti token JWT',
    },
  },
  definitions: {
    StallInput: {
      $name: 'Warung Baru',
      category: 'Nasi',
      location: 'Kantin FK',
      description: '',
    },
  },
};

const outputFile = './src/docs/swagger-output.json';
// Cukup index.ts: swagger-autogen mengikuti app.use(...) ke setiap router
// dan memberi prefix /api/v1 dengan benar. Kalau file router ikut didaftarkan
// sendiri, muncul path ganda tanpa prefix (misalnya "/" dan "/{id}").
const endpointsFiles = ['./src/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
