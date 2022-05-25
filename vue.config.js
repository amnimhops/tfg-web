const { defineConfig } = require('@vue/cli-service')
const Dotenv = require('dotenv-webpack');
const path = require('path');

/**
 * https://stackoverflow.com/questions/55510326/vue-cli-3-environment-variables-all-undefined
 * La maldita documentación no especifica que hay que cargar a mano los archivos de variables
 * de entorno...
 */
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  css: {
    loaderOptions: {      
      sass: {
        additionalData: `@import "@/styles/_variables.scss";`,
      },
    },
  },
  /* Configuración necesaria para que webpack cargue las librerias compartidas con el servidor */
  configureWebpack:{
    resolve:{
      alias:{
        'server': path.resolve(__dirname, '../server/src/models'),
        'backoffice': path.resolve(__dirname, '../backoffice/src')
      }
    },
    plugins: [
      new Dotenv()
    ]
  }
  
})
