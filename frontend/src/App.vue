<script setup>
import DevRoleSwitcher from '@/components/DevRoleSwitcher.vue';
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="auth-page" mode="out-in">
      <component :is="Component" v-if="Component" />
    </Transition>
  </RouterView>
  <DevRoleSwitcher />
</template>

<style>
.auth-page-enter-active {
  transition: opacity 0.22s ease-out, transform 0.22s ease-out;
}
.auth-page-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
.auth-page-enter-from {
  opacity: 0;
  transform: translateX(18px);
}
.auth-page-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}
</style>

