const { defineConfig } = require('@vue/cli-service')
const path = require('path');

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
        'shared': path.resolve(__dirname, '../shared/'),
      }
    }
  }
  
})
