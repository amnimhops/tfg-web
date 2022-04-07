<template>
  <div class="menu">
    <div class="menu-background"></div>
    <div class="menu-holder">
      <nav class="header responsive-container">
        <div class="logo">
          <img :src="logo" />
          <a href="#" @click="menuVisible = true" class="menu-opener"
            ><fa icon="bars"
          /></a>
          <a href="vendor.com" class="brand">vendor<span>.com</span></a>
        </div>
        <Transition>
          <div class="side-menu" v-if="menuVisible">
            <div class="menu-veil"></div>
            <div class="menu-content">
              <div class="menu-closer">
                <a href="#"
                  ><fa icon="window-close" @click="menuVisible = false"
                /></a>
              </div>
              <div class="menu-links">
                <template v-for="(item, index) in links" :key="index">
                  <a :href="item.href"
                    ><fa :icon="item.icon" />{{ item.title }}</a
                  >
                </template>
              </div>
            </div>
          </div>
        </Transition>
        <div class="menu-large menu-links">
          <template v-for="(item, index) in links" :key="index">
            <a :class="{ selected: index == 0 }" :href="item.href"
              ><fa :icon="item.icon" />{{ item.title }}</a
            >
          </template>
        </div>
      </nav>
    </div>
  </div>
</template>

<script lang="ts">
import logo from "@/assets/site/logo.svg";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      logo,
      links: [
        { title: "Inicio", href: "/", icon: "home" },
        { title: "Lista de juegos", href: "/gamelist", icon: "list" },
        { title: "Login", href: "/login", icon: "sign-in" },
      ],
      menuVisible: false,
    };
  },
});
</script>

<style lang="scss" scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.menu{
  width:100%;
  position:absolute;
}
.menu-background{
  background-color: #303030;
  height:50px;
  opacity:0.9;
}
.menu-holder{
  position:absolute;
  width:100%;
  top:0px;
}
.header {
  height: 50px;
  margin-left:auto;
  margin-right:auto;
  display: flex;
  flex-flow: column nowrap;
}
a:link,
a:visited {
  color: white;
  text-decoration: none;
  &:hover {
    color: $site-primary-color;
    text-decoration: underline;
  }
}
.logo {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 25px;
  img {
    @include invisible;
    padding: 15px;
    height: 100%;
    width: auto;
  }
  .brand {
    display: flex;
    font-size: 2em;
    flex-grow: 1;
    text-align: center;
    &:link,
    &:visited {
      text-decoration: none;
      color: white;
      font-family: sans-serif;
      font-weight: bold;
    }
    span {
      color: #f68c00;
    }
  }
  .menu-opener {
    padding: 15px;
    border: 0px none;
    color: white;
    font-size: 2em;
    &:link,
    &visited {
      text-decoration: none;
      color: white;
    }
    &:hover {
      color: $site-primary-color;
    }
    &:focus {
      color: $site-secondary-color;
    }
  }
}
.menu-veil {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: black;
  opacity: 0.5;
}
.menu-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 25px;
  bottom: 0;
  padding: 15px;
  margin: 0px;

  background-color: $site-background-color-dark;
  display: flex;
  flex-flow: row nowrap;
  align-items: left;
  justify-content: space-between;

  img {
    width: 32px;
    height: 32px;
  }
}
.menu-closer {
  order: 1;
  a:link,
  a:visited {
    color: white;
    font-size: 2em;
    &:hover {
      color: $site-primary-color;
    }
  }
}
.menu-links {
  display: flex;
  flex-flow: column nowrap;
  gap: 15px;
  font-size: 1.5em;
  a:link,
  a:visited {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 15px;
  }
}

.menu-large {
  @include invisible;
}

@media (min-width: 1024px) {
  .menu-opener {
    @include invisible;
  }
  .header {
    flex-flow: row nowrap;
  }
  .logo {
    justify-content: flex-start;
    gap: 5px;
    img {
      @include visible(block);
    }
    .brand {
      flex-grow: 0;
    }
  }
  .menu-large {
    @include visible(flex);

    flex-flow: row nowrap;
    justify-content: flex-end;
    align-items: stretch;
    flex-grow: 1;
    margin-right: 15px;
    a {
      padding: 15px;

      &.selected {
        background-color: blue;
      }
    }
  }
}
@media(min-width:1440px){
  .header{
      max-width: 1440px;
      margin-left:auto;
      margin-right:auto;
  }
}
</style>